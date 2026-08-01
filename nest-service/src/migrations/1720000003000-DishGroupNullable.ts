import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * dishes.groupId 原本 NOT NULL，饭搭子解散时无法置 NULL。
 * 放宽为可空，语义与 orders.groupId 对齐。
 */
export class DishGroupNullable1720000003000 implements MigrationInterface {
  name = 'DishGroupNullable1720000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `dishes` MODIFY COLUMN `groupId` int NULL COMMENT \'所属饭搭子组ID\'',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 兜底：把 NULL 改成 0 再改回 NOT NULL
    await queryRunner.query('UPDATE `dishes` SET `groupId` = 0 WHERE `groupId` IS NULL');
    await queryRunner.query(
      'ALTER TABLE `dishes` MODIFY COLUMN `groupId` int NOT NULL DEFAULT 0 COMMENT \'所属饭搭子组ID\'',
    );
  }
}
