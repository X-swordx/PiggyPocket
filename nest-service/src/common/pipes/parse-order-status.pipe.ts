import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

export type OrderStatus = 'pending' | 'confirming' | 'cooking' | 'completed';

const VALID_STATUSES: OrderStatus[] = ['pending', 'confirming', 'cooking', 'completed'];

@Injectable()
export class ParseOrderStatusPipe implements PipeTransform<string, OrderStatus> {
  transform(value: string): OrderStatus {
    if (!VALID_STATUSES.includes(value as OrderStatus)) {
      throw new BadRequestException(`无效的订单状态: ${value}，有效值为: ${VALID_STATUSES.join(', ')}`);
    }
    return value as OrderStatus;
  }
}
