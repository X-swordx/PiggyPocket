import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 订单评价：新增星级和评价时间。
 */
export class AddOrderRating1720000011000 implements MigrationInterface {
  name = 'AddOrderRating1720000011000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('orders');

    if (table && !table.findColumnByName('rating')) {
      await queryRunner.query(
        "ALTER TABLE `orders` ADD COLUMN `rating` tinyint NULL COMMENT '评价星级 1-5'",
      );
    }

    if (table && !table.findColumnByName('ratedAt')) {
      await queryRunner.query(
        "ALTER TABLE `orders` ADD COLUMN `ratedAt` datetime NULL COMMENT '评价时间'",
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('orders');
    if (table && table.findColumnByName('ratedAt')) {
      await queryRunner.query('ALTER TABLE `orders` DROP COLUMN `ratedAt`').catch(() => undefined);
    }
    if (table && table.findColumnByName('rating')) {
      await queryRunner.query('ALTER TABLE `orders` DROP COLUMN `rating`').catch(() => undefined);
    }
  }
}
