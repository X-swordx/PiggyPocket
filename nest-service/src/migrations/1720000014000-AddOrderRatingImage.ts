import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 订单评价：新增评价图片 URL。
 */
export class AddOrderRatingImage1720000014000 implements MigrationInterface {
  name = 'AddOrderRatingImage1720000014000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('orders');

    if (table && !table.findColumnByName('ratingImage')) {
      await queryRunner.query(
        "ALTER TABLE `orders` ADD COLUMN `ratingImage` varchar(255) NULL COMMENT '评价图片URL'",
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('orders');
    if (table && table.findColumnByName('ratingImage')) {
      await queryRunner.query('ALTER TABLE `orders` DROP COLUMN `ratingImage`').catch(() => undefined);
    }
  }
}
