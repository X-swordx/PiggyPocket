import 'reflect-metadata';
import dataSource from './data-source';
import { User } from './modules/foodie-buddy/user/entities/user.entity';
import { DiningGroup } from './modules/foodie-buddy/dining-group/entities/dining-group.entity';
import { DiningGroupMember } from './modules/foodie-buddy/dining-group/entities/dining-group-member.entity';
import { Dish } from './modules/foodie-buddy/dish/entities/dish.entity';
import { DishCategory } from './modules/foodie-buddy/dish/entities/dish-category.entity';

/** 与 AddDishCategories migration 保持一致，仅作本地兜底。 */
const CATEGORY_SEEDS: Array<[string, number]> = [
  ['肉类', 1],
  ['炖汤', 2],
  ['时蔬', 3],
  ['快手菜', 4],
  ['主食', 5],
  ['热菜', 90],
  ['凉菜', 91],
  ['饮品', 92],
];

const DISH_SEEDS = [
  {
    name: '宫保鸡丁',
    categoryName: '热菜',
    calories: 320,
    cookingTime: '25 分钟',
    bgColor: '#f0b7a4',
    ingredients: [
      { name: '鸡胸肉', amount: '300g' },
      { name: '花生米', amount: '50g' },
      { name: '干辣椒', amount: '10g' },
      { name: '大葱', amount: '2根' },
    ],
    steps: ['鸡胸肉切丁，加料酒、生抽腌制 10 分钟', '热锅凉油炸香花生米', '爆香干辣椒和葱段，滑炒鸡丁', '调入宫保汁，撒花生米翻炒均匀'],
  },
  {
    name: '西红柿炒蛋',
    categoryName: '热菜',
    calories: 180,
    cookingTime: '15 分钟',
    bgColor: '#f5cac3',
    ingredients: [
      { name: '西红柿', amount: '2个' },
      { name: '鸡蛋', amount: '3个' },
      { name: '葱花', amount: '少许' },
    ],
    steps: ['西红柿切块，鸡蛋打散', '先炒熟鸡蛋盛出', '炒软西红柿后倒回鸡蛋', '加盐调味，撒葱花出锅'],
  },
  {
    name: '麻婆豆腐',
    categoryName: '热菜',
    calories: 260,
    cookingTime: '20 分钟',
    bgColor: '#e67e22',
    ingredients: [
      { name: '嫩豆腐', amount: '400g' },
      { name: '猪肉末', amount: '100g' },
      { name: '豆瓣酱', amount: '1勺' },
      { name: '花椒粉', amount: '适量' },
    ],
    steps: ['豆腐切块焯水', '炒香肉末和豆瓣酱', '加水煮开，滑入豆腐', '勾芡后撒花椒粉'],
  },
  {
    name: '蒜蓉西兰花',
    categoryName: '凉菜',
    calories: 90,
    cookingTime: '10 分钟',
    bgColor: '#a8d5ba',
    ingredients: [
      { name: '西兰花', amount: '300g' },
      { name: '大蒜', amount: '5瓣' },
    ],
    steps: ['西兰花切小朵焯水', '蒜末爆香', '下西兰花快速翻炒', '加盐调味即可'],
  },
  {
    name: '红烧肉',
    categoryName: '热菜',
    calories: 450,
    cookingTime: '60 分钟',
    bgColor: '#8aa6cb',
    ingredients: [
      { name: '五花肉', amount: '500g' },
      { name: '冰糖', amount: '30g' },
      { name: '生抽', amount: '2勺' },
      { name: '八角', amount: '2个' },
    ],
    steps: ['五花肉切块焯水', '炒糖色后下肉块', '加调料和热水炖煮 45 分钟', '大火收汁出锅'],
  },
];

async function seed() {
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const groupRepo = dataSource.getRepository(DiningGroup);
  const memberRepo = dataSource.getRepository(DiningGroupMember);
  const dishRepo = dataSource.getRepository(Dish);
  const categoryRepo = dataSource.getRepository(DishCategory);

  // 分类由 migration 建好，这里只做兜底（本地库未跑 migration 时）
  const categoryCount = await categoryRepo.count();
  if (categoryCount === 0) {
    await categoryRepo.save(
      CATEGORY_SEEDS.map(([name, sort]) => categoryRepo.create({ name, sort })),
    );
  }
  const categories = await categoryRepo.find();
  const categoryIdOf = (name: string) =>
    categories.find((c) => c.name === name)?.id ?? null;

  let user = await userRepo.findOne({ where: { openid: 'dev' } });
  if (!user) {
    const existingOne = await userRepo.findOne({ where: { id: 1 } });
    if (existingOne) {
      existingOne.openid = 'dev';
      existingOne.name = '开发用户';
      existingOne.nickname = '猪猪主人';
      user = await userRepo.save(existingOne);
    } else {
      user = await userRepo.save(
        userRepo.create({
          id: 1,
          openid: 'dev',
          name: '开发用户',
          nickname: '猪猪主人',
          status: 1,
        }),
      );
    }
  }

  let group = await groupRepo.findOne({ where: { creatorId: user.id } });
  if (!group) {
    group = await groupRepo.save(
      groupRepo.create({
        name: '临时饭搭子',
        creatorId: user.id,
      }),
    );
    await memberRepo.save(
      memberRepo.create({
        groupId: group.id,
        userId: user.id,
        nickname: user.nickname || user.name,
      }),
    );
  }

  const dishCount = await dishRepo.count({ where: { userId: user.id } });
  if (dishCount === 0) {
    const dishes = DISH_SEEDS.map(({ categoryName, ...dish }) =>
      dishRepo.create({
        ...dish,
        categoryId: categoryIdOf(categoryName),
        userId: user.id,
        groupId: group.id,
        status: 1,
      }),
    );
    await dishRepo.save(dishes);
  }

  console.log(`✅ 本地种子数据完成：userId=${user.id}, groupId=${group.id}`);
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ 种子数据失败', err);
  process.exit(1);
});
