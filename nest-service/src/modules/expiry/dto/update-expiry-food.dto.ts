import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateExpiryFoodDto } from './create-expiry-food.dto';

export class UpdateExpiryFoodDto extends PartialType(
  OmitType(CreateExpiryFoodDto, ['userId'] as const),
) {}
