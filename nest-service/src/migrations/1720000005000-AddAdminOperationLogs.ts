import { MigrationInterface, QueryRunner } from 'typeorm';

/** 新增后台操作日志表 */
export class AddAdminOperationLogs1720000005000 implements MigrationInterface {
  name = 'AddAdminOperationLogs1720000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`admin_operation_logs\` (
        \`id\` int NOT NULL AUTO_INCREMENT COMMENT '日志ID',
        \`adminId\` int NOT NULL COMMENT '管理员ID',
        \`adminUsername\` varchar(50) NOT NULL COMMENT '管理员账号',
        \`action\` varchar(30) NOT NULL COMMENT '动作',
        \`resource\` varchar(50) NULL COMMENT '资源类型或模块名',
        \`target\` varchar(100) NULL COMMENT '资源 ID',
        \`payload\` text NULL COMMENT '附加上下文',
        \`ip\` varchar(64) NULL COMMENT '操作 IP',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        INDEX \`IDX_admin_oplog_createdAt\` (\`createdAt\`),
        INDEX \`IDX_admin_oplog_admin\` (\`adminId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE = InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `admin_operation_logs`');
  }
}
