import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 删除 `dishes.tags` 列——「分类标签」功能整体下线。
 *
 * 与 DropDishCategoryColumn 不同：tags 是自由填写的标签数组，没有任何地方
 * 能反推出原值。down 只恢复列结构（全为 NULL），**存量标签数据不可找回**。
 */
export class DropDishTags1720000010000 implements MigrationInterface {
  name = 'DropDishTags1720000010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('dishes');
    if (!table || !table.findColumnByName('tags')) return;
    await queryRunner.query('ALTER TABLE `dishes` DROP COLUMN `tags`');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('dishes');
    if (table && table.findColumnByName('tags')) return;
    await queryRunner.query(
      "ALTER TABLE `dishes` ADD COLUMN `tags` text NULL COMMENT '标签'",
    );
  }
}
