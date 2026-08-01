import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 给 users 表加 status 字段：1=启用 0=禁用
 * 默认 1，历史所有用户都视为启用。
 */
export class AddUserStatus1720000004000 implements MigrationInterface {
  name = 'AddUserStatus1720000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    if (!table || table.findColumnByName('status')) return;
    await queryRunner.query(
      "ALTER TABLE `users` ADD COLUMN `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态：1=启用 0=禁用'",
    );
    await queryRunner.query('CREATE INDEX `IDX_users_status` ON `users` (`status`)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX `IDX_users_status` ON `users`').catch(() => undefined);
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `status`').catch(() => undefined);
  }
}
