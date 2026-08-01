import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Like, Repository } from 'typeorm';
import { DiningGroup } from '../foodie-buddy/dining-group/entities/dining-group.entity';
import { DiningGroupMember } from '../foodie-buddy/dining-group/entities/dining-group-member.entity';
import { User } from '../foodie-buddy/user/entities/user.entity';
import { Order } from '../foodie-buddy/order/entities/order.entity';
import { Dish } from '../foodie-buddy/dish/entities/dish.entity';
import { AdminListQueryDto } from './dto/admin-list-query.dto';
import { AdminOperationLogService, LogContext } from './admin-operation-log.service';

@Injectable()
export class AdminDiningGroupService {
  constructor(
    @InjectRepository(DiningGroup)
    private readonly groupRepo: Repository<DiningGroup>,
    @InjectRepository(DiningGroupMember)
    private readonly memberRepo: Repository<DiningGroupMember>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Dish)
    private readonly dishRepo: Repository<Dish>,
    private readonly opLog: AdminOperationLogService,
  ) {}

  async findAll(query: AdminListQueryDto) {
    const { page, pageSize, keyword } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (keyword) where.name = Like(`%${keyword}%`);

    const [rows, total] = await this.groupRepo.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    const creators = await this.loadUserMap(rows.map((r) => r.creatorId));
    // 批量成员计数
    const counts = rows.length
      ? await this.memberRepo
          .createQueryBuilder('m')
          .select('m.groupId', 'groupId')
          .addSelect('COUNT(m.id)', 'cnt')
          .where('m.groupId IN (:...ids)', { ids: rows.map((r) => r.id) })
          .groupBy('m.groupId')
          .getRawMany<{ groupId: number; cnt: string }>()
      : [];
    const countMap = new Map(counts.map((c) => [Number(c.groupId), Number(c.cnt)]));

    return {
      list: rows.map((r) => ({
        ...r,
        creatorNickname:
          creators.get(r.creatorId)?.nickname ?? creators.get(r.creatorId)?.name ?? null,
        memberCount: countMap.get(r.id) ?? 0,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number) {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException(`饭搭子 ID ${id} 不存在`);
    const creator = await this.userRepo.findOne({ where: { id: group.creatorId } });
    return {
      ...group,
      creatorNickname: creator?.nickname ?? creator?.name ?? null,
    };
  }

  async create(ctx: LogContext, data: { name: string; creatorId: number }) {
    if (!data.name?.trim()) throw new BadRequestException('组名不能为空');
    const creator = await this.userRepo.findOne({ where: { id: data.creatorId } });
    if (!creator) throw new BadRequestException('创建者不存在');

    const group = await this.groupRepo.save(
      this.groupRepo.create({ name: data.name.trim(), creatorId: data.creatorId }),
    );
    await this.memberRepo.save(
      this.memberRepo.create({
        groupId: group.id,
        userId: data.creatorId,
        nickname: creator.nickname ?? creator.name ?? undefined,
      }),
    );
    await this.opLog.record(ctx, 'create', 'dining_group', group.id, { name: group.name });
    return this.findOne(group.id);
  }

  async update(ctx: LogContext, id: number, data: { name?: string }) {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException(`饭搭子 ID ${id} 不存在`);
    if (data.name) group.name = data.name.trim();
    await this.groupRepo.save(group);
    await this.opLog.record(ctx, 'update', 'dining_group', id, data);
    return this.findOne(id);
  }

  async remove(ctx: LogContext, id: number) {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException(`饭搭子 ID ${id} 不存在`);

    const orderResult = await this.orderRepo
      .createQueryBuilder()
      .update()
      .set({ groupId: null as any })
      .where('groupId = :id', { id })
      .execute();
    const dishResult = await this.dishRepo
      .createQueryBuilder()
      .update()
      .set({ groupId: null as any })
      .where('groupId = :id', { id })
      .execute();

    await this.memberRepo.delete({ groupId: id });
    await this.groupRepo.remove(group);

    await this.opLog.record(ctx, 'delete', 'dining_group', id, {
      name: group.name,
      clearedOrders: orderResult.affected ?? 0,
      clearedDishes: dishResult.affected ?? 0,
    });

    return {
      success: true,
      affected: {
        orders: orderResult.affected ?? 0,
        dishes: dishResult.affected ?? 0,
      },
    };
  }

  // ============ 成员 ============

  async listMembers(groupId: number) {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException(`饭搭子 ID ${groupId} 不存在`);
    const members = await this.memberRepo.find({
      where: { groupId },
      order: { joinedAt: 'ASC' },
    });
    const users = await this.loadUserMap(members.map((m) => m.userId));
    return members.map((m) => ({
      ...m,
      user: users.get(m.userId)
        ? {
            id: users.get(m.userId)!.id,
            nickname: users.get(m.userId)!.nickname ?? users.get(m.userId)!.name ?? null,
            avatar: users.get(m.userId)!.avatar,
            openidTail: users.get(m.userId)!.openid?.slice(-6) ?? null,
          }
        : null,
    }));
  }

  async addMember(
    ctx: LogContext,
    groupId: number,
    data: { userId: number; nickname?: string },
  ) {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException(`饭搭子 ID ${groupId} 不存在`);
    const user = await this.userRepo.findOne({ where: { id: data.userId } });
    if (!user) throw new BadRequestException('用户不存在');
    const exists = await this.memberRepo.findOne({
      where: { groupId, userId: data.userId },
    });
    if (exists) throw new BadRequestException('该用户已经在组内');
    await this.memberRepo.save(
      this.memberRepo.create({
        groupId,
        userId: data.userId,
        nickname: data.nickname ?? user.nickname ?? user.name ?? undefined,
      }),
    );
    await this.opLog.record(ctx, 'create', 'dining_group_member', `${groupId}/${data.userId}`);
    return this.listMembers(groupId);
  }

  async updateMember(
    ctx: LogContext,
    groupId: number,
    memberId: number,
    data: { nickname?: string },
  ) {
    const member = await this.memberRepo.findOne({
      where: { id: memberId, groupId },
    });
    if (!member) throw new NotFoundException(`成员不存在`);
    if (data.nickname !== undefined) member.nickname = data.nickname;
    await this.memberRepo.save(member);
    await this.opLog.record(ctx, 'update', 'dining_group_member', `${groupId}/${memberId}`, data);
    return this.listMembers(groupId);
  }

  async removeMember(ctx: LogContext, groupId: number, memberId: number) {
    const member = await this.memberRepo.findOne({
      where: { id: memberId, groupId },
    });
    if (!member) throw new NotFoundException(`成员不存在`);
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (group && member.userId === group.creatorId) {
      throw new BadRequestException('不能移除创建者，请先解散或转移创建者');
    }
    await this.memberRepo.remove(member);
    await this.opLog.record(ctx, 'delete', 'dining_group_member', `${groupId}/${memberId}`);
    return { success: true };
  }

  private async loadUserMap(ids: number[]) {
    const uniq = Array.from(new Set(ids)).filter(Boolean);
    if (!uniq.length) return new Map<number, User>();
    const users = await this.userRepo.find({ where: { id: In(uniq) } });
    return new Map(users.map((u) => [u.id, u]));
  }
}
