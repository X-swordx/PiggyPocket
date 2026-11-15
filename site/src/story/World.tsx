// The stage, rendered once at world scale. Eight boards, one per product module, carry
// fifteen real phone captures. The camera and the highlight rectangles below both use
// measured screenshot data.

import { Fragment } from "react";
import { Arrow, Board, Callout, Highlight, Screen } from "../engine/parts.tsx";
import { asset } from "../engine/asset.ts";
import { BOARDS, BOARD_KEYS, TIMELINE, WORLD, focusRect, type BoardKey, type StoryBoard } from "./script.ts";
import screens from "./shots.json";

const { beat } = TIMELINE;

interface BoardMeta {
  index: string;
  title: string;
  callout: string;
  alts: Record<string, string>;
}

const META: Record<BoardKey, BoardMeta> = {
  home: {
    index: "01",
    title: "首页 · 六个入口",
    callout: "六个入口都在首页",
    alts: {
      home: "猪猪生活本首页，美食菜单、到期管家和下拉可见的更多生活入口",
    },
  },
  expiry: {
    index: "02",
    title: "到期管家 · 按天数排",
    callout: "排序 · 大白话搜",
    alts: {
      expiry: "到期管家按今天、2 天后、5 天后列出鲜牛奶、护手霜和布洛芬",
      search: "在到期管家搜索感冒药，命中布洛芬缓释胶囊",
    },
  },
  add: {
    index: "03",
    title: "拍照录入 · 自动算日期",
    callout: "拍两张 · 自动算",
    alts: {
      add: "编辑物品页拍照识别，已填好名称、生产日期和 12 个月保质期",
      detail: "物品详情页显示 5 天后到期、提前 7 天提醒和药箱收纳位置",
    },
  },
  food: {
    index: "04",
    title: "美食菜单 · 菜谱与今日菜单",
    callout: "菜谱 · 今日菜单",
    alts: {
      foodMenu: "美食菜单页有上传菜谱、灵感菜谱、今日菜单分类和一键加菜",
      recipeUpload: "上传菜谱页填写封面、名称、AI 搜用料和烹饪步骤",
    },
  },
  cook: {
    index: "05",
    title: "灵感菜谱 · 确认下单",
    callout: "推荐 · 一键下单",
    alts: {
      recipeInspiration: "灵感菜谱页选择食材、人数、辣度、口味和忌口",
      order: "订单页选择做菜日期、份数和备注并确认下单",
    },
  },
  wishes: {
    index: "06",
    title: "心愿清单 · 实现心愿",
    callout: "心愿 · 一件件实现",
    alts: {
      wishlist: "心愿清单显示完成进度、分类筛选和待实现心愿",
      fulfilled: "实现心愿页回看已经完成的旅行、技能等心愿",
    },
  },
  together: {
    index: "07",
    title: "搭伙管理 · 拉粑粑么",
    callout: "共享 · 身体记录",
    alts: {
      buddy: "搭伙管理显示伙伴人数、成员列表、解除关联和邀请好友",
      poop: "拉粑粑么显示今日和本月次数、月历记录与当日详情",
    },
  },
  me: {
    index: "08",
    title: "我的 · 历史菜单",
    callout: "历史 · 订单 · 评分",
    alts: {
      profile: "我的页面显示微信资料、搭伙和历史菜单统计、猪猪订单",
      history: "历史菜单页按日期分组回看做过的菜和评分",
    },
  },
};

const SHOT_INFO = screens as unknown as Record<string, { src: string }>;

function localFocus(board: StoryBoard, shotKey: string, name: string) {
  const world = focusRect(shotKey, name);
  return { x: world.x - board.x, y: world.y - board.y, w: world.w, h: world.h };
}

const ROUTE = [
  { scene: 1, from: [560, 345] as const, to: [700, 345] as const },
  { scene: 2, from: [1360, 345] as const, to: [1480, 345] as const },
  { scene: 3, from: [2140, 345] as const, to: [2260, 345] as const },
  { scene: 4, from: [2590, 690] as const, to: [2590, 790] as const },
  { scene: 5, from: [2260, 1140] as const, to: [2140, 1140] as const },
  { scene: 6, from: [1480, 1140] as const, to: [1360, 1140] as const },
  { scene: 7, from: [700, 1140] as const, to: [660, 1140] as const },
];

export function World() {
  return (
    <div className="absolute top-0 left-0" style={{ width: WORLD.x + WORLD.w, height: WORLD.y + WORLD.h }}>
      {BOARD_KEYS.map((key, scene) => {
        const board = BOARDS[key];
        const meta = META[key];
        return (
          <Board
            key={key}
            rect={board}
            at={beat(scene, scene === 0 ? 0.005 : 0.06)}
            index={meta.index}
            title={meta.title}
          >
            {board.shots.map((phone, phoneIndex) => (
              <Fragment key={phone.key}>
                <Screen
                  at={beat(scene, scene === 0 && phoneIndex === 0 ? 0.025 : 0.075 + phoneIndex * 0.025)}
                  x={phone.x}
                  y={phone.y}
                  w={phone.w}
                  h={phone.h}
                  src={asset(SHOT_INFO[phone.key].src)}
                  alt={meta.alts[phone.key]}
                  device="phone"
                />
                {phone.highlights.map((name) => (
                  <Highlight key={`${phone.key}-${name}`} at={beat(scene, 0.28)} {...localFocus(board, phone.key, name)} />
                ))}
              </Fragment>
            ))}
            <Callout at={beat(scene, 0.36)} x={board.w - 260} y={-66} w={240}>
              {meta.callout}
            </Callout>
          </Board>
        );
      })}
      {ROUTE.map((arrow) => (
        <Arrow key={arrow.scene} at={beat(arrow.scene, 0.015)} from={arrow.from} to={arrow.to} />
      ))}
    </div>
  );
}
