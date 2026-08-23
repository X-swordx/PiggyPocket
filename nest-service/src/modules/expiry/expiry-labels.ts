import { ExpiryItem } from "./entities/expiry-item.entity";

/** 物品分类 code -> 中文，用于拼接语义搜索文本和微信通知文案。 */
export const CATEGORY_LABELS: Record<string, string> = {
  food: "食品饮料",
  medicine: "药品",
  cosmetic: "美妆护肤",
  daily: "日用品",
  pet: "宠物用品",
  consumable: "滤芯耗材",
  card: "卡券会员",
  document: "证件保险",
  other: "其他",
};

/** 存放位置 code -> 中文。 */
export const STORAGE_LABELS: Record<string, string> = {
  fridge: "冰箱冷藏",
  freezer: "冰箱冷冻",
  pantry: "常温橱柜",
  cabinet: "药箱收纳柜",
  other: "其他",
};

/**
 * 根据名称推断更细的语义标签，补强 embedding 召回。
 * 例如「花生油」本身不会跟「炒菜调料」强相关，补上「调料 炒菜用」后就能被搜到。
 */
const semanticHints = (name: string): string => {
  const n = name;
  if (
    /生抽|老抽|酱油|蚝油|醋|料酒|豆瓣酱|黄豆酱|辣椒酱|火锅底料|调料|调味料|鸡精|味精|花椒|八角|桂皮|孜然|芥末|番茄酱|沙拉酱|芝麻酱/i.test(
      n
    )
  )
    return "调料 调味品 炒菜用";
  if (/花生油|菜籽油|橄榄油|玉米油|葵花籽油|食用油|猪油/i.test(n))
    return "食用油 调料 炒菜用";
  if (/白砂糖|冰糖|红糖|盐/.test(n)) return "调料 调味品 炒菜用";
  if (
    /卸妆|洁面|洗面奶|面膜|精华|爽肤水|乳液|面霜|眼霜|防晒|隔离|粉底|口红|唇膏/i.test(
      n
    )
  )
    return "护肤品 化妆品";
  if (/洗发水|护发素|发膜/i.test(n)) return "洗护用品 洗头发";
  if (/沐浴露|香皂/i.test(n)) return "洗护用品 洗澡用";
  if (/洗衣液|洗衣粉|柔顺剂/i.test(n)) return "洗衣用品";
  if (/牙膏|牙刷|漱口水|牙线/i.test(n)) return "口腔护理";
  if (/口罩|消毒液|酒精|碘伏|棉签|创可贴|退热贴|体温计/i.test(n))
    return "医疗用品";
  if (/滤芯|滤网/i.test(n)) return "耗材 该换了";
  if (/猫粮|狗粮|猫罐头|狗罐头|猫砂|化毛膏|驱虫/i.test(n)) return "宠物用品";
  if (/牛奶|酸奶|芝士|奶酪/i.test(n)) return "乳制品";
  if (/咖啡|咖啡豆|咖啡粉/i.test(n)) return "咖啡";
  if (/茶叶|红茶|绿茶|乌龙茶|普洱茶|茶包/i.test(n)) return "茶";
  if (/大米|面粉|面条|挂面|饺子|馒头|面包|麦片|米粉/i.test(n))
    return "主食 粮食";
  return "";
};

/**
 * 拼成一句自然语言交给 embedding 模型。
 * 带上分类、位置、备注和语义补强词，「感冒药」才能命中放在药箱里的「布洛芬」，
 * 「炒菜调料」才能命中「花生油」。
 */
export const buildSearchText = (item: ExpiryItem): string =>
  [
    item.name,
    semanticHints(item.name),
    item.category ? CATEGORY_LABELS[item.category] : "",
    item.storage ? STORAGE_LABELS[item.storage] : "",
    item.notes,
  ]
    .filter(Boolean)
    .join(" ");
