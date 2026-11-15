// Research capture for the PiggyPocket H5 build. The product is a WeChat mini
// program with no public web entry, so this script boots the existing H5 client,
// signs in as the local `dev` user, opens each real screen, and records both the
// phone screenshot and the rects of the UI elements the camera should frame.

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BASE = process.env.H5_BASE ?? "http://127.0.0.1:5174";
const VIEWPORT = { width: 390, height: 844 };

const screens = {
  home: {
    hash: "#/",
    focus: {
      expiryCard: [".card", 1],
      menuCard: [".card", 0],
      poopCard: [".card", 2],
      wishCard: [".card", 3],
    },
  },
  expiry: {
    hash: "#/pages/expiry/index",
    prepare: async (page) => {
      await page.locator(".tab").nth(1).click();
      await page.waitForTimeout(500);
    },
    focus: {
      reminder: [".subscribe-tip"],
      firstItem: [".item-card", 0],
      medicine: [".item-card", 2],
    },
  },
  detail: {
    hash: "#/pages/dish-detail/index?id=107&mode=expiry",
    focus: {
      expiryStatus: [".expiry-card"],
      reminder: [".mini-card", 0],
    },
  },
  add: {
    hash: "#/pages/add-food/index?id=107",
    focus: {
      recognize: [".recognize-row"],
      name: [".form-item", 0],
      shelfLife: [".form-item", 3],
    },
  },
  search: {
    hash: "#/pages/expiry/index",
    prepare: async (page) => {
      await page.locator(".tab-search-btn").click();
      await page.locator("input").fill("感冒药");
      await page.locator("input").press("Enter");
      await page.waitForTimeout(600);
    },
    focus: {
      searchBar: [".search-bar"],
      result: [".item-card", 0],
    },
  },
  notification: {
    hash: "#/",
    prepare: async (page) => {
      await page.locator(".icon-btn").click();
      await page.waitForTimeout(500);
    },
    focus: {
      notice: [".notification-item", 1],
    },
  },
  foodMenu: {
    hash: "#/pages/food-menu/index",
    focus: {
      upload: [".upload-card"],
      inspiration: [".inspire-card"],
      menu: [".menu-section"],
      dish: [".dish-card", 0],
    },
  },
  recipeUpload: {
    hash: "#/pages/recipe-upload/index",
    focus: {
      cover: [".upload-section"],
      name: [".input-section"],
      ingredients: [".ingredients-section"],
      steps: [".steps-section"],
    },
  },
  recipeInspiration: {
    hash: "#/pages/recipe-inspiration/index",
    focus: {
      hint: [".hint-card"],
      ingredients: [".section", 0],
      people: [".section", 1],
      preferences: [".section", 3],
    },
  },
  order: {
    hash: "#/pages/order/index",
    focus: {
      cookDate: [".cook-date"],
      items: [".order-list"],
      first: [".order-item", 0],
      footer: [".footer"],
    },
  },
  wishlist: {
    hash: "#/pages/wishlist/index",
    focus: {
      progress: [".progress-card"],
      filters: [".filters"],
      first: [".item", 0],
      second: [".item", 1],
    },
  },
  fulfilled: {
    hash: "#/pages/fulfilled-wishes/index",
    focus: {
      first: [".item", 0],
      second: [".item", 1],
    },
  },
  buddy: {
    hash: "#/pages/foodie-buddy/index",
    focus: {
      summary: [".summary-card"],
      buddy: [".buddy-item", 0],
      invite: [".invite-card"],
    },
  },
  poop: {
    hash: "#/pages/poop/index",
    focus: {
      stats: [".stat-row"],
      calendar: [".calendar"],
      day: [".day-card"],
      advice: [".advice-card"],
      reminder: [".reminder-card"],
    },
  },
  poopAdd: {
    hash: "#/pages/poop/add",
    focus: {
      types: [".type-grid"],
      time: [".section-card", 1],
      notes: [".section-card", 2],
      save: [".save-btn"],
    },
  },
  profile: {
    hash: "#/pages/profile/index",
    focus: {
      profile: [".profile-card"],
      stats: [".stats-grid"],
      orders: [".orders-section"],
      first: [".order-card", 0],
    },
  },
  history: {
    hash: "#/pages/history-menu/index",
    focus: {
      group: [".date-group", 0],
      first: [".order-card", 0],
    },
  },
};

async function main() {
  await mkdir(join(ROOT, "public/shots"), { recursive: true });
  await mkdir(join(ROOT, "research"), { recursive: true });
  let currentUser = { id: 1, openid: "dev" };
  let selectedDishes = [];
  try {
    const userResponse = await fetch("http://127.0.0.1:3000/api/foodie-buddy/users/1");
    const userData = await userResponse.json();
    if (userData.data) currentUser = userData.data;
    const response = await fetch("http://127.0.0.1:3000/api/foodie-buddy/dishes?userId=1&page=1&pageSize=100");
    const data = await response.json();
    selectedDishes = (data.data?.list ?? []).slice(0, 2).map((dish) => ({
      id: dish.id,
      name: dish.name,
      calories: dish.calories ? String(dish.calories) : "--",
      time: dish.cookingTime || "未知",
      bgColor: dish.bgColor || "#f0b7a4",
      image: dish.image,
    }));
  } catch {
    selectedDishes = [];
  }
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2, isMobile: true });
  await page.addInitScript(({ user, dishes }) => {
    localStorage.setItem(
      "foodie_current_user",
      JSON.stringify({ type: "object", data: user }),
    );
    localStorage.setItem(
      "foodie_selected_dishes",
      JSON.stringify({ type: "object", data: dishes }),
    );
  }, { user: currentUser, dishes: selectedDishes });

  const shots = {};
  for (const [name, screen] of Object.entries(screens)) {
    await page.goto(`${BASE}/${screen.hash}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    if (screen.prepare) await screen.prepare(page);
    await page.screenshot({
      path: join(ROOT, `public/shots/${name}.png`),
      animations: "disabled",
    });
    const focus = {};
    for (const [key, [selector, index = 0]] of Object.entries(screen.focus)) {
      const box = await page.locator(selector).nth(index).boundingBox();
      if (box) focus[key] = box;
    }
    shots[name] = {
      src: `shots/${name}.png`,
      url: page.url(),
      w: VIEWPORT.width,
      h: VIEWPORT.height,
      focus,
    };
    console.log(`✓ ${name} ${Object.keys(focus).join(", ")}`);
  }

  await browser.close();
  await writeFile(join(ROOT, "src/story/shots.json"), `${JSON.stringify(shots, null, 2)}\n`);
  await writeFile(
    join(ROOT, "research/brand.json"),
    `${JSON.stringify(
      {
        title: "猪猪生活本",
        source: "mobile/src/utils/theme.ts (樱花粉), mobile/src/pages, mobile/src/static/logo.png",
        colors: {
          background: "#F8F5F6",
          surface: "#FFFFFF",
          text: "#1F1A1B",
          muted: "#777777",
          primary: "#F08DA0",
          primarySoft: "#FFC2CC",
          primaryLight: "#FFE6EA",
          warn: "#EA580C",
          danger: "#DC2626",
        },
        fonts: {
          body: '"PingFang SC", "Microsoft YaHei", sans-serif',
          display: '"PingFang SC", "Microsoft YaHei", sans-serif',
        },
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
