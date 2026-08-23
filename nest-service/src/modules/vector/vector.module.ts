import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ItemVectorService } from './item-vector.service';

/**
 * 语义搜索所需的两个外部依赖：方舟 embedding 模型 + Milvus 向量库。
 *
 * 两个 provider 都沿用 AiModule 的做法：缺配置时返回 null 并 warn，
 * 只让语义搜索降级为关键词搜索，不阻断整个应用启动（本地开发不必连向量库）。
 */
@Module({
  imports: [ConfigModule],
  providers: [
    ItemVectorService,
    {
      provide: 'EMBEDDINGS',
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('OPENAI_API_KEY');
        // 方舟 Agent Plan 的 embeddings 端点目前只放通 doubao-embedding-vision，
        // 其余向量模型会返回 404 UnsupportedModel，因此直接作为默认值。
        const model = configService.get<string>(
          'EMBEDDING_MODEL_NAME',
          'doubao-embedding-vision',
        );
        if (!apiKey) {
          new Logger('VectorModule').warn(
            '未配置 OPENAI_API_KEY，语义搜索将降级为关键词搜索',
          );
          return null;
        }
        return new OpenAIEmbeddings({
          model,
          apiKey,
          // 方舟 Agent Plan 的 embeddings 端点单次最多 10 条（实测，超了返回
          // 400 "Embeddings API input limit exceeded: max 10"），LangChain 会按此分批
          batchSize: 10,
          configuration: {
            baseURL: configService.get('OPENAI_BASE_URL'),
          },
        });
      },
      inject: [ConfigService],
    },
    {
      provide: 'MILVUS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const address = configService.get<string>('MILVUS_ADDRESS');
        if (!address) {
          new Logger('VectorModule').warn(
            '未配置 MILVUS_ADDRESS，语义搜索将降级为关键词搜索',
          );
          return null;
        }
        return new MilvusClient({
          address,
          token: configService.get<string>('MILVUS_TOKEN'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [ItemVectorService],
})
export class VectorModule {}
