import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

export type OrderStatus = 'pending' | 'confirming' | 'cooking' | 'completed';

const VALID_STATUSES: OrderStatus[] = ['pending', 'confirming', 'cooking', 'completed'];

@Injectable()
export class ParseOrderStatusPipe implements PipeTransform<string | undefined, OrderStatus | undefined> {
  transform(value?: string): OrderStatus | undefined {
    if (!value) {
      return undefined;
    }
    if (!VALID_STATUSES.includes(value as OrderStatus)) {
      throw new BadRequestException(`无效的订单状态: ${value}，有效值为: ${VALID_STATUSES.join(', ')}`);
    }
    return value as OrderStatus;
  }
}
