import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * dishes 表历史上通过 synchronize 建表，后来 entity 添加了 userId / groupId 列
 * 却没有对应 migration。补一个：
 *   - 加 userId、groupId
 *   - 已有历史数据先以 0 填充（后续可清理）
 */
export class AddDishOwnership1720000002000 implements MigrationInterface {
  name = 'AddDishOwnership1720000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('dishes');
    if (!table) return;

    if (!table.findColumnByName('userId')) {
      await queryRunner.query(
        "ALTER TABLE `dishes` ADD COLUMN `userId` int NOT NULL DEFAULT 0 COMMENT '创建者ID' AFTER `bgColor`",
      );
      await queryRunner.query('CREATE INDEX `IDX_dishes_userId` ON `dishes` (`userId`)');
    }
    if (!table.findColumnByName('groupId')) {
      await queryRunner.query(
        "ALTER TABLE `dishes` ADD COLUMN `groupId` int NOT NULL DEFAULT 0 COMMENT '所属饭搭子组ID' AFTER `userId`",
      );
      await queryRunner.query('CREATE INDEX `IDX_dishes_groupId` ON `dishes` (`groupId`)');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX `IDX_dishes_groupId` ON `dishes`').catch(() => undefined);
    await queryRunner.query('DROP INDEX `IDX_dishes_userId` ON `dishes`').catch(() => undefined);
    await queryRunner.query('ALTER TABLE `dishes` DROP COLUMN `groupId`').catch(() => undefined);
    await queryRunner.query('ALTER TABLE `dishes` DROP COLUMN `userId`').catch(() => undefined);
  }
}
