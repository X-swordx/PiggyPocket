import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1720000000000 implements MigrationInterface {
  name = 'InitSchema1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` int NOT NULL AUTO_INCREMENT COMMENT '用户ID',
        \`openid\` varchar(100) NULL COMMENT '微信 openid',
        \`name\` varchar(50) NULL COMMENT '用户名',
        \`nickname\` varchar(50) NULL COMMENT '微信昵称',
        \`avatar\` varchar(255) NULL COMMENT '微信头像URL',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
        UNIQUE INDEX \`IDX_users_openid\` (\`openid\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE = InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`dining_groups\` (
        \`id\` int NOT NULL AUTO_INCREMENT COMMENT '组ID',
        \`name\` varchar(100) NOT NULL COMMENT '组名',
        \`creatorId\` int NOT NULL COMMENT '创建者ID',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
        PRIMARY KEY (\`id\`)
      ) ENGINE = InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`dishes\` (
        \`id\` int NOT NULL AUTO_INCREMENT COMMENT '菜品ID',
        \`name\` varchar(100) NOT NULL COMMENT '菜品名称',
        \`description\` text NULL COMMENT '描述',
        \`category\` varchar(50) NULL COMMENT '分类：热菜/凉菜/主食/饮品',
        \`image\` varchar(255) NULL COMMENT '图片URL',
        \`status\` tinyint NOT NULL DEFAULT 1 COMMENT '状态：0=下架，1=上架',
        \`calories\` int NULL COMMENT '热量',
        \`cookingTime\` varchar(50) NULL COMMENT '烹饪时间',
        \`ingredients\` text NULL COMMENT '用料',
        \`steps\` text NULL COMMENT '烹饪步骤',
        \`tags\` text NULL COMMENT '标签',
        \`bgColor\` varchar(20) NULL COMMENT '背景色',
        \`userId\` int NOT NULL COMMENT '创建者ID',
        \`groupId\` int NOT NULL COMMENT '所属饭搭子组ID',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
        PRIMARY KEY (\`id\`)
      ) ENGINE = InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`wishes\` (
        \`id\` int NOT NULL AUTO_INCREMENT COMMENT '心愿ID',
        \`userId\` int NOT NULL COMMENT '用户ID',
        \`title\` varchar(100) NOT NULL COMMENT '心愿名称',
        \`category\` varchar(20) NULL COMMENT '分类：旅行/技能/健康/成长',
        \`tagClass\` varchar(20) NULL COMMENT '分类样式标识',
        \`filter\` int NOT NULL DEFAULT 0 COMMENT '筛选分组序号',
        \`completed\` tinyint NOT NULL DEFAULT 0 COMMENT '是否已完成',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
        INDEX \`IDX_wishes_userId\` (\`userId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE = InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`expiry_foods\` (
        \`id\` int NOT NULL AUTO_INCREMENT COMMENT '食品ID',
        \`userId\` int NOT NULL COMMENT '用户ID',
        \`name\` varchar(100) NOT NULL COMMENT '食品名称',
        \`imageUrl\` varchar(255) NULL COMMENT '图片URL',
        \`expiryDate\` date NOT NULL COMMENT '保质期日期',
        \`quantity\` int NOT NULL DEFAULT 1 COMMENT '数量',
        \`storage\` varchar(20) NULL COMMENT '储存位置：fridge/freezer/pantry',
        \`category\` varchar(20) NULL COMMENT '分类',
        \`notes\` text NULL COMMENT '备注',
        \`bgColor\` varchar(20) NULL COMMENT '背景色',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
        INDEX \`IDX_expiry_foods_userId\` (\`userId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE = InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`orders\` (
        \`id\` int NOT NULL AUTO_INCREMENT COMMENT '订单ID',
        \`orderNo\` varchar(50) NOT NULL COMMENT '订单号',
        \`userId\` int NOT NULL COMMENT '下单用户ID',
        \`groupId\` int NULL COMMENT '用餐组ID',
        \`status\` varchar(20) NOT NULL DEFAULT 'pending' COMMENT '状态：pending/confirming/cooking/completed',
        \`remark\` text NULL COMMENT '订单备注',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
        UNIQUE INDEX \`IDX_orders_orderNo\` (\`orderNo\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE = InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`dining_group_members\` (
        \`id\` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
        \`groupId\` int NOT NULL COMMENT '组ID',
        \`userId\` int NOT NULL COMMENT '用户ID',
        \`nickname\` varchar(50) NULL COMMENT '在组内的昵称',
        \`joinedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '加入时间',
        PRIMARY KEY (\`id\`)
      ) ENGINE = InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`order_items\` (
        \`id\` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
        \`orderId\` int NOT NULL COMMENT '订单ID',
        \`dishId\` int NOT NULL COMMENT '菜品ID',
        \`quantity\` int NOT NULL DEFAULT 1 COMMENT '数量',
        \`remark\` varchar(255) NULL COMMENT '单项备注',
        PRIMARY KEY (\`id\`)
      ) ENGINE = InnoDB
    `);

    // 添加外键约束
    await queryRunner.query(`
      ALTER TABLE \`dining_groups\`
      ADD CONSTRAINT \`FK_dining_groups_creatorId\`
      FOREIGN KEY (\`creatorId\`) REFERENCES \`users\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`dishes\`
      ADD CONSTRAINT \`FK_dishes_userId\`
      FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`orders\`
      ADD CONSTRAINT \`FK_orders_userId\`
      FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`orders\`
      ADD CONSTRAINT \`FK_orders_groupId\`
      FOREIGN KEY (\`groupId\`) REFERENCES \`dining_groups\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`dining_group_members\`
      ADD CONSTRAINT \`FK_dining_group_members_groupId\`
      FOREIGN KEY (\`groupId\`) REFERENCES \`dining_groups\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`dining_group_members\`
      ADD CONSTRAINT \`FK_dining_group_members_userId\`
      FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`order_items\`
      ADD CONSTRAINT \`FK_order_items_orderId\`
      FOREIGN KEY (\`orderId\`) REFERENCES \`orders\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`order_items\`
      ADD CONSTRAINT \`FK_order_items_dishId\`
      FOREIGN KEY (\`dishId\`) REFERENCES \`dishes\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_order_items_dishId\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_order_items_orderId\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`dining_group_members\` DROP FOREIGN KEY \`FK_dining_group_members_userId\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`dining_group_members\` DROP FOREIGN KEY \`FK_dining_group_members_groupId\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_orders_groupId\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_orders_userId\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`dishes\` DROP FOREIGN KEY \`FK_dishes_userId\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`dining_groups\` DROP FOREIGN KEY \`FK_dining_groups_creatorId\`
    `);

    await queryRunner.query(`DROP TABLE \`order_items\``);
    await queryRunner.query(`DROP TABLE \`dining_group_members\``);
    await queryRunner.query(`DROP TABLE \`orders\``);
    await queryRunner.query(`DROP TABLE \`expiry_foods\``);
    await queryRunner.query(`DROP TABLE \`wishes\``);
    await queryRunner.query(`DROP TABLE \`dishes\``);
    await queryRunner.query(`DROP TABLE \`dining_groups\``);
    await queryRunner.query(`DROP TABLE \`users\``);
  }
}
