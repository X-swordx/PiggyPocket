import { Body, Controller, Get, Logger, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RecipeInspirationService } from './recipe-inspiration.service';
import { GenerateRecipesDto } from './dto/generate-recipes.dto';
import { SaveInspirationDto } from './dto/save-inspiration.dto';

@ApiTags('灵感菜谱')
@Controller('foodie-buddy/recipe-inspiration')
export class RecipeInspirationController {
  private readonly logger = new Logger(RecipeInspirationController.name);

  constructor(private readonly service: RecipeInspirationService) {}

  @Get('options')
  @ApiOperation({ summary: '获取启用中的灵感菜谱选项（食材/辣度/偏好/忌口）' })
  findOptions() {
    return this.service.findOptions();
  }

  /**
   * SSE 流式生成推荐菜。用 @Res() 绕过全局 TransformInterceptor 的包装，
   * 与 AiController.streamRecipe 同一套写法；每帧是累积到当前的完整 dishes。
   */
  @Post('stream')
  @ApiOperation({ summary: '根据手头食材与偏好流式生成推荐菜' })
  async stream(
    @Body() dto: GenerateRecipesDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    // nginx-proxy-manager 默认 proxy_buffering on，会攒到结束才下发
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // 用户返回上一页/换一批时断开连接，停止继续消耗模型额度
    let clientGone = false;
    res.on('close', () => {
      clientGone = true;
    });

    let lastFrame = '';
    try {
      for await (const partial of this.service.stream(dto)) {
        if (clientGone) return;
        const frame = JSON.stringify(partial);
        // 纯空白 chunk 会吐出与上一帧相同的对象，去重省带宽
        if (frame === lastFrame) continue;
        lastFrame = frame;
        res.write(`data: ${frame}\n\n`);
      }
      res.write('data: [DONE]\n\n');
    } catch (error) {
      this.logger.error('灵感菜谱生成失败', error as Error);
      if (!clientGone) {
        const message =
          error instanceof Error && /暂时不可用|调整食材/.test(error.message)
            ? error.message
            : '生成失败，请重试';
        res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      }
    } finally {
      if (!clientGone) res.end();
    }
  }

  @Post('save')
  @ApiOperation({ summary: '将勾选的推荐菜加入饭搭子组菜谱' })
  save(@Body() dto: SaveInspirationDto) {
    return this.service.save(dto);
  }
}
