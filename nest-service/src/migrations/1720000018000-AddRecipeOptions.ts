import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 新增「灵感菜谱」选项配置表 recipe_options：
 *   type=ingredient 食材 / spicy 辣度 / preference 口味偏好 / taboo 忌口，
 * 小程序端生成灵感菜谱时作为可选项，后台可增删改与启停。
 * 同时写入一批常用默认选项（INSERT IGNORE，重复执行不重复插入）。
 */
export class AddRecipeOptions1720000018000 implements MigrationInterface {
  name = 'AddRecipeOptions1720000018000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.getTable('recipe_options'))) {
      await queryRunner.query(
        'CREATE TABLE `recipe_options` (' +
          '`id` int NOT NULL AUTO_INCREMENT, ' +
          '`type` varchar(20) NOT NULL COMMENT \'选项类型：ingredient=食材，spicy=辣度，preference=口味偏好，taboo=忌口\', ' +
          '`name` varchar(50) NOT NULL COMMENT \'选项名称\', ' +
          '`sort` int NOT NULL DEFAULT 0 COMMENT \'排序，小在前\', ' +
          '`enabled` tinyint NOT NULL DEFAULT 1 COMMENT \'状态：0=停用，1=启用\', ' +
          '`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, ' +
          '`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, ' +
          'PRIMARY KEY (`id`), ' +
          'UNIQUE KEY `UQ_recipe_option_type_name` (`type`, `name`), ' +
          'KEY `IDX_recipe_option_list` (`type`, `enabled`, `sort`)' +
          ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT=\'灵感菜谱选项配置\'',
      );
    }

    await this.seedDefaults(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `recipe_options`');
  }

  private async seedDefaults(queryRunner: QueryRunner): Promise<void> {
    const rows: Array<[string, string, number]> = [
      ['ingredient', '鸡蛋', 1],
      ['ingredient', '番茄', 2],
      ['ingredient', '土豆', 3],
      ['ingredient', '猪肉', 4],
      ['ingredient', '五花肉', 5],
      ['ingredient', '排骨', 6],
      ['ingredient', '鸡胸肉', 7],
      ['ingredient', '牛肉', 8],
      ['ingredient', '虾仁', 9],
      ['ingredient', '豆腐', 10],
      ['ingredient', '青菜', 11],
      ['ingredient', '白菜', 12],
      ['ingredient', '黄瓜', 13],
      ['ingredient', '胡萝卜', 14],
      ['ingredient', '洋葱', 15],
      ['ingredient', '青椒', 16],
      ['ingredient', '茄子', 17],
      ['ingredient', '冬瓜', 18],
      ['ingredient', '莲藕', 19],
      ['ingredient', '西兰花', 20],
      ['ingredient', '菌菇', 21],
      ['ingredient', '火腿肠', 22],
      ['ingredient', '面条', 23],
      ['ingredient', '米饭', 24],
      ['spicy', '不辣', 1],
      ['spicy', '微辣', 2],
      ['spicy', '中辣', 3],
      ['spicy', '特辣', 4],
      ['preference', '清淡', 1],
      ['preference', '少油', 2],
      ['preference', '快手菜', 3],
      ['preference', '下饭菜', 4],
      ['preference', '荤素搭配', 5],
      ['preference', '酸甜口', 6],
      ['preference', '红烧炖菜', 7],
      ['preference', '汤羹', 8],
      ['taboo', '不吃香菜', 1],
      ['taboo', '不吃辣', 2],
      ['taboo', '不吃葱蒜', 3],
      ['taboo', '牛羊肉', 4],
      ['taboo', '海鲜', 5],
      ['taboo', '花生', 6],
      ['taboo', '豆制品', 7],
      ['taboo', '动物内脏', 8],
    ];
    for (const [type, name, sort] of rows) {
      await queryRunner.query(
        'INSERT IGNORE INTO `recipe_options` (`type`, `name`, `sort`) VALUES (?, ?, ?)',
        [type, name, sort],
      );
    }
  }
}
