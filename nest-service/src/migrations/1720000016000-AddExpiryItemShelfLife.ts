import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 到期物品录入改为「生产日期 + 保质期」：
 *   - expiry_items 增加 productionDate（生产日期，可空）
 *   - shelfLifeValue（保质期数值，可空）
 *   - shelfLifeUnit（保质期单位 day/month，可空）
 * 到期日 expiryDate 保留，由服务端按「生产日期 + 保质期」计算；
 * 历史数据没有生产日期，三个新列留空，expiryDate 不变。
 */
export class AddExpiryItemShelfLife1720000016000
  implements MigrationInterface
{
  name = 'AddExpiryItemShelfLife1720000016000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('expiry_items');
    if (!table) return;

    if (!table.findColumnByName('productionDate')) {
      await queryRunner.query(
        "ALTER TABLE `expiry_items` ADD COLUMN `productionDate` date NULL COMMENT '生产日期' AFTER `imageUrl`",
      );
    }
    if (!table.findColumnByName('shelfLifeValue')) {
      await queryRunner.query(
        "ALTER TABLE `expiry_items` ADD COLUMN `shelfLifeValue` int NULL COMMENT '保质期数值' AFTER `productionDate`",
      );
    }
    if (!table.findColumnByName('shelfLifeUnit')) {
      await queryRunner.query(
        "ALTER TABLE `expiry_items` ADD COLUMN `shelfLifeUnit` varchar(10) NULL COMMENT '保质期单位：day/month' AFTER `shelfLifeValue`",
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner
      .query('ALTER TABLE `expiry_items` DROP COLUMN `shelfLifeUnit`')
      .catch(() => undefined);
    await queryRunner
      .query('ALTER TABLE `expiry_items` DROP COLUMN `shelfLifeValue`')
      .catch(() => undefined);
    await queryRunner
      .query('ALTER TABLE `expiry_items` DROP COLUMN `productionDate`')
      .catch(() => undefined);
  }
}
