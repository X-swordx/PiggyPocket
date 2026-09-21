import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository, SelectQueryBuilder } from "typeorm";
import { ChatOpenAI } from "@langchain/openai";
import { ExpiryItem } from "./entities/expiry-item.entity";
import { ExpiryItemNotification } from "./entities/expiry-item-notification.entity";
import { DiningGroupMember } from "../foodie-buddy/dining-group/entities/dining-group-member.entity";
import { CreateExpiryItemDto } from "./dto/create-expiry-item.dto";
import { UpdateExpiryItemDto } from "./dto/update-expiry-item.dto";
import {
  SearchExpiryItemDto,
  SearchExpiryStatus,
} from "./dto/search-expiry-item.dto";
import { buildSearchText } from "./expiry-labels";
import { selectHits } from "./expiry-search-ranking";
import {
  RERANK_MODEL,
  RERANK_TOP_K,
  RERANK_SYSTEM_PROMPT,
  buildRerankInput,
  parseRerankIds,
} from "./expiry-search-rerank";
import { ItemVectorService } from "../vector/item-vector.service";
import { PaginationDto } from "../../common/dto/pagination.dto";
import {
  addShelfLife,
  resolveExpiryDate,
  ShelfLifeUnit,
} from "./shelf-life";

/**
 * 取分数分布用的检索宽度。要判断「某条是否显著高于其他」就得先看到整个分布，
 * 所以不能只捞 topK；家庭物品量级下这个宽度一次就能把全部物品捞回来。
 */
const DISTRIBUTION_LIMIT = 100;

export type ExpiryStatus = "fresh" | "expiring" | "expired";

export interface ExpiryItemResponse extends ExpiryItem {
  status: ExpiryStatus;
  statusText: string;
  daysRemaining: number;
  daysText: string;
}

/**
 * MySQL 会话时区是 UTC，CURDATE() 在北京时间 00:00-08:00 会返回前一天，
 * 使到期状态整体错一天。这里显式换算出东八区当天。
 */
export const BEIJING_TODAY = `DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00'))`;

/**
 * 按状态过滤。阈值取每条记录自己的 `remindDays`，不能用统一常量：
 * 设了「提前 30 天提醒」的物品，收到提醒时列表里也应该显示「即将到期」。
 * mobile 与 admin 两个 service 共用这一份条件。
 */
export const applyStatusFilter = <T>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  status?: ExpiryStatus
): SelectQueryBuilder<T> => {
  const threshold = `DATE_ADD(${BEIJING_TODAY}, INTERVAL ${alias}.remindDays DAY)`;
  if (status === "expired") {
    qb.andWhere(`${alias}.expiryDate < ${BEIJING_TODAY}`);
  } else if (status === "expiring") {
    qb.andWhere(
      `${alias}.expiryDate >= ${BEIJING_TODAY} AND ${alias}.expiryDate <= ${threshold}`
    );
  } else if (status === "fresh") {
    qb.andWhere(`${alias}.expiryDate > ${threshold}`);
  }
  return qb;
};

/**
 * 从搜索词里推断状态意图。例如「即将过期的东西」不是语义搜索，
 * 应该走到期日状态过滤。
 */
const detectStatusIntent = (keyword: string): SearchExpiryStatus | null => {
  const k = keyword.toLowerCase();
  if (
    /即将过期|快过期|要过期|马上过期|没几天|快到期|要到期|即将到期|临期|今天到期/.test(
      k
    )
  )
    return "expiring";
  if (/已过期|过期了|坏掉|不能用了/.test(k)) return "expired";
  if (/新鲜|充足|刚买|还有很多天|很久才到期/.test(k)) return "fresh";
  return null;
};

@Injectable()
export class ExpiryService {
  constructor(
    @InjectRepository(ExpiryItem)
    private readonly itemRepository: Repository<ExpiryItem>,
    @InjectRepository(ExpiryItemNotification)
    private readonly notificationRepository: Repository<ExpiryItemNotification>,
    @InjectRepository(DiningGroupMember)
    private readonly memberRepository: Repository<DiningGroupMember>,
    private readonly vectorService: ItemVectorService,
    @Inject(RERANK_MODEL)
    private readonly rerankModel: ChatOpenAI | null
  ) {}

  /** 用户所在的全部饭搭子组ID，决定共享物品的可见范围。 */
  private async findUserGroupIds(userId: number): Promise<number[]> {
    const members = await this.memberRepository.find({ where: { userId } });
    return members.map((m) => m.groupId);
  }

  private async ensureGroupMembership(
    userId: number,
    groupId: number
  ): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { userId, groupId },
    });
    if (!member) {
      throw new ForbiddenException("用户不在该饭搭子组内，无权操作");
    }
  }

  /**
   * 可见范围：我自己的物品（共享/私有都含，userId 命中）+ 共享到我所在组的物品。
   * 整体加括号，避免和调用方随后 andWhere 的状态过滤在 OR/AND 优先级上出错。
   */
  private applyVisibility<T>(
    qb: SelectQueryBuilder<T>,
    alias: string,
    userId: number,
    groupIds: number[]
  ): void {
    const own = `${alias}.userId = :visibleUserId`;
    const params: Record<string, unknown> = { visibleUserId: userId };
    let clause = own;
    if (groupIds.length) {
      clause += ` OR ${alias}.groupId IN (:...visibleGroupIds)`;
      params.visibleGroupIds = groupIds;
    }
    qb.andWhere(`(${clause})`, params);
  }

  async create(createDto: CreateExpiryItemDto) {
    if (createDto.groupId) {
      await this.ensureGroupMembership(createDto.userId, createDto.groupId);
    }
    const item = this.itemRepository.create({
      ...createDto,
      expiryDate: addShelfLife(
        createDto.productionDate,
        createDto.shelfLifeValue,
        createDto.shelfLifeUnit as ShelfLifeUnit,
      ),
    });
    const saved = await this.itemRepository.save(item);
    await this.vectorService.upsert(
      saved.id,
      saved.userId,
      buildSearchText(saved),
      saved.groupId
    );
    return this.toResponse(saved);
  }

  async findAll(
    paginationDto: PaginationDto,
    userId: number,
    status?: ExpiryStatus
  ) {
    const { page, pageSize } = paginationDto;
    const groupIds = await this.findUserGroupIds(userId);

    const qb = this.itemRepository
      .createQueryBuilder("item")
      .orderBy("item.expiryDate", "ASC")
      .skip((page - 1) * pageSize)
      .take(pageSize);
    this.applyVisibility(qb, "item", userId, groupIds);
    applyStatusFilter(qb, "item", status);

    const [list, total] = await qb.getManyAndCount();

    return {
      list: list.map((item) => this.toResponse(item)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 语义搜索。向量库可用时按相似度排序返回，
   * 不可用（未配置或调用失败）则降级为名称/备注关键词匹配。
   * 搜索词包含「即将过期」等状态时，直接走 MySQL 状态过滤，不走向量。
   */
  async search(searchDto: SearchExpiryItemDto) {
    const { userId, keyword, topK = 10, status } = searchDto;
    const statusIntent = status ?? detectStatusIntent(keyword);
    const groupIds = await this.findUserGroupIds(userId);

    if (statusIntent) {
      const qb = this.itemRepository.createQueryBuilder("item");
      this.applyVisibility(qb, "item", userId, groupIds);
      applyStatusFilter(qb, "item", statusIntent);
      const list = await qb
        .orderBy("item.expiryDate", "ASC")
        .take(topK)
        .getMany();
      return {
        list: list.map((item) => this.toResponse(item)),
        semantic: false,
      };
    }

    const hits = await this.vectorService.search(
      userId,
      groupIds,
      keyword,
      DISTRIBUTION_LIMIT
    );
    if (!hits) {
      const qb = this.itemRepository
        .createQueryBuilder("item")
        .andWhere("(item.name LIKE :kw OR item.notes LIKE :kw)", {
          kw: `%${keyword}%`,
        })
        .orderBy("item.expiryDate", "ASC")
        .take(topK);
      this.applyVisibility(qb, "item", userId, groupIds);
      const list = await qb.getMany();
      return {
        list: list.map((item) => this.toResponse(item)),
        semantic: false,
      };
    }

    if (!hits.length) return { list: [], semantic: true };

    // 向量库可能存有已删物品的残留 id，再按可见范围兜一层过滤
    const candidates = hits.slice(0, RERANK_TOP_K);
    const verifyQb = this.itemRepository
      .createQueryBuilder("item")
      .where("item.id IN (:...candidateIds)", {
        candidateIds: candidates.map((hit) => hit.id),
      });
    this.applyVisibility(verifyQb, "item", userId, groupIds);
    const found = await verifyQb.getMany();
    const byId = new Map(found.map((item) => [item.id, item]));
    const ordered = candidates
      .map((hit) => byId.get(hit.id))
      .filter((item): item is ExpiryItem => !!item);
    if (!ordered.length) return { list: [], semantic: true };

    const picked = await this.rerank(keyword, ordered);
    // 重排不可用时回退到统计阈值：只保留显著高于其他物品的命中，
    // 否则任何查询都会把全部物品按相似度排一遍返回
    const list =
      picked ??
      (() => {
        const strong = selectHits(hits, topK);
        const keep = new Set(strong.map((hit) => hit.id));
        return ordered.filter((item) => keep.has(item.id));
      })();

    return { list: list.map((item) => this.toResponse(item)), semantic: true };
  }

  /**
   * 让模型从候选里挑出真正相关的。返回 null 表示重排不可用（未配置、超时、
   * 解析失败），调用方回退到统计阈值。
   */
  private async rerank(
    keyword: string,
    candidates: ExpiryItem[]
  ): Promise<ExpiryItem[] | null> {
    if (!this.rerankModel) return null;
    try {
      const response = await this.rerankModel.invoke([
        ["system", RERANK_SYSTEM_PROMPT],
        ["human", buildRerankInput(keyword, candidates)],
      ]);
      const ids = parseRerankIds(String(response.content), candidates.length);
      return ids ? ids.map((index) => candidates[index]) : null;
    } catch {
      return null;
    }
  }

  async findOne(id: number, userId: number) {
    return this.toResponse(await this.getAccessibleOrFail(id, userId));
  }

  async update(id: number, userId: number, updateDto: UpdateExpiryItemDto) {
    const item = await this.getAccessibleOrFail(id, userId);

    // 改挂到的新组必须是操作者所在组；显式传 null 表示改回私有
    if (updateDto.groupId) {
      await this.ensureGroupMembership(userId, updateDto.groupId);
    }
    const groupChanged =
      updateDto.groupId !== undefined &&
      (updateDto.groupId ?? null) !== (item.groupId ?? null);
    // 生产日期/保质期变了要重算到期日；到期日或提醒天数变了，
    // 之前的推送记录作废，让它重新进提醒队列
    const resolved = resolveExpiryDate(item, updateDto);
    const windowChanged =
      (resolved?.changed ?? false) ||
      (updateDto.remindDays !== undefined &&
        updateDto.remindDays !== item.remindDays);

    Object.assign(item, updateDto);
    if (resolved) item.expiryDate = resolved.expiryDate;
    const saved = await this.itemRepository.save(item);

    if (windowChanged) {
      await this.notificationRepository.delete({ itemId: id });
    } else if (groupChanged) {
      // 只改共享范围：清掉已不在接收范围内的非所有者记录；
      // 新加入的成员本就没有记录，会自然进入推送队列
      await this.notificationRepository
        .createQueryBuilder()
        .delete()
        .where("itemId = :itemId AND userId != :ownerId", {
          itemId: id,
          ownerId: saved.userId,
        })
        .execute();
    }

    await this.vectorService.upsert(
      saved.id,
      saved.userId,
      buildSearchText(saved),
      saved.groupId
    );
    return this.toResponse(saved);
  }

  async remove(id: number, userId: number) {
    const item = await this.getAccessibleOrFail(id, userId);
    await this.itemRepository.remove(item);
    await this.notificationRepository.delete({ itemId: id });
    await this.vectorService.remove(id);
    return { success: true };
  }

  /**
   * 私人物品仅所有者可访问；共享物品要求操作者在所属组内。
   * 顺带补上历史上缺失的归属校验。
   */
  private async getAccessibleOrFail(id: number, userId: number) {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`物品 ID ${id} 不存在`);
    }
    if (item.groupId) {
      await this.ensureGroupMembership(userId, item.groupId);
    } else if (item.userId !== userId) {
      throw new ForbiddenException("无权操作他人物品");
    }
    return item;
  }

  private toResponse(item: ExpiryItem): ExpiryItemResponse {
    const days = this.daysRemaining(item.expiryDate);
    let status: ExpiryStatus;
    let statusText: string;
    if (days < 0) {
      status = "expired";
      statusText = "已过期";
    } else if (days <= item.remindDays) {
      status = "expiring";
      statusText = "即将到期";
    } else {
      status = "fresh";
      statusText = "充足";
    }

    const daysText =
      days < 0
        ? `${Math.abs(days)}天前过期`
        : days === 0
        ? "今天到期"
        : `${days}天后到期`;

    return {
      ...item,
      status,
      statusText,
      daysRemaining: days,
      daysText,
    };
  }

  private daysRemaining(expiryDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(`${expiryDate}T00:00:00`);
    const diffMs = expiry.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }
}
