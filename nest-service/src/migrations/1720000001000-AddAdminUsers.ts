import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';

/**
 * 新增管理端 admin_users 表，并植入默认超管账号 superadmin / admin123456。
 * 上线后请立即修改默认密码。
 */
export class AddAdminUsers1720000001000 implements MigrationInterface {
  name = 'AddAdminUsers1720000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`admin_users\` (
        \`id\` int NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
        \`username\` varchar(50) NOT NULL COMMENT '登录用户名',
        \`passwordHash\` varchar(100) NOT NULL COMMENT '密码哈希（bcrypt）',
        \`nickname\` varchar(50) NULL COMMENT '显示昵称',
        \`avatar\` varchar(255) NULL COMMENT '头像 URL',
        \`role\` varchar(20) NOT NULL DEFAULT 'operator' COMMENT '角色：superadmin/operator/viewer',
        \`status\` tinyint NOT NULL DEFAULT 1 COMMENT '状态：1=启用 0=禁用',
        \`lastLoginAt\` datetime NULL COMMENT '最后登录时间',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
        UNIQUE INDEX \`IDX_admin_users_username\` (\`username\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE = InnoDB
    `);

    const hash = await bcrypt.hash('admin123456', 10);
    await queryRunner.query(
      `INSERT INTO \`admin_users\`
        (\`username\`, \`passwordHash\`, \`nickname\`, \`role\`, \`status\`)
       VALUES (?, ?, ?, 'superadmin', 1)`,
      ['superadmin', hash, '超级管理员'],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `admin_users`');
  }
}
