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
import { WishService } from './wish.service';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('心愿管理')
@Controller('foodie-buddy/wishes')
export class WishController {
  constructor(private readonly wishService: WishService) {}

  @Post()
  @ApiOperation({ summary: '创建心愿' })
  create(@Body() createWishDto: CreateWishDto) {
    return this.wishService.create(createWishDto);
  }

  @Get()
  @ApiOperation({ summary: '获取心愿列表' })
  @ApiQuery({ name: 'userId', required: true, description: '用户ID' })
  @ApiQuery({ name: 'completed', required: false, description: '按完成状态筛选' })
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('userId', ParseIntPipe) userId: number,
    @Query('completed') completed?: string,
  ) {
    const completedFlag =
      completed === undefined ? undefined : completed === 'true';
    return this.wishService.findAll(paginationDto, userId, completedFlag);
  }

  @Get('count')
  @ApiOperation({ summary: '获取已完成心愿数量' })
  @ApiQuery({ name: 'userId', required: true, description: '用户ID' })
  count(@Query('userId', ParseIntPipe) userId: number) {
    return this.wishService.countCompleted(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个心愿' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.wishService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新心愿' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWishDto: UpdateWishDto,
  ) {
    return this.wishService.update(id, updateWishDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除心愿' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.wishService.remove(id);
  }
}
