# Bug 复现契约：物品详情页不显示图片

复现步骤：
1. stage 环境打开到期管家列表，确认列表卡片能看到物品图片。
2. 点任意带图物品进入「物品详情」页。

当前现象：详情页顶部只有背景色和分类标签，不显示物品图片。

预期结果：详情页顶部显示该物品的图片（列表卡片同一张图）。

## 复现级别

本次选择：L3，理由：接口已确认返回带签名的 `imageUrl`，问题在详情页渲染层，需要真实页面才能判定。

接口证据（L2，`GET /api/expiry-items?userId=1`）：

```json
"imageUrl": "https://piggy-pocket.oss-cn-guangzhou.aliyuncs.com/items/1793538180938_9vg957uh.jpg?OSSAccessKeyId=...&Expires=...&Signature=..."
```

## 根因

`mobile/src/pages/dish-detail/index.vue` 的物品详情模式模板里，`hero-image` 只有背景色和分类标签，没有 `<image>`；`loadExpiryItem` 也没有把接口返回的 `item.imageUrl` 映射进 `food`。列表页 `mobile/src/pages/expiry/index.vue:65` 有图片，详情页遗漏。

## 回归测试

- 测试文件/用例名：无
- 修复前：无自动化用例可跑
- 修复后：同一手段复验
- 说明：`mobile` 目前没有测试脚本和测试依赖；这是纯模板渲染遗漏，用真实页面复验。

## 同一手段复验

- 修复前证据：进入 `pages/dish-detail/index?id=1&mode=expiry`，顶部无图片。
- 修复后证据：同一物品详情页顶部显示图片，与列表卡片一致。

## 影响面

只影响物品详情页顶部展示；菜品详情模式不改。需要回归物品详情页其他字段（到期状态、提醒、位置、类别、备注）和菜品详情页图片。
