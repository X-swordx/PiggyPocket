import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePoopRecordDto } from './create-poop-record.dto';

export class UpdatePoopRecordDto extends PartialType(
  OmitType(CreatePoopRecordDto, ['userId'] as const),
) {}
