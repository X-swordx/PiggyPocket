import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateExpiryItemDto } from './create-expiry-item.dto';

export class UpdateExpiryItemDto extends PartialType(
  OmitType(CreateExpiryItemDto, ['userId'] as const),
) {}
