import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

/**
 * 新增「拉粑粑么」模块：
 *   - poop_records：每次排便一条（布里斯托分型 1-7），recordDate 为东八区日历日。
 *   - poop_reminder_notifications：每晚提醒的「用户 × 日期」去重记录。
 *   - wechat_subscribe_quotas 增加 templateType：到期/排便两种模板的额度分开累计，
 *     旧的 userId 单列唯一索引替换为 (userId, templateType) 复合唯一索引。
 */
export class AddPoopModule1720000017000 implements MigrationInterface {
  name = 'AddPoopModule1720000017000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.getTable('poop_records'))) {
      await queryRunner.query(
        'CREATE TABLE `poop_records` (' +
          '`id` int NOT NULL AUTO_INCREMENT, ' +
          '`userId` int NOT NULL COMMENT \'用户ID\', ' +
          '`recordDate` date NOT NULL COMMENT \'排便日期（东八区日历日）\', ' +
          '`occurredAt` datetime NOT NULL COMMENT \'实际排便时间（UTC）\', ' +
          '`bristolType` tinyint NOT NULL COMMENT \'布里斯托大便分型 1-7\', ' +
          '`notes` text NULL COMMENT \'备注\', ' +
          '`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, ' +
          '`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, ' +
          'PRIMARY KEY (`id`), ' +
          'KEY `IDX_poop_userId` (`userId`), ' +
          'KEY `IDX_poop_user_date` (`userId`, `recordDate`)' +
          ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT=\'排便记录\'',
      );
    }

    if (!(await queryRunner.getTable('poop_reminder_notifications'))) {
      await queryRunner.query(
        'CREATE TABLE `poop_reminder_notifications` (' +
          '`id` int NOT NULL AUTO_INCREMENT, ' +
          '`userId` int NOT NULL COMMENT \'接收提醒的用户ID\', ' +
          '`notifiedAt` date NOT NULL COMMENT \'成功推送日期（东八区日历日）\', ' +
          '`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, ' +
          'PRIMARY KEY (`id`), ' +
          'UNIQUE KEY `UQ_poop_reminder_user_date` (`userId`, `notifiedAt`)' +
          ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT=\'排便提醒按日推送记录\'',
      );
    }

    await this.migrateQuotaTable(queryRunner, true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `poop_records`');
    await queryRunner.query('DROP TABLE IF EXISTS `poop_reminder_notifications`');
    await this.migrateQuotaTable(queryRunner, false);
  }

  /**
   * quota 表结构在新旧两种形态间切换。
   * up：旧的 userId 唯一索引 → (userId, templateType) 复合唯一；
   * down：反向还原。
   */
  private async migrateQuotaTable(
    queryRunner: QueryRunner,
    isUp: boolean,
  ): Promise<void> {
    const table = await queryRunner.getTable('wechat_subscribe_quotas');
    if (!table) return;

    const hasType = !!table.findColumnByName('templateType');
    if (isUp && hasType) return;
    if (!isUp && !hasType) return;

    if (isUp) {
      // 旧唯一索引的名字是 TypeORM 生成的哈希名，从表元数据里按结构找出来删
      const uniqueOnUser = table.indices.find(
        (index: TableIndex) =>
          index.isUnique &&
          index.columnNames.length === 1 &&
          index.columnNames[0] === 'userId',
      );
      if (uniqueOnUser) {
        await queryRunner.query(
          `DROP INDEX \`${uniqueOnUser.name}\` ON \`wechat_subscribe_quotas\``,
        );
      }

      await queryRunner.query(
        "ALTER TABLE `wechat_subscribe_quotas` " +
          "ADD COLUMN `templateType` varchar(20) NOT NULL DEFAULT 'expiry' COMMENT '模板类型：expiry/poop' AFTER `userId`",
      );
      await queryRunner.query(
        'CREATE UNIQUE INDEX `IDX_quota_user_type` ON `wechat_subscribe_quotas` (`userId`, `templateType`)',
      );
      await queryRunner.query(
        'CREATE INDEX `IDX_quota_userId` ON `wechat_subscribe_quotas` (`userId`)',
      );
    } else {
      await queryRunner.query(
        'DROP INDEX `IDX_quota_user_type` ON `wechat_subscribe_quotas`',
      );
      await queryRunner.query(
        'DROP INDEX `IDX_quota_userId` ON `wechat_subscribe_quotas`',
      );
      await queryRunner.query(
        'ALTER TABLE `wechat_subscribe_quotas` DROP COLUMN `templateType`',
      );
      await queryRunner.query(
        'CREATE UNIQUE INDEX `IDX_quota_userId_old` ON `wechat_subscribe_quotas` (`userId`)',
      );
    }
  }
}
