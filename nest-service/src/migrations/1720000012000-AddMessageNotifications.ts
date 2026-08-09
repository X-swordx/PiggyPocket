import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 新增消息通知相关表：messages（消息内容）、message_reads（用户已读时间）。
 */
export class AddMessageNotifications1720000012000 implements MigrationInterface {
  name = 'AddMessageNotifications1720000012000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const messagesTable = await queryRunner.getTable('messages');
    if (!messagesTable) {
      await queryRunner.query(`
        CREATE TABLE \`messages\` (
          \`id\` int NOT NULL AUTO_INCREMENT COMMENT '消息ID',
          \`title\` varchar(100) NOT NULL COMMENT '标题',
          \`content\` text NOT NULL COMMENT '内容',
          \`icon\` varchar(50) NOT NULL DEFAULT 'sound-filled' COMMENT '图标名',
          \`bgColor\` varchar(20) NOT NULL DEFAULT '#ffc2cc' COMMENT '图标背景色',
          \`sort\` int NOT NULL DEFAULT 0 COMMENT '排序值',
          \`enabled\` tinyint NOT NULL DEFAULT 1 COMMENT '是否启用：0-停用，1-启用',
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
          PRIMARY KEY (\`id\`)
        ) ENGINE = InnoDB
      `);
    }

    const readsTable = await queryRunner.getTable('message_reads');
    if (!readsTable) {
      await queryRunner.query(`
        CREATE TABLE \`message_reads\` (
          \`id\` int NOT NULL AUTO_INCREMENT COMMENT '记录ID',
          \`userId\` int NOT NULL COMMENT '用户ID',
          \`readAt\` datetime(6) NOT NULL COMMENT '最近已读时间',
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
          UNIQUE INDEX \`IDX_message_reads_userId\` (\`userId\`),
          PRIMARY KEY (\`id\`)
        ) ENGINE = InnoDB
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const readsTable = await queryRunner.getTable('message_reads');
    if (readsTable) {
      await queryRunner.query('DROP TABLE \`message_reads\`').catch(() => undefined);
    }

    const messagesTable = await queryRunner.getTable('messages');
    if (messagesTable) {
      await queryRunner.query('DROP TABLE \`messages\`').catch(() => undefined);
    }
  }
}
