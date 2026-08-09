import { Controller, Get, Post, Query, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MessageService } from './message.service';

@ApiTags('消息通知')
@Controller('foodie-buddy/messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get()
  @ApiOperation({ summary: '获取当前用户的消息列表' })
  @ApiQuery({ name: 'userId', required: true, description: '用户ID' })
  findAll(@Query('userId', ParseIntPipe) userId: number) {
    return this.messageService.findAllForUser(userId);
  }

  @Post('read')
  @ApiOperation({ summary: '标记全部消息为已读' })
  @ApiQuery({ name: 'userId', required: true, description: '用户ID' })
  markRead(@Query('userId', ParseIntPipe) userId: number) {
    return this.messageService.markAllRead(userId);
  }
}
