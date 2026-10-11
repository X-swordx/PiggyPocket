import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RecipeInspirationService } from './recipe-inspiration.service';
import { GenerateRecipesDto } from './dto/generate-recipes.dto';
import { SaveInspirationDto } from './dto/save-inspiration.dto';

@ApiTags('灵感菜谱')
@Controller('foodie-buddy/recipe-inspiration')
export class RecipeInspirationController {
  constructor(private readonly service: RecipeInspirationService) {}

  @Get('options')
  @ApiOperation({ summary: '获取启用中的灵感菜谱选项（食材/辣度/偏好/忌口）' })
  findOptions() {
    return this.service.findOptions();
  }

  @Post('generate')
  @ApiOperation({ summary: '根据手头食材与偏好 AI 生成推荐菜' })
  generate(@Body() dto: GenerateRecipesDto) {
    return this.service.generate(dto);
  }

  @Post('save')
  @ApiOperation({ summary: '将勾选的推荐菜加入饭搭子组菜谱' })
  save(@Body() dto: SaveInspirationDto) {
    return this.service.save(dto);
  }
}
