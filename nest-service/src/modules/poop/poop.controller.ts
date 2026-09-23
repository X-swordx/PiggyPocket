import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PoopService } from './poop.service';
import { CreatePoopRecordDto } from './dto/create-poop-record.dto';
import { UpdatePoopRecordDto } from './dto/update-poop-record.dto';
import { WechatService } from '../wechat/wechat.service';

@ApiTags('拉粑粑么')
@Controller('poop-records')
export class PoopController {
  constructor(
    private readonly poopService: PoopService,
    private readonly wechatService: WechatService,
  ) {}

  @Post()
  @ApiOperation({ summary: '新增一条排便记录' })
  create(@Body() dto: CreatePoopRecordDto) {
    return this.poopService.create(dto);
  }

  @Get('day')
  @ApiOperation({ summary: '某一天的排便记录' })
  @ApiQuery({ name: 'userId', required: true, description: '用户ID' })
  @ApiQuery({ name: 'date', required: true, description: '日期 YYYY-MM-DD' })
  findDay(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('date') date: string,
  ) {
    return this.poopService.findDayRecords(userId, date);
  }

  @Get('month')
  @ApiOperation({ summary: '整月每日汇总（月历用）' })
  @ApiQuery({ name: 'userId', required: true, description: '用户ID' })
  @ApiQuery({ name: 'month', required: true, description: '月份 YYYY-MM' })
  findMonth(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('month') month: string,
  ) {
    return this.poopService.findMonth(userId, month);
  }

  @Post('advice')
  @ApiOperation({ summary: 'AI 根据最近排便记录生成健康建议' })
  getAdvice(@Body() body: { userId: number; days?: number }) {
    return this.poopService.getAdvice(body.userId, body.days);
  }

  @Get('reminder/config')
  @ApiOperation({ summary: '获取订阅消息模板ID与剩余推送额度' })
  @ApiQuery({ name: 'userId', required: false, description: '用户ID，传了才返回额度' })
  async reminderConfig(@Query('userId') userId?: string) {
    const templateId = this.wechatService.poopTemplateId || '';
    const remaining = userId
      ? await this.wechatService.getQuota(Number(userId), 'poop')
      : 0;
    return { templateId, remaining };
  }

  @Post('reminder/subscribe')
  @ApiOperation({ summary: '上报一次订阅授权，累加推送额度' })
  subscribe(@Body('userId', ParseIntPipe) userId: number) {
    return this.wechatService
      .addQuota(userId, 1, 'poop')
      .then(() => ({ success: true }));
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单条记录' })
  @ApiQuery({ name: 'userId', required: true, description: '当前用户ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.poopService.findOne(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新记录' })
  @ApiQuery({ name: 'userId', required: true, description: '当前用户ID' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdatePoopRecordDto,
  ) {
    return this.poopService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除记录' })
  @ApiQuery({ name: 'userId', required: true, description: '当前用户ID' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.poopService.remove(id, userId);
  }
}
