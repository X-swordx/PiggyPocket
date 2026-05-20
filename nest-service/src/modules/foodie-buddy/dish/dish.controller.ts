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
  @ApiQuery({ name: 'category', required: false, description: '按分类筛选' })
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('category') category?: string,
  ) {
    return this.dishService.findAll(paginationDto, category);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个菜品' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dishService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新菜品' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDishDto: UpdateDishDto,
  ) {
    return this.dishService.update(id, updateDishDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除菜品' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.dishService.remove(id);
  }
}
