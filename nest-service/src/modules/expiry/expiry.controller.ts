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
import { CreateExpiryFoodDto } from './dto/create-expiry-food.dto';
import { UpdateExpiryFoodDto } from './dto/update-expiry-food.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('临期食品管理')
@Controller('foodie-buddy/expiry-foods')
export class ExpiryController {
  constructor(private readonly expiryService: ExpiryService) {}

  @Post()
  @ApiOperation({ summary: '添加临期食品' })
  create(@Body() createDto: CreateExpiryFoodDto) {
    return this.expiryService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: '获取临期食品列表' })
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

  @Get(':id')
  @ApiOperation({ summary: '获取单个临期食品' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.expiryService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新临期食品' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateExpiryFoodDto,
  ) {
    return this.expiryService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除临期食品' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.expiryService.remove(id);
  }
}
