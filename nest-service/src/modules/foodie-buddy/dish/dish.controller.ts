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
import { DishService } from './dish.service';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';

@ApiTags('菜品管理')
@Controller('foodie-buddy/dishes')
export class DishController {
  constructor(private readonly dishService: DishService) {}

  @Post()
  @ApiOperation({ summary: '创建菜品' })
  create(@Body() createDishDto: CreateDishDto) {
    return this.dishService.create(createDishDto);
  }

  @Get()
  @ApiOperation({ summary: '获取菜品列表' })
  @ApiQuery({ name: 'userId', required: true, description: '当前用户ID' })
  @ApiQuery({ name: 'categoryId', required: false, description: '按分类ID筛选' })
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('userId', ParseIntPipe) userId: number,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.dishService.findAll(
      paginationDto,
      userId,
      categoryId ? Number(categoryId) : undefined,
    );
  }

  // 必须放在 `@Get(':id')` 之前，否则 'categories' 会被当成 id 走 ParseIntPipe
  @Get('categories')
  @ApiOperation({ summary: '获取启用中的菜品分类' })
  findCategories() {
    return this.dishService.findCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个菜品' })
  @ApiQuery({ name: 'userId', required: true, description: '当前用户ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.dishService.findOne(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新菜品' })
  @ApiQuery({ name: 'userId', required: true, description: '当前用户ID' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
    @Body() updateDishDto: UpdateDishDto,
  ) {
    return this.dishService.update(id, userId, updateDishDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除菜品' })
  @ApiQuery({ name: 'userId', required: true, description: '当前用户ID' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.dishService.remove(id, userId);
  }
}
