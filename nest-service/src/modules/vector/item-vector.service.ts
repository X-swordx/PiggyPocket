import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataType, MilvusClient } from '@zilliz/milvus2-sdk-node';
import { OpenAIEmbeddings } from '@langchain/openai';

const COLLECTION = 'expiry_items';

export interface VectorHit {
  id: number;
  score: number;
}

/**
 * 到期物品的向量索引。主键与 MySQL 的 `expiry_items.id` 一致，
 * `userId` 存进 payload 用于检索时过滤，保证不会搜到别人的物品。
 *
 * 所有写操作失败只记 warn：写 MySQL 才是主流程，向量只是索引，
 * 不能因为向量库抖动就让用户存不进物品。
 */
@Injectable()
export class ItemVectorService implements OnModuleInit {
  private readonly logger = new Logger(ItemVectorService.name);
  private readonly dim: number;
  private ready = false;

  constructor(
    @Inject('MILVUS_CLIENT') private readonly client: MilvusClient | null,
    @Inject('EMBEDDINGS') private readonly embeddings: OpenAIEmbeddings | null,
    configService: ConfigService,
  ) {
    // doubao-embedding-vision 的输出维度为 2048（已实测），换模型必须同步改
    this.dim = Number(configService.get('EMBEDDING_DIM', 2048));
  }

  /** 未配置向量库或 embedding 模型时整体降级，调用方走关键词搜索。 */
  get enabled(): boolean {
    return this.ready && !!this.client && !!this.embeddings;
  }

  async onModuleInit() {
    if (!this.client || !this.embeddings) return;
    try {
      const has = await this.client.hasCollection({
        collection_name: COLLECTION,
      });
      if (!has.value) {
        await this.client.createCollection({
          collection_name: COLLECTION,
          fields: [
            {
              name: 'id',
              data_type: DataType.Int64,
              is_primary_key: true,
              autoID: false,
            },
            { name: 'userId', data_type: DataType.Int64 },
            { name: 'vector', data_type: DataType.FloatVector, dim: this.dim },
          ],
        });
        await this.client.createIndex({
          collection_name: COLLECTION,
          field_name: 'vector',
          index_type: 'AUTOINDEX',
          metric_type: 'COSINE',
        });
      }
      await this.client.loadCollection({ collection_name: COLLECTION });
      this.ready = true;
    } catch (error) {
      // EMBEDDING_DIM 与已建 collection 不一致也会走到这里，此时需要手动重建 collection
      this.logger.warn(
        `Milvus collection 初始化失败，语义搜索降级为关键词搜索：${
          (error as Error).message
        }`,
      );
    }
  }

  /** 写入/更新单个物品的向量。text 由调用方拼好（名称+分类+位置+备注）。 */
  async upsert(id: number, userId: number, text: string): Promise<void> {
    if (!this.enabled) return;
    try {
      const [vector] = await this.embeddings!.embedDocuments([text]);
      await this.client!.upsert({
        collection_name: COLLECTION,
        data: [{ id, userId, vector }],
      });
    } catch (error) {
      this.logger.warn(`物品 ${id} 向量写入失败：${(error as Error).message}`);
    }
  }

  /** 批量写入，供后台重建索引使用。返回成功条数。 */
  async upsertMany(
    items: Array<{ id: number; userId: number; text: string }>,
  ): Promise<number> {
    if (!this.enabled || !items.length) return 0;
    try {
      const vectors = await this.embeddings!.embedDocuments(
        items.map((item) => item.text),
      );
      await this.client!.upsert({
        collection_name: COLLECTION,
        data: items.map((item, index) => ({
          id: item.id,
          userId: item.userId,
          vector: vectors[index],
        })),
      });
      return items.length;
    } catch (error) {
      this.logger.warn(`批量向量写入失败：${(error as Error).message}`);
      return 0;
    }
  }

  async remove(id: number): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.client!.delete({ collection_name: COLLECTION, ids: [id] });
    } catch (error) {
      this.logger.warn(`物品 ${id} 向量删除失败：${(error as Error).message}`);
    }
  }

  /** 语义检索。返回 null 表示向量检索不可用，调用方需降级。 */
  async search(
    userId: number,
    keyword: string,
    topK: number,
  ): Promise<VectorHit[] | null> {
    if (!this.enabled) return null;
    try {
      const vector = await this.embeddings!.embedQuery(keyword);
      const res = await this.client!.search({
        collection_name: COLLECTION,
        data: [vector],
        filter: `userId == ${userId}`,
        limit: topK,
        output_fields: ['id'],
      });
      return res.results.map((hit) => ({
        id: Number(hit.id),
        score: hit.score,
      }));
    } catch (error) {
      this.logger.warn(`语义搜索失败，降级关键词搜索：${(error as Error).message}`);
      return null;
    }
  }
}
