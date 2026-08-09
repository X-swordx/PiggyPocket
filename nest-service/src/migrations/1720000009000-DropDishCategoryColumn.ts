import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 删除 `dishes.category` 旧列。
 *
 * 前置：AddDishCategories 已把 category 按名称回填成 categoryId，且三端代码
 * 均已改读 categoryId / categoryRef，不再有任何地方读这个列。
 *
 * down 只恢复列结构并按 categoryId 反填名称——能还原数据是因为分类名本身
 * 就存在 dish_categories 里；历史上那些名字对不上分类的脏值无法找回。
 */
export class DropDishCategoryColumn1720000009000 implements MigrationInterface {
  name = 'DropDishCategoryColumn1720000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('dishes');
    if (!table || !table.findColumnByName('category')) return;
    await queryRunner.query('ALTER TABLE `dishes` DROP COLUMN `category`');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('dishes');
    if (table && table.findColumnByName('category')) return;
    await queryRunner.query(
      "ALTER TABLE `dishes` ADD COLUMN `category` varchar(50) NULL COMMENT '分类：热菜/凉菜/主食/饮品'",
    );
    await queryRunner.query(`
      UPDATE \`dishes\` d
      JOIN \`dish_categories\` c ON d.\`categoryId\` = c.\`id\`
      SET d.\`category\` = c.\`name\`
    `);
  }
}
