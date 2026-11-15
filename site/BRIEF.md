# Brief：猪猪生活本 官网

> 由 Agent 在研究完产品之后自己填写。研究材料：`research/brand.json`、`public/shots/`、仓库 README、真实 H5 页面与本地开发数据。

## 1. 产品

- **产品名**：猪猪生活本
- **一句话是什么**：收好日常生活小事的微信小程序
- **给谁**：和伴侣、家人一起生活，想把到期、吃饭、心愿和日常记录放在一处的人
- **一句话承诺**：家里什么快过期，猪猪都替你记着。
- **访客看完要做的一件事**：复制「猪猪生活本」，打开微信搜索这个小程序
- **资料来源**：`D:\piggy-pocket`（mobile H5 + 本地 NestJS + 本地开发用户 `id=1`）

## 2. 品牌

| token | 值 | 来源 |
| --- | --- | --- |
| `--color-bg` | `#F8F5F6` | 产品樱花粉主题背景 |
| `--color-ink` | `#1F1A1B` | 小程序正文 |
| `--color-primary` | `#C94F68` | 深一档的樱花粉，用于按钮、链接和高亮 |
| `--color-primary-soft` | `#FFC2CC` | 小程序按钮与图标主色 |
| `--color-surface` | `#FFFFFF` | 小程序卡片 |
| `--color-warn` | `#EA580C` | 即将到期 |
| `--color-danger` | `#DC2626` | 已过期 |
| `--font-display` | `"PingFang SC", "Microsoft YaHei", sans-serif` | 小程序系统字体 |

> 品牌标识使用产品自己的 `mobile/src/static/logo.png` 小猪头像。参考样本只学讲法，不借配色或版式。

## 3. 参考样本

- 参照：CanvasAgents 官网的一镜到底讲法
- 学它的：滚动驱动镜头、两行字幕、真实界面推近、末幕拉远看全貌
- 不学它的：画布/点阵、深色技术感、Agent 面板、样本品牌色

## 4. 六个模块

| 模块 | 真实功能 |
| --- | --- |
| 到期管家 | 按今天 / 2 天后 / 5 天后排序；拍名称面和日期面；生产日期 + 保质期自动算到期日；大白话搜索「感冒药」；提前 N 天微信提醒；详情记存放位置和备注 |
| 美食菜单 | 上传菜谱（封面、名称、AI 搜用料步骤、比例调整、分类、分享搭伙、草稿/发布）；今日菜单分类筛选与一键加菜；灵感菜谱按食材、人数、辣度、口味、忌口和备注推荐；订单填做菜日期、份数、备注并确认下单 |
| 心愿清单 | 分类筛选、进度条、勾选实现、添加心愿；实现心愿页回看 |
| 搭伙管理 | 伙伴数与成员列表、共享菜谱/菜单/订单、邀请好友、解除关联 |
| 拉粑粑么 | 今日/本月次数与记录天数、月历色点回看、布里斯托 1–7 型、时间与备注、AI 健康建议、每晚 21:00 提醒订阅额度 |
| 我的 · 历史菜单 | 微信资料、搭伙/历史菜单/实现心愿统计、猪猪订单按做菜日期分组、历史菜单回看与评分、主题色设置 |

## 5. 场景表

| # | key | 字幕标题（≤30 字） | 痛点 hook（≤40 字） | 真实界面 | 推近 / 标注什么 |
| --- | --- | --- | --- | --- | --- |
| 01 | home | 生活里的小事，都收在一个本子 | 到期、吃饭、心愿、搭伙，一样不落 | `home` | 首页的六个模块入口 |
| 02 | expiry | 到期先看谁，搜东西用大白话 | 冰箱药箱里，谁先过期不用翻包装 | `expiry` + `search` | 到期排序、大白话搜索 |
| 03 | add | 拍两张照片，日期和提醒自己填 | 手抄生产日期和保质期，最容易抄错 | `add` + `detail` | 拍照识别、到期状态和提前提醒 |
| 04 | food | 菜谱、今日菜单，都在美食菜单里 | 想吃的菜，总是临时想不起来 | `foodMenu` + `recipeUpload` | 上传菜谱、灵感入口、今日菜单 |
| 05 | cook | 说想吃什么，猪猪帮你配一桌 | 买菜前不知道做什么，容易剩一堆 | `recipeInspiration` + `order` | 食材与口味选择、订单确认 |
| 06 | wishes | 心愿写下来，实现一件勾一件 | 想做的事，忙起来就忘了 | `wishlist` + `fulfilled` | 进度、待实现与已实现心愿 |
| 07 | together | 搭伙与记录，两个人一起用 | 菜单各记各的，身体状态也没人管 | `buddy` + `poop` | 成员与共享、月历与当日记录 |
| 08 | me | 订单、历史菜单和评分，都在我的 | 做过的菜、吃过的好不好，全散在聊天里 | `profile` + `history` | 我的统计、订单、历史菜单评分 |
| 09 | finale | 从一件小事，到每天的生活 | 六个模块，一个本子，一起过日子 | 全部 | 镜头拉远看完整路径 |

## 6. 验收标准

| 编号 | 标准 | 验证方式 |
| --- | --- | --- |
| AC-01 | 首屏 5 秒内说清是什么、给谁、点哪里；首屏看到产品真实界面 | 人工 + `desktop-00-hero.png` |
| AC-02 | 滚动依次讲完九幕，字幕与画面一致 | `pnpm verify` |
| AC-03 | 390px 宽度下无横向滚动，字幕不截断 | `pnpm verify` + 看图 |
| AC-04 | 读屏器 / 搜索引擎能读到每一幕的文字 | `pnpm verify` |
| AC-05 | 无控制台报错；所有链接可用 | `pnpm verify` + 人工点击 |
| AC-06 | 开启「减少动态效果」时，每一幕都以静态形式可见 | `pnpm verify` |
| AC-07 | 配色、字体、标识来自产品自己；和参考样本放在一起不像翻版 | 人工 |
| AC-08 | 所有手机截图来自真实 H5 页面与本地开发数据，不用手绘界面冒充 | 对照 `scripts/capture-product.mjs` |
| AC-09 | 高亮框与 `shots.json` 量出的真实元素位置对齐 | 逐幕看图 |
| AC-10 | 收尾按钮真的复制「猪猪生活本」，并明确提示去微信搜索；失败时给出可手动复制的名称 | `pnpm verify` + 人工点击 |
| AC-11 | 六个模块的功能都写出来，并且每一模块在故事线里出现 | `pnpm verify` 检查 6 张模块卡 + 人工逐幕看图 |

## 7. 上线与恢复

- **线上地址**：<https://admin.piggy-pocket.xyz/site/>
- **国内网络直连**：部署在阿里云广州生产服务器 `8.138.163.42`，由现有 NPM 的 HTTPS 证书提供入口；不经过 Cloudflare，不需要 VPN。
- **当前 release**：`20261115-1210-site`，产物在 `/home/admin/PiggyPocket/site-releases/20261115-1210-site/dist`，`site-current` 指向它。
- **发布方式**：`SITE_BASE=/site/ pnpm build`，产物上传到 `/home/admin/PiggyPocket/site-releases/<release>/dist`，再把 `/home/admin/PiggyPocket/site-current` 指向该 release。
- **挂载方式**：`deploy/cloud/docker-compose.yml` 的 `admin` 服务只读挂载 `site-current` 到容器内 `/usr/share/nginx/html/site`。
- **回滚**：把 `site-current` 指回上一版 `site-releases/<release>/dist`，无需重建镜像；NPM 证书和 API/后台根路径不变。
- **原始配置备份**：服务器上 `/home/admin/PiggyPocket/deploy/cloud/docker-compose.yml.bak-20261115-1201`。
- 公网小程序链接：暂无；页面不伪造外部链接，只引导到微信内搜索
- 上线后抽检的环境：微信内置浏览器、iOS Safari、安卓 Chrome、小屏手机、减少动态效果

## 8. 线上验收证据

- `pnpm test`：8 项时间轴、字幕长度、镜头与对话面板约束全部通过。
- `pnpm build`：TypeScript 检查与生产构建通过。
- `VERIFY_URL=https://admin.piggy-pocket.xyz/site/ pnpm verify`：线上桌面与 390px 手机逐幕截图 9/9 匹配；功能目录 6/6 张模块卡；横向溢出 0；控制台错误 0；减少动态效果静态场景 9/9；剪贴板实测「猪猪生活本」。
- 首屏证据：`verify-output/desktop-00-hero.png`、`verify-output/phone-00-hero.png`。
- 功能目录证据：`verify-output/desktop-00-features.png`、`verify-output/phone-00-features.png`。
- 分幕证据：`verify-output/desktop-01-home.png` 至 `desktop-09-finale.png`，以及对应 `phone-*.png`。
- 收尾与复制证据：`verify-output/desktop-10-cta.png`、`desktop-11-cta-copied.png`、`phone-10-cta.png`、`phone-11-cta-copied.png`。
- 减少动态效果证据：`verify-output/reduced-motion.png`。
- 自动报告：`verify-output/report.json`（`failures` 为空）。
