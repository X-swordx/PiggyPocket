import { Controller, Get, Logger, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AiService } from './ai.service';
import { GenerateRecipeDto } from './dto/generate-recipe.dto';

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * 流式生成菜谱用料与步骤。
   *
   * 这里用 @Res() 而不是 @Sse()：用了 @Res() 后 Nest 不再发送拦截器的返回值，
   * 从而天然绕过全局 TransformInterceptor 的 { code, data, message } 包装，
   * 同时能自行设置 X-Accel-Buffering 响应头。
   */
  @Get('recipe/stream')
  async streamRecipe(
    @Query() dto: GenerateRecipeDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    // nginx-proxy-manager 默认 proxy_buffering on，会把整个流攒到结束才下发
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // 用户关闭弹窗/点重新生成时会断开连接，此时应停止继续消耗模型额度
    let clientGone = false;
    res.on('close', () => {
      clientGone = true;
    });

    let lastFrame = '';
    try {
      for await (const partial of this.aiService.streamRecipe(dto.name)) {
        if (clientGone) return;
        const frame = JSON.stringify(partial);
        // 累积式解析器在纯空白 chunk 上会吐出与上一帧相同的对象，去重省带宽
        if (frame === lastFrame) continue;
        lastFrame = frame;
        res.write(`data: ${frame}\n\n`);
      }
      res.write('data: [DONE]\n\n');
    } catch (error) {
      this.logger.error(`生成菜谱失败: ${dto.name}`, error as Error);
      if (!clientGone) {
        res.write(`data: ${JSON.stringify({ error: 'AI 生成失败，请重试' })}\n\n`);
      }
    } finally {
      if (!clientGone) res.end();
    }
  }
}
