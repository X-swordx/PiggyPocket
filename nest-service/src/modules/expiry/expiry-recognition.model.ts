/** 视觉理解模型注入 token。缺配置时为 null，只让识别接口降级。 */
export const VISION_MODEL = 'VISION_MODEL';

/** 识别服务只依赖 invoke，测试时可注入假模型。 */
export interface VisionModel {
  invoke(messages: unknown): Promise<{ content: unknown }>;
}
