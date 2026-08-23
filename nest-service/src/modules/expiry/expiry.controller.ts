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
import { ExpiryService, ExpiryStatus } from './expiry.service';
import { CreateExpiryItemDto } from './dto/create-expiry-item.dto';
import { UpdateExpiryItemDto } from './dto/update-expiry-item.dto';
import { SearchExpiryItemDto } from './dto/search-expiry-item.dto';
import { WechatService } from '../wechat/wechat.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('到期管家')
@Controller('expiry-items')
export class ExpiryController {
  constructor(
    private readonly expiryService: ExpiryService,
    private readonly wechatService: WechatService,
  ) {}

  @Post()
  @ApiOperation({ summary: '添加物品' })
  create(@Body() createDto: CreateExpiryItemDto) {
    return this.expiryService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: '获取物品列表' })
  @ApiQuery({ name: 'userId', required: true, description: '用户ID' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['fresh', 'expiring', 'expired'],
    description: '按状态筛选',
  })
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('userId', ParseIntPipe) userId: number,
    @Query('status') status?: ExpiryStatus,
  ) {
    return this.expiryService.findAll(paginationDto, userId, status);
  }

  @Get('search')
  @ApiOperation({ summary: '语义搜索物品（向量库不可用时降级为关键词匹配）' })
  search(@Query() searchDto: SearchExpiryItemDto) {
    return this.expiryService.search(searchDto);
  }

  @Get('reminder/config')
  @ApiOperation({ summary: '获取订阅消息模板ID与剩余推送额度' })
  @ApiQuery({ name: 'userId', required: false, description: '用户ID，传了才返回额度' })
  async reminderConfig(@Query('userId') userId?: string) {
    const templateId = this.wechatService.expiryTemplateId || '';
    const remaining = userId
      ? await this.wechatService.getQuota(Number(userId))
      : 0;
    return { templateId, remaining };
  }

  @Post('reminder/subscribe')
  @ApiOperation({ summary: '上报一次订阅授权，累加推送额度' })
  subscribe(@Body('userId', ParseIntPipe) userId: number) {
    return this.wechatService.addQuota(userId).then(() => ({ success: true }));
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个物品' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.expiryService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新物品' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateExpiryItemDto,
  ) {
    return this.expiryService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除物品' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.expiryService.remove(id);
  }
}
