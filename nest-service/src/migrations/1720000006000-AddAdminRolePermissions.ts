import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 角色权限配置表。建表后灌入与 DEFAULT_ROLE_PERMISSIONS 一致的初始值，
 * 使升级前后行为完全一致。superadmin 不入表（固定全权限）。
 */
export class AddAdminRolePermissions1720000006000 implements MigrationInterface {
  name = 'AddAdminRolePermissions1720000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`admin_role_permissions\` (
        \`id\` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
        \`role\` varchar(20) NOT NULL COMMENT '角色',
        \`permissions\` text NOT NULL COMMENT '权限码列表（JSON 数组）',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
        UNIQUE INDEX \`IDX_admin_role_perm_role\` (\`role\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE = InnoDB
    `);

    const operator = [
      'admin.dashboard:view',
      'admin.user:view',
      'admin.user:edit',
      'admin.expiryFood:view',
      'admin.expiryFood:edit',
      'admin.wish:view',
      'admin.wish:edit',
      'admin.dish:view',
      'admin.dish:edit',
      'admin.order:view',
      'admin.order:edit',
      'admin.diningGroup:view',
      'admin.diningGroup:edit',
    ];
    const viewer = [
      'admin.dashboard:view',
      'admin.user:view',
      'admin.expiryFood:view',
      'admin.wish:view',
      'admin.dish:view',
      'admin.order:view',
      'admin.diningGroup:view',
    ];

    await queryRunner.query(
      'INSERT INTO `admin_role_permissions` (`role`, `permissions`) VALUES (?, ?), (?, ?)',
      ['operator', JSON.stringify(operator), 'viewer', JSON.stringify(viewer)],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `admin_role_permissions`');
  }
}
