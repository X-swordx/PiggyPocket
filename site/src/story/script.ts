// The nine-scene storyboard. Eight boards, one per product module, carry fifteen real
// phone captures laid out in a serpentine path; the ninth scene pulls the camera back to
// show the whole route. Every spotlight is converted from the focus rectangles measured
// in shots.json, never guessed.

import shotData from "./shots.json";
import { bounds, CAMERA_MOVE, createTimeline, framed, padded, type SceneSpec, type Shot, type WorldRect } from "../engine/timeline.ts";

export const SCENES = [
  {
    key: "home",
    index: "01",
    chapter: "一个入口",
    title: "生活里的小事，都收在一个本子",
    hook: "到期、吃饭、心愿、搭伙，一样不落",
    summary: "从猪猪生活本首页打开六个模块：到期管家、美食菜单、心愿清单、搭伙管理、拉粑粑么和我的。",
    weight: 1,
  },
  {
    key: "expiry",
    index: "02",
    chapter: "到期管家",
    title: "到期先看谁，搜东西用大白话",
    hook: "冰箱药箱里，谁先过期不用翻包装",
    summary: "到期管家按剩余天数排列物品，快过期的鲜牛奶、护手霜和布洛芬排在最前面；输入「感冒药」用大白话也能搜到布洛芬。",
    weight: 1,
  },
  {
    key: "add",
    index: "03",
    chapter: "拍照录入",
    title: "拍两张照片，日期和提醒自己填",
    hook: "手抄生产日期和保质期，最容易抄错",
    summary: "编辑物品页先拍名称面、再拍日期面，名称、生产日期和保质期字段自动补上并算出到期日；详情页同时记着提前提醒和药箱位置。",
    weight: 1,
  },
  {
    key: "food",
    index: "04",
    chapter: "美食菜单",
    title: "菜谱、今日菜单，都在美食菜单里",
    hook: "想吃的菜，总是临时想不起来",
    summary: "美食菜单可以上传菜谱：封面、名称、AI 搜用料步骤、比例调整、分类和分享到搭伙；今日菜单按分类筛选，一键加菜。",
    weight: 1,
  },
  {
    key: "cook",
    index: "05",
    chapter: "灵感与订单",
    title: "说想吃什么，猪猪帮你配一桌",
    hook: "买菜前不知道做什么，容易剩一堆",
    summary: "灵感菜谱选手头食材、人数、辣度、口味和忌口，流式推荐菜；选中后填做菜日期、份数和备注，确认下单。",
    weight: 1,
  },
  {
    key: "wishes",
    index: "06",
    chapter: "心愿清单",
    title: "心愿写下来，实现一件勾一件",
    hook: "想做的事，忙起来就忘了",
    summary: "心愿清单按分类筛选、显示进度，勾选即可标记实现；实现心愿页回看每一件做成的事。",
    weight: 1,
  },
  {
    key: "together",
    index: "07",
    chapter: "搭伙与记录",
    title: "搭伙与记录，两个人一起用",
    hook: "菜单各记各的，身体状态也没人管",
    summary: "搭伙管理看伙伴和成员、共享菜谱菜单订单、邀请好友或解除关联；拉粑粑么记录今日和本月次数、月历、布里斯托类型、备注，并给出 AI 建议。",
    weight: 1,
  },
  {
    key: "me",
    index: "08",
    chapter: "我的与历史",
    title: "订单、历史菜单和评分，都在我的",
    hook: "做过的菜、吃过的好不好，全散在聊天里",
    summary: "我的页面显示微信资料、搭伙和历史统计、按做菜日期分组的猪猪订单；历史菜单回看做过的菜并评分，主题色也可以自己换。",
    weight: 1,
  },
  {
    key: "finale",
    index: "09",
    chapter: "完整闭环",
    title: "从一件小事，到每天的生活",
    hook: "六个模块，一个本子，一起过日子",
    summary: "镜头拉远，十五张真实界面串成一条路：到期、吃饭、心愿、搭伙、日常记录和回顾，都收在同一个本子里。",
    weight: 0.9,
  },
] as const satisfies readonly SceneSpec[];

export const TIMELINE = createTimeline(SCENES);
const { beat } = TIMELINE;

/** ~135 stable-vh per scene keeps the camera unhurried without trapping the visitor. */
export const TRACK_VH = 135 * SCENES.length;

const PHONE_X = 30;
const PHONE_Y = 76;
const PHONE_W = 280;
const PHONE_H = 583;
const PHONE_GAP = 40;
const BOARD_H = 690;
const PHONE_INSET = 10;
const TWO_PHONE_W = PHONE_X * 2 + PHONE_W * 2 + PHONE_GAP;

export interface BoardShot {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
  highlights: readonly string[];
}

export interface StoryBoard extends WorldRect {
  shots: readonly BoardShot[];
}

const shot = (key: string, x: number, highlights: readonly string[]): BoardShot => ({
  key,
  x,
  y: PHONE_Y,
  w: PHONE_W,
  h: PHONE_H,
  highlights,
});

const SECOND_PHONE_X = PHONE_X + PHONE_W + PHONE_GAP;

export const BOARDS = {
  home: {
    x: 0,
    y: 0,
    w: 560,
    h: BOARD_H,
    shots: [shot("home", PHONE_X, ["menuCard", "expiryCard", "poopCard"])],
  },
  expiry: {
    x: 700,
    y: 0,
    w: TWO_PHONE_W,
    h: BOARD_H,
    shots: [
      shot("expiry", PHONE_X, ["firstItem", "medicine"]),
      shot("search", SECOND_PHONE_X, ["searchBar", "result"]),
    ],
  },
  add: {
    x: 1480,
    y: 0,
    w: TWO_PHONE_W,
    h: BOARD_H,
    shots: [
      shot("add", PHONE_X, ["recognize", "shelfLife"]),
      shot("detail", SECOND_PHONE_X, ["expiryStatus", "reminder"]),
    ],
  },
  food: {
    x: 2260,
    y: 0,
    w: TWO_PHONE_W,
    h: BOARD_H,
    shots: [
      shot("foodMenu", PHONE_X, ["upload", "inspiration", "dish"]),
      shot("recipeUpload", SECOND_PHONE_X, ["name", "ingredients"]),
    ],
  },
  cook: {
    x: 2260,
    y: 790,
    w: TWO_PHONE_W,
    h: BOARD_H,
    shots: [
      shot("recipeInspiration", PHONE_X, ["ingredients", "preferences"]),
      shot("order", SECOND_PHONE_X, ["items", "footer"]),
    ],
  },
  wishes: {
    x: 1480,
    y: 790,
    w: TWO_PHONE_W,
    h: BOARD_H,
    shots: [
      shot("wishlist", PHONE_X, ["progress", "first", "second"]),
      shot("fulfilled", SECOND_PHONE_X, ["first", "second"]),
    ],
  },
  together: {
    x: 700,
    y: 790,
    w: TWO_PHONE_W,
    h: BOARD_H,
    shots: [
      shot("buddy", PHONE_X, ["summary", "buddy", "invite"]),
      shot("poop", SECOND_PHONE_X, ["stats", "calendar", "day"]),
    ],
  },
  me: {
    x: 0,
    y: 790,
    w: TWO_PHONE_W,
    h: BOARD_H,
    shots: [
      shot("profile", PHONE_X, ["profile", "stats", "first"]),
      shot("history", SECOND_PHONE_X, ["group", "first"]),
    ],
  },
} as const satisfies Record<string, StoryBoard>;

export type BoardKey = keyof typeof BOARDS;

export const BOARD_KEYS = Object.keys(BOARDS) as BoardKey[];

export const WORLD = bounds(Object.values(BOARDS));

interface FocusBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ScreenShot {
  w: number;
  h: number;
  focus: Record<string, FocusBox>;
}

const SHOT_DATA = shotData as unknown as Record<string, ScreenShot>;

function locateShot(shotKey: string): { board: StoryBoard; phone: BoardShot } {
  for (const board of Object.values(BOARDS)) {
    const phone = board.shots.find((item) => item.key === shotKey);
    if (phone) return { board, phone };
  }
  throw new Error(`unknown shot key: ${shotKey}`);
}

/** Convert one or more measured rectangles inside a screenshot into one world-space close-up. */
export function focusRect(shotKey: string, ...focusKeys: string[]): WorldRect {
  const { board, phone } = locateShot(shotKey);
  const screen = SHOT_DATA[shotKey];
  const boxes = focusKeys.map((key) => screen.focus[key]);
  const left = Math.max(0, Math.min(...boxes.map((box) => box.x)));
  const right = Math.min(screen.w, Math.max(...boxes.map((box) => box.x + box.width)));
  const top = Math.max(0, Math.min(screen.h - 1, Math.min(...boxes.map((box) => box.y))));
  const bottom = Math.max(top + 1, Math.min(screen.h, Math.max(...boxes.map((box) => box.y + box.height))));
  const scale = (phone.w - PHONE_INSET * 2) / screen.w;
  return {
    x: board.x + phone.x + PHONE_INSET + left * scale,
    y: board.y + phone.y + PHONE_INSET + top * scale,
    w: (right - left) * scale,
    h: (bottom - top) * scale,
  };
}

const FINALE = padded(WORLD, 64);
const homeFocus = focusRect("home", "menuCard", "expiryCard", "poopCard");

export const SHOTS: readonly Shot[] = [
  { at: 0, rect: framed(BOARDS.home) },
  { at: beat(0, 0.34), rect: homeFocus },
  { at: beat(0, 0.64), rect: homeFocus },
  { at: beat(0, 0.93), rect: framed(BOARDS.home) },
  { at: beat(0, 0.985), rect: framed(BOARDS.home) },

  { at: beat(1, CAMERA_MOVE), rect: framed(BOARDS.expiry) },
  { at: beat(1, 0.34), rect: focusRect("expiry", "firstItem", "medicine") },
  { at: beat(1, 0.64), rect: focusRect("search", "searchBar", "result") },
  { at: beat(1, 0.93), rect: framed(BOARDS.expiry) },
  { at: beat(1, 0.985), rect: framed(BOARDS.expiry) },

  { at: beat(2, CAMERA_MOVE), rect: framed(BOARDS.add) },
  { at: beat(2, 0.34), rect: focusRect("add", "recognize", "shelfLife") },
  { at: beat(2, 0.64), rect: focusRect("detail", "expiryStatus", "reminder") },
  { at: beat(2, 0.93), rect: framed(BOARDS.add) },
  { at: beat(2, 0.985), rect: framed(BOARDS.add) },

  { at: beat(3, CAMERA_MOVE), rect: framed(BOARDS.food) },
  { at: beat(3, 0.34), rect: focusRect("foodMenu", "upload", "inspiration", "dish") },
  { at: beat(3, 0.64), rect: focusRect("recipeUpload", "name", "ingredients") },
  { at: beat(3, 0.93), rect: framed(BOARDS.food) },
  { at: beat(3, 0.985), rect: framed(BOARDS.food) },

  { at: beat(4, CAMERA_MOVE), rect: framed(BOARDS.cook) },
  { at: beat(4, 0.34), rect: focusRect("recipeInspiration", "ingredients", "preferences") },
  { at: beat(4, 0.64), rect: focusRect("order", "items", "footer") },
  { at: beat(4, 0.93), rect: framed(BOARDS.cook) },
  { at: beat(4, 0.985), rect: framed(BOARDS.cook) },

  { at: beat(5, CAMERA_MOVE), rect: framed(BOARDS.wishes) },
  { at: beat(5, 0.34), rect: focusRect("wishlist", "progress", "first", "second") },
  { at: beat(5, 0.64), rect: focusRect("fulfilled", "first", "second") },
  { at: beat(5, 0.93), rect: framed(BOARDS.wishes) },
  { at: beat(5, 0.985), rect: framed(BOARDS.wishes) },

  { at: beat(6, CAMERA_MOVE), rect: framed(BOARDS.together) },
  { at: beat(6, 0.34), rect: focusRect("buddy", "summary", "buddy", "invite") },
  { at: beat(6, 0.64), rect: focusRect("poop", "stats", "calendar", "day") },
  { at: beat(6, 0.93), rect: framed(BOARDS.together) },
  { at: beat(6, 0.985), rect: framed(BOARDS.together) },

  { at: beat(7, CAMERA_MOVE), rect: framed(BOARDS.me) },
  { at: beat(7, 0.34), rect: focusRect("profile", "profile", "stats", "first") },
  { at: beat(7, 0.64), rect: focusRect("history", "group", "first") },
  { at: beat(7, 0.93), rect: framed(BOARDS.me) },
  { at: beat(7, 0.985), rect: framed(BOARDS.me) },

  { at: beat(8, CAMERA_MOVE), rect: FINALE },
  { at: 1, rect: FINALE },
];
