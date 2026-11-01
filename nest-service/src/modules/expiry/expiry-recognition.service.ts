import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { OssService } from '../oss/oss.service';
import {
  normalizeRecognition,
  type NormalizedRecognition,
  type RawRecognition,
} from './expiry-recognition.normalize';
import { VISION_MODEL, type VisionModel } from './expiry-recognition.model';

const IMAGE_TIMEOUT_MS = 10000;
const MODEL_TIMEOUT_HINT_MS = 20000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const SYSTEM_PROMPT = `你是商品包装信息识别助手。只读取图片里清晰可见的文字，不要猜测、不要补全。

只输出 JSON，不要 markdown 代码块，不要解释。格式：
{
  "name": "商品名称，最多 100 字；看不清填 null",
  "productionDate": "生产日期，格式 YYYY-MM-DD；看不清填 null",
  "expiryDate": "到期日期，格式 YYYY-MM-DD；看不清填 null",
  "shelfLifeValue": "保质期数值，整数；看不清填 null",
  "shelfLifeUnit": "day 或 month；看不清填 null",
  "confidence": "high / medium / low"
}

规则：
1. 生产日期优先找「生产日期」「制造日期」「MFG」「PROD」。
2. 到期日优先找「保质期至」「有效期至」「到期日」「EXP」；「保质期 12 个月」是保质期，不是到期日。
3. 同时印了生产日期和保质期时，可以据此推算到期日；但不要把推算值当成图片上印的日期。
4. 只填图片里真实存在的信息，不确定就填 null。`;

const extractText = (content: unknown): string => {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((part) => {
      if (typeof part === 'string') return part;
      if (part && typeof part === 'object' && 'text' in part) {
        return String((part as { text?: unknown }).text ?? '');
      }
      return '';
    })
    .join('');
};

const parseJsonObject = (text: string): RawRecognition | null => {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return parsed && typeof parsed === 'object'
      ? (parsed as RawRecognition)
      : null;
  } catch {
    return null;
  }
};

@Injectable()
export class ExpiryRecognitionService {
  private readonly logger = new Logger(ExpiryRecognitionService.name);

  constructor(
    @Inject(VISION_MODEL) private readonly model: VisionModel | null,
    private readonly ossService: OssService,
  ) {}

  async recognize(imageUrl: string): Promise<NormalizedRecognition> {
    if (!this.model) {
      throw new ServiceUnavailableException('图片识别服务未配置');
    }
    if (!this.ossService.isOwnedUrl(imageUrl)) {
      throw new BadRequestException('图片地址不合法');
    }

    // OssUrlMiddleware 会把请求体里的读取签名剥掉（防止签名入库），
    // 而 bucket 是私有读，这里按 object key 重新签名后再抓取。
    const dataUrl = await this.downloadImage(this.ossService.signUrl(imageUrl));

    let content: string;
    try {
      const response = await this.model.invoke([
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage({
          content: [
            { type: 'text', text: '识别这张商品包装照片。' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        }),
      ]);
      content = extractText(response.content);
    } catch (error) {
      this.logger.warn(
        `视觉模型调用失败（超时 ${MODEL_TIMEOUT_HINT_MS}ms）: ${
          (error as Error).message
        }`,
      );
      throw new BadGatewayException('图片识别失败，请稍后重试或手动填写');
    }

    const raw = parseJsonObject(content);
    if (!raw) {
      this.logger.warn('视觉模型返回非法 JSON，按未识别处理');
      return normalizeRecognition({});
    }
    return normalizeRecognition(raw);
  }

  private async downloadImage(url: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new BadRequestException('图片读取失败');

      const contentType = (response.headers.get('content-type') || '')
        .split(';')[0]
        .trim()
        .toLowerCase();
      if (!contentType.startsWith('image/')) {
        throw new BadRequestException('图片格式不支持');
      }

      const declaredLength = Number(
        response.headers.get('content-length') || 0,
      );
      if (declaredLength > MAX_IMAGE_BYTES) {
        throw new BadRequestException('图片不能超过 8MB');
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length > MAX_IMAGE_BYTES) {
        throw new BadRequestException('图片不能超过 8MB');
      }
      return `data:${contentType};base64,${buffer.toString('base64')}`;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('图片读取失败');
    } finally {
      clearTimeout(timer);
    }
  }
}
