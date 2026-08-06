import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 给 orders 表加 cookDate 字段：用户下单时选择的做菜日期。
 * 允许为空，历史订单保持 NULL，前端展示时回退用 createdAt 的日期分组。
 */
export class AddOrderCookDate1720000007000 implements MigrationInterface {
  name = 'AddOrderCookDate1720000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('orders');
    if (!table || table.findColumnByName('cookDate')) return;
    await queryRunner.query(
      "ALTER TABLE `orders` ADD COLUMN `cookDate` date NULL COMMENT '做菜日期'",
    );
    await queryRunner.query('CREATE INDEX `IDX_orders_cookDate` ON `orders` (`cookDate`)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX `IDX_orders_cookDate` ON `orders`').catch(() => undefined);
    await queryRunner.query('ALTER TABLE `orders` DROP COLUMN `cookDate`').catch(() => undefined);
  }
}
