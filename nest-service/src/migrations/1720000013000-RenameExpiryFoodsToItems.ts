import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 「临期食品」改造为「到期管家」：登记家里所有有期限的物品，而不只是食品。
 *
 * - `expiry_foods` 重命名为 `expiry_items`。
 * - 新增 `remindDays`（提前多少天提醒）、`notifiedAt`（已推送提醒的日期，非空即不再重复推）。
 * - `category` 从食品专用枚举归并到物品分类：原来的 dairy/meat/vegetable/fruit/
 *   seafood/condiment/snack 全部并成 `food`，`other` 原样保留。
 * - 新建 `wechat_subscribe_quotas`：微信小程序「一次订阅授权只能推一条消息」，
 *   所以要把用户攒下的授权次数累计起来，推送时逐次消费。
 *
 * 注意 down() 是**有损回滚**：归并成 food 的分类无法还原成原来的食品分类。
 */
const FOOD_CATEGORIES = [
  'dairy',
  'meat',
  'vegetable',
  'fruit',
  'seafood',
  'condiment',
  'snack',
];

export class RenameExpiryFoodsToItems1720000013000
  implements MigrationInterface
{
  name = 'RenameExpiryFoodsToItems1720000013000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasOld = await queryRunner.hasTable('expiry_foods');
    const hasNew = await queryRunner.hasTable('expiry_items');
    if (hasOld && !hasNew) {
      await queryRunner.query(
        'RENAME TABLE `expiry_foods` TO `expiry_items`',
      );
    }

    const items = await queryRunner.getTable('expiry_items');
    if (items && !items.findColumnByName('remindDays')) {
      await queryRunner.query(
        "ALTER TABLE `expiry_items` ADD COLUMN `remindDays` int NOT NULL DEFAULT 3 COMMENT '提前多少天提醒'",
      );
    }
    if (items && !items.findColumnByName('notifiedAt')) {
      await queryRunner.query(
        "ALTER TABLE `expiry_items` ADD COLUMN `notifiedAt` date NULL COMMENT '已推送提醒的日期'",
      );
    }

    await queryRunner.query(
      `UPDATE \`expiry_items\` SET \`category\` = 'food' WHERE \`category\` IN (${FOOD_CATEGORIES.map(
        () => '?',
      ).join(', ')})`,
      FOOD_CATEGORIES,
    );

    const hasQuota = await queryRunner.hasTable('wechat_subscribe_quotas');
    if (!hasQuota) {
      await queryRunner.query(`
        CREATE TABLE \`wechat_subscribe_quotas\` (
          \`id\` int NOT NULL AUTO_INCREMENT COMMENT '记录ID',
          \`userId\` int NOT NULL COMMENT '用户ID',
          \`remaining\` int NOT NULL DEFAULT 0 COMMENT '剩余可推送次数',
          \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
          \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_wechat_subscribe_quotas_userId\` (\`userId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `wechat_subscribe_quotas`');

    const items = await queryRunner.getTable('expiry_items');
    if (items?.findColumnByName('notifiedAt')) {
      await queryRunner.query(
        'ALTER TABLE `expiry_items` DROP COLUMN `notifiedAt`',
      );
    }
    if (items?.findColumnByName('remindDays')) {
      await queryRunner.query(
        'ALTER TABLE `expiry_items` DROP COLUMN `remindDays`',
      );
    }

    // 归并掉的食品分类无法还原，统一落到 other，避免留下新枚举值污染旧代码
    await queryRunner.query(
      "UPDATE `expiry_items` SET `category` = 'other' WHERE `category` NOT IN ('other')",
    );

    const hasNew = await queryRunner.hasTable('expiry_items');
    const hasOld = await queryRunner.hasTable('expiry_foods');
    if (hasNew && !hasOld) {
      await queryRunner.query(
        'RENAME TABLE `expiry_items` TO `expiry_foods`',
      );
    }
  }
}
