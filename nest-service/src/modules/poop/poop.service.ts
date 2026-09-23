import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatOpenAI } from '@langchain/openai';
import { PoopRecord } from './entities/poop-record.entity';
import { CreatePoopRecordDto } from './dto/create-poop-record.dto';
import { UpdatePoopRecordDto } from './dto/update-poop-record.dto';

/** 取东八区日历日，格式 YYYY-MM-DD（en-CA 本身就是该格式）。 */
export const beijingDateOf = (date: Date): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

export interface MonthDay {
  date: string;
  count: number;
  types: number[];
}

interface RawMonthRow {
  recordDate: string;
  count: number | string;
  types: string;
}

const SYSTEM_PROMPT = `你是一位温和、专业的消化健康顾问。用户会提供自己最近一段时间的排便记录，用的是布里斯托大便分型（1-2 型偏干硬、可能便秘；3-4 型是理想状态，其中 4 型最健康；5 型偏软；6-7 型偏稀，可能腹泻）。

请根据记录给出健康建议，要求：
1. 开头先用一句话总体评价近期的肠道状态。
2. 正文分三部分：「观察到的规律」「饮食建议」「生活习惯建议」，每部分 2-3 条，建议要具体、可执行（如"每天喝 1500-1700ml 水""早餐后尝试蹲 5 分钟马桶"），不要空泛。
3. 语气温和鼓励，不要危言耸听；只做健康科普，不下医学诊断。
4. 如果出现连续多日 1-2 型或 6-7 型、或伴有腹痛/便血的备注，提醒用户必要时就医。
5. 全文 300 字以内。`;

@Injectable()
export class PoopService {
  constructor(
    @InjectRepository(PoopRecord)
    private readonly recordRepository: Repository<PoopRecord>,
    @Inject('POOP_CHAT_MODEL')
    private readonly chatModel: ChatOpenAI | null,
  ) {}

  async create(dto: CreatePoopRecordDto): Promise<PoopRecord> {
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    if (Number.isNaN(occurredAt.getTime())) {
      throw new BadRequestException('occurredAt 时间格式不正确');
    }
    const saved = await this.recordRepository.save(
      this.recordRepository.create({
        userId: dto.userId,
        bristolType: dto.bristolType,
        notes: dto.notes,
        occurredAt,
        recordDate: beijingDateOf(occurredAt),
      }),
    );
    return saved;
  }

  /** 某一天的全部记录，按时间正序。 */
  async findDayRecords(userId: number, date: string): Promise<PoopRecord[]> {
    return this.recordRepository.find({
      where: { userId, recordDate: date },
      order: { occurredAt: 'ASC' },
    });
  }

  /** 整月每日汇总，供月历渲染。month 格式 YYYY-MM。 */
  async findMonth(userId: number, month: string): Promise<MonthDay[]> {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new BadRequestException('month 格式应为 YYYY-MM');
    }
    const rows = await this.recordRepository
      .createQueryBuilder('record')
      .select([
        'record.recordDate AS recordDate',
        'COUNT(record.id) AS count',
        'GROUP_CONCAT(record.bristolType ORDER BY record.occurredAt SEPARATOR \',\') AS types',
      ])
      .where('record.userId = :userId AND record.recordDate LIKE :month', {
        userId,
        month: `${month}-%`,
      })
      .groupBy('record.recordDate')
      .getRawMany<RawMonthRow>();

    return rows.map((row) => ({
      date: row.recordDate,
      count: Number(row.count),
      types: row.types.split(',').map(Number),
    }));
  }

  async findOne(id: number, userId: number): Promise<PoopRecord> {
    return this.getOwnedOrFail(id, userId);
  }

  async update(
    id: number,
    userId: number,
    dto: UpdatePoopRecordDto,
  ): Promise<PoopRecord> {
    const record = await this.getOwnedOrFail(id, userId);

    let occurredAt = record.occurredAt;
    if (dto.occurredAt !== undefined) {
      occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
      if (Number.isNaN(occurredAt.getTime())) {
        throw new BadRequestException('occurredAt 时间格式不正确');
      }
    }

    Object.assign(record, dto, { occurredAt });
    record.recordDate = beijingDateOf(occurredAt);
    return this.recordRepository.save(record);
  }

  async remove(id: number, userId: number): Promise<{ success: boolean }> {
    const record = await this.getOwnedOrFail(id, userId);
    await this.recordRepository.remove(record);
    return { success: true };
  }

  /**
   * 基于最近 days 天的记录生成 AI 健康建议。
   * 没有记录或模型未配置时直接返回明确提示，不浪费一次模型调用。
   */
  async getAdvice(userId: number, days = 30): Promise<{ advice: string }> {
    if (!this.chatModel) {
      throw new BadRequestException('AI 模型未配置，请检查 OPENAI_API_KEY');
    }

    const start = beijingDateOf(new Date(Date.now() - (days - 1) * 86400000));
    const records = await this.recordRepository
      .createQueryBuilder('record')
      .where('record.userId = :userId AND record.recordDate >= :start', {
        userId,
        start,
      })
      .orderBy('record.recordDate', 'ASC')
      .addOrderBy('record.occurredAt', 'ASC')
      .getMany();

    if (!records.length) {
      throw new BadRequestException(`最近 ${days} 天还没有排便记录，先记一条吧`);
    }

    const detail = this.buildDetail(records);
    const response = await this.chatModel.invoke([
      ['system', SYSTEM_PROMPT],
      [
        'human',
        `最近 ${days} 天共有 ${records.length} 次排便记录：\n${detail}`,
      ],
    ]);
    return { advice: String(response.content).trim() };
  }

  private buildDetail(records: PoopRecord[]): string {
    const byDate = new Map<string, PoopRecord[]>();
    for (const record of records) {
      const list = byDate.get(record.recordDate);
      if (list) list.push(record);
      else byDate.set(record.recordDate, [record]);
    }
    return [...byDate.entries()]
      .map(([date, list]) => {
        const types = list.map((r) => `${r.bristolType}型`).join('、');
        const notes = list
          .map((r) => r.notes)
          .filter(Boolean)
          .join('；');
        return `${date}：${list.length}次（${types}）${notes ? `，备注：${notes}` : ''}`;
      })
      .join('\n');
  }

  private async getOwnedOrFail(id: number, userId: number): Promise<PoopRecord> {
    const record = await this.recordRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`记录 ID ${id} 不存在`);
    }
    if (record.userId !== userId) {
      throw new ForbiddenException('无权操作他人记录');
    }
    return record;
  }
}
