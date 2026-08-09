import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 菜品分类改为后台可配置：
 * - 新建 `dish_categories` 字典表（名称/排序/启用）。
 * - `dishes` 新增 `categoryId` 指向它，旧的 `category` varchar 列保留不动（回滚余地）。
 * - 按名称把存量 `dishes.category` 回填成 `categoryId`。
 *
 * 初始分类含业务新增的 5 个，以及存量数据在用的 热菜/凉菜/饮品（sort 排在后面，
 * 后台可自行停用），避免老菜品迁移后丢分类。
 */
const INITIAL_CATEGORIES: Array<[string, number]> = [
  ['肉类', 1],
  ['炖汤', 2],
  ['时蔬', 3],
  ['快手菜', 4],
  ['主食', 5],
  ['热菜', 90],
  ['凉菜', 91],
  ['饮品', 92],
];

export class AddDishCategories1720000008000 implements MigrationInterface {
  name = 'AddDishCategories1720000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('dish_categories');
    if (!hasTable) {
      // 显式跟 `dishes` 对齐 collation：InitSchema 未指定字符集，存量库是
      // utf8mb4_unicode_ci，而新库服务端默认是 utf8mb4_0900_ai_ci，
      // 不对齐会让下面按名称 JOIN 回填时报 ER_CANT_AGGREGATE_2COLLATIONS。
      await queryRunner.query(`
        CREATE TABLE \`dish_categories\` (
          \`id\` int NOT NULL AUTO_INCREMENT COMMENT '分类ID',
          \`name\` varchar(50) NOT NULL COMMENT '分类名称',
          \`sort\` int NOT NULL DEFAULT 0 COMMENT '排序值，小的靠前',
          \`enabled\` tinyint NOT NULL DEFAULT 1 COMMENT '是否启用：0=停用，1=启用',
          \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
          \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_dish_categories_name\` (\`name\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }

    for (const [name, sort] of INITIAL_CATEGORIES) {
      await queryRunner.query(
        'INSERT IGNORE INTO `dish_categories` (`name`, `sort`) VALUES (?, ?)',
        [name, sort],
      );
    }

    const dishes = await queryRunner.getTable('dishes');
    if (dishes && !dishes.findColumnByName('categoryId')) {
      await queryRunner.query(
        "ALTER TABLE `dishes` ADD COLUMN `categoryId` int NULL COMMENT '所属菜品分类ID'",
      );
      await queryRunner.query(
        'CREATE INDEX `IDX_dishes_categoryId` ON `dishes` (`categoryId`)',
      );
    }

    // 按名称回填存量数据。显式 COLLATE 兜底，避免两表 collation 不一致时报错。
    await queryRunner.query(`
      UPDATE \`dishes\` d
      JOIN \`dish_categories\` c
        ON d.\`category\` COLLATE utf8mb4_unicode_ci = c.\`name\` COLLATE utf8mb4_unicode_ci
      SET d.\`categoryId\` = c.\`id\`
      WHERE d.\`categoryId\` IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner
      .query('DROP INDEX `IDX_dishes_categoryId` ON `dishes`')
      .catch(() => undefined);
    await queryRunner
      .query('ALTER TABLE `dishes` DROP COLUMN `categoryId`')
      .catch(() => undefined);
    await queryRunner.query('DROP TABLE IF EXISTS `dish_categories`');
  }
}
