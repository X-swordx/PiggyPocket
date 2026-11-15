// Every word on the page outside the story lives here. All claims below are demonstrated
// by the real screenshots in public/shots; the CTA copies the mini-program name and tells
// the visitor where to paste it in WeChat.

export const SITE = {
  name: "猪猪生活本",
  nav: [
    { label: "全部功能", href: "#features" },
    { label: "怎么用", href: "#story" },
    { label: "去微信搜索", href: "#cta" },
  ],
  hero: {
    eyebrow: "给一起生活的家人 · 一个微信小程序",
    title: ["家里什么快过期", "猪猪都替你记着"],
    promise: "到期、吃饭、心愿、搭伙、如厕，每天的小事都收在一个本子里。",
    primary: { label: "复制名称，去微信搜索", href: "#cta" },
    secondary: { label: "看看六个模块", href: "#features" },
    image: "shots/home.png",
    imageAlt: "猪猪生活本首页：美食菜单、到期管家和生活入口都在一个本子里",
    pills: ["到期管家", "美食菜单", "心愿清单", "搭伙管理", "拉粑粑么", "我的"],
  },
  modules: {
    eyebrow: "全部功能 · 六个模块",
    title: ["不止到期管家", "每天的小事都有地方放"],
    intro: "在一个微信小程序里，把到期、吃饭、心愿、搭伙和日常记录一起管起来。下面写的每一条，都在真实界面里。",
    items: [
      {
        index: "01",
        name: "到期管家",
        tagline: "食品药品化妆品，按到期先后排好。",
        image: "shots/expiry.png",
        imageAlt: "到期管家按今天、2 天后、5 天后列出鲜牛奶、护手霜和布洛芬",
        features: [
          "按今天 / 2 天后 / 5 天后排序，先处理谁一眼看清",
          "拍名称面和日期面，自动识别名称与保质期",
          "生产日期 + 保质期，自动算到期日",
          "大白话搜索「感冒药」，也能找到布洛芬",
          "到期前微信提醒，详情记着存放位置和备注",
        ],
      },
      {
        index: "02",
        name: "美食菜单",
        tagline: "从上传菜谱到今日菜单，再到下单。",
        image: "shots/foodMenu.png",
        imageAlt: "美食菜单页有上传菜谱、灵感菜谱、今日菜单分类和一键加菜",
        features: [
          "上传菜谱：封面、名称、AI 搜用料步骤、比例调整",
          "分类和分享到搭伙，草稿或发布",
          "今日菜单按分类筛选，一键加菜",
          "灵感菜谱：选手头食材、人数、辣度、口味、忌口和备注",
          "订单填做菜日期、份数和备注，确认下单",
        ],
      },
      {
        index: "03",
        name: "心愿清单",
        tagline: "想做的事写下来，实现一件勾一件。",
        image: "shots/wishlist.png",
        imageAlt: "心愿清单显示完成进度、分类筛选和待实现心愿",
        features: [
          "按分类筛选心愿，进度条看完成了多少",
          "勾选即标记实现，也能随时添加新心愿",
          "实现心愿页回看每一件做成的事",
        ],
      },
      {
        index: "04",
        name: "搭伙管理",
        tagline: "两个人一起过，菜单和订单也一起。",
        image: "shots/buddy.png",
        imageAlt: "搭伙管理显示伙伴人数、成员列表、解除关联和邀请好友",
        features: [
          "看伙伴数、成员列表和邀请好友",
          "共享菜谱、菜单和订单",
          "解除关联，各自的生活记录分开",
        ],
      },
      {
        index: "05",
        name: "拉粑粑么",
        tagline: "不尴尬地记一下，身体的小信号有迹可循。",
        image: "shots/poop.png",
        imageAlt: "拉粑粑么显示今日和本月次数、月历记录与当日详情",
        features: [
          "今日次数、本月次数、记录天数一眼看清",
          "月历色点回看，哪天记过一目了然",
          "布里斯托 1–7 型、时间和备注都能记",
          "AI 根据记录给健康建议",
          "每晚 21:00 提醒订阅额度",
        ],
      },
      {
        index: "06",
        name: "我的 · 历史菜单",
        tagline: "订单、历史菜单和评分，都收在这里。",
        image: "shots/profile.png",
        imageAlt: "我的页面显示微信资料、搭伙和历史菜单统计、猪猪订单",
        features: [
          "微信头像和昵称，主题色自己换",
          "搭伙、历史菜单、实现心愿的统计",
          "猪猪订单按做菜日期分组",
          "历史菜单回看和评分，记住哪道菜受欢迎",
        ],
      },
    ],
  },
  story: {
    outlineTitle: "猪猪生活本怎么把到期、吃饭、心愿、搭伙和日常记录，从记下到用起来",
  },
  cta: {
    title: ["到期、吃饭、心愿和记录", "都交给猪猪生活本"],
    button: { label: "复制「猪猪生活本」", href: "" },
    facts: [
      "到期管家：拍照录入，到期前微信提醒",
      "美食菜单：菜谱、灵感菜谱和订单",
      "心愿、搭伙、日常记录，也在这个本子里",
    ],
  },
  footer: {
    note: "猪猪生活本 · 到期、吃饭、心愿、搭伙和日常记录，一起记。",
    links: [
      { label: "回到开头", href: "#" },
      { label: "看全部功能", href: "#features" },
    ],
  },
} as const;
