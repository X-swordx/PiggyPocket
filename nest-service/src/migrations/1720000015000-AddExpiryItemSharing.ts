import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 到期物品支持共享到饭搭子组：
 *   - expiry_items 增加可空 groupId（空 = 仅自己可见）。
 *   - 新增 expiry_item_notifications：按「物品 × 接收人」记录已成功推送的提醒。
 *     共享物品要分别推送给组内每个成员，旧的单个 notifiedAt 列无法表达，
 *     先把它的数据回填进新表，再删掉该列。
 */
export class AddExpiryItemSharing1720000015000 implements MigrationInterface {
  name = 'AddExpiryItemSharing1720000015000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('expiry_items');
    if (!table) return;

    if (!table.findColumnByName('groupId')) {
      await queryRunner.query(
        "ALTER TABLE `expiry_items` ADD COLUMN `groupId` int NULL COMMENT '所属饭搭子组ID，为空表示私有' AFTER `userId`",
      );
      await queryRunner.query(
        'CREATE INDEX `IDX_expiry_items_groupId` ON `expiry_items` (`groupId`)',
      );
    }

    const notifTable = await queryRunner.getTable('expiry_item_notifications');
    if (!notifTable) {
      await queryRunner.query(
        'CREATE TABLE `expiry_item_notifications` (' +
          '`id` int NOT NULL AUTO_INCREMENT, ' +
          '`itemId` int NOT NULL COMMENT \'到期物品ID\', ' +
          '`userId` int NOT NULL COMMENT \'接收提醒的用户ID\', ' +
          '`notifiedAt` date NOT NULL COMMENT \'成功推送日期\', ' +
          '`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, ' +
          'PRIMARY KEY (`id`), ' +
          'UNIQUE KEY `UQ_expiry_notif_item_user` (`itemId`, `userId`), ' +
          'KEY `IDX_expiry_notif_itemId` (`itemId`)' +
          ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT=\'到期提醒按人推送记录\'',
      );

      // 旧的 notifiedAt 是推给物品创建者的，回填成 (itemId, userId=物品所有者)
      if (table.findColumnByName('notifiedAt')) {
        await queryRunner.query(
          'INSERT INTO `expiry_item_notifications` (`itemId`, `userId`, `notifiedAt`, `createdAt`) ' +
            'SELECT `id`, `userId`, `notifiedAt`, COALESCE(`updatedAt`, NOW()) ' +
            'FROM `expiry_items` WHERE `notifiedAt` IS NOT NULL',
        );
      }
    }

    if (table.findColumnByName('notifiedAt')) {
      await queryRunner.query(
        'ALTER TABLE `expiry_items` DROP COLUMN `notifiedAt`',
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('expiry_items');
    if (table && !table.findColumnByName('notifiedAt')) {
      await queryRunner.query(
        "ALTER TABLE `expiry_items` ADD COLUMN `notifiedAt` date NULL COMMENT '已推送提醒的日期'",
      );
      // 用该物品最早一条推送记录还原所有者维度的旧标记
      await queryRunner.query(
        'UPDATE `expiry_items` `i` ' +
          'JOIN (SELECT `itemId`, MIN(`notifiedAt`) AS `n` FROM `expiry_item_notifications` GROUP BY `itemId`) `x` ' +
          'ON `i`.`id` = `x`.`itemId` SET `i`.`notifiedAt` = `x`.`n`',
      );
    }

    await queryRunner.query('DROP TABLE IF EXISTS `expiry_item_notifications`').catch(
      () => undefined,
    );

    await queryRunner
      .query('DROP INDEX `IDX_expiry_items_groupId` ON `expiry_items`')
      .catch(() => undefined);
    await queryRunner
      .query('ALTER TABLE `expiry_items` DROP COLUMN `groupId`')
      .catch(() => undefined);
  }
}
