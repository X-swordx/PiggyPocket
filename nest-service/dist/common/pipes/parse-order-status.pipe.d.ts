import { PipeTransform } from '@nestjs/common';
export type OrderStatus = 'pending' | 'confirming' | 'cooking' | 'completed';
export declare class ParseOrderStatusPipe implements PipeTransform<string, OrderStatus> {
    transform(value: string): OrderStatus;
}
