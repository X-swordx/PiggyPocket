import type { RouteRecordMainRaw } from '@fantastic-admin/types'

/** 猪猪生活本后台功能模块路由。 */

function Layout() {
  return import('@/layouts/index.vue')
}

function Dashboard() {
  return import('@/views/piggy/Dashboard.vue')
}

function ExpiryFoodList() {
  return import('@/views/piggy/ExpiryFoodList.vue')
}

function WishList() {
  return import('@/views/piggy/WishList.vue')
}

function DishList() {
  return import('@/views/piggy/DishList.vue')
}

function OrderList() {
  return import('@/views/piggy/OrderList.vue')
}

function DiningGroupList() {
  return import('@/views/piggy/DiningGroupList.vue')
}

function UserList() {
  return import('@/views/piggy/UserList.vue')
}

function SystemAdmin() {
  return import('@/views/piggy/SystemAdmin.vue')
}

function SystemLog() {
  return import('@/views/piggy/SystemLog.vue')
}

function SystemRole() {
  return import('@/views/piggy/SystemRole.vue')
}

const dashboard: RouteRecordMainRaw = {
  meta: {
    title: '数据概览',
    icon: 'i-lucide:layout-dashboard',
  },
  children: [
    {
      path: '/dashboard',
      component: Layout,
      redirect: '/dashboard/index',
      name: 'dashboard',
      meta: {
        title: '数据概览',
        icon: 'i-lucide:layout-dashboard',
        auth: 'admin.dashboard:view',
      },
      children: [
        {
          path: 'index',
          name: 'dashboardIndex',
          component: Dashboard,
          meta: {
            title: '数据概览',
            menu: false,
            breadcrumb: false,
            activeMenu: '/dashboard',
          },
        },
      ],
    },
  ],
}

const content: RouteRecordMainRaw = {
  meta: {
    title: '内容管理',
    icon: 'i-lucide:notebook-text',
  },
  children: [
    {
      path: '/expiry-food',
      component: Layout,
      redirect: '/expiry-food/list',
      name: 'expiryFood',
      meta: {
        title: '临期食品',
        icon: 'i-lucide:refrigerator',
        auth: 'admin.expiryFood:view',
      },
      children: [
        {
          path: 'list',
          name: 'expiryFoodList',
          component: ExpiryFoodList,
          meta: {
            title: '临期食品',
            menu: false,
            breadcrumb: false,
            activeMenu: '/expiry-food',
          },
        },
      ],
    },
    {
      path: '/wish',
      component: Layout,
      redirect: '/wish/list',
      name: 'wish',
      meta: {
        title: '心愿清单',
        icon: 'i-lucide:sparkles',
        auth: 'admin.wish:view',
      },
      children: [
        {
          path: 'list',
          name: 'wishList',
          component: WishList,
          meta: {
            title: '心愿清单',
            menu: false,
            breadcrumb: false,
            activeMenu: '/wish',
          },
        },
      ],
    },
    {
      path: '/dish',
      component: Layout,
      redirect: '/dish/list',
      name: 'dish',
      meta: {
        title: '菜品库',
        icon: 'i-lucide:utensils',
        auth: 'admin.dish:view',
      },
      children: [
        {
          path: 'list',
          name: 'dishList',
          component: DishList,
          meta: {
            title: '菜品库',
            menu: false,
            breadcrumb: false,
            activeMenu: '/dish',
          },
        },
      ],
    },
  ],
}

const transaction: RouteRecordMainRaw = {
  meta: {
    title: '交易管理',
    icon: 'i-lucide:receipt-text',
  },
  children: [
    {
      path: '/order',
      component: Layout,
      redirect: '/order/list',
      name: 'order',
      meta: {
        title: '订单管理',
        icon: 'i-lucide:shopping-cart',
        auth: 'admin.order:view',
      },
      children: [
        {
          path: 'list',
          name: 'orderList',
          component: OrderList,
          meta: {
            title: '订单管理',
            menu: false,
            breadcrumb: false,
            activeMenu: '/order',
          },
        },
      ],
    },
    {
      path: '/dining-group',
      component: Layout,
      redirect: '/dining-group/list',
      name: 'diningGroup',
      meta: {
        title: '饭搭子分组',
        icon: 'i-lucide:users',
        auth: 'admin.diningGroup:view',
      },
      children: [
        {
          path: 'list',
          name: 'diningGroupList',
          component: DiningGroupList,
          meta: {
            title: '饭搭子分组',
            menu: false,
            breadcrumb: false,
            activeMenu: '/dining-group',
          },
        },
      ],
    },
  ],
}

const userManage: RouteRecordMainRaw = {
  meta: {
    title: '用户管理',
    icon: 'i-lucide:user',
  },
  children: [
    {
      path: '/user',
      component: Layout,
      redirect: '/user/list',
      name: 'user',
      meta: {
        title: '用户管理',
        icon: 'i-lucide:user',
        auth: 'admin.user:view',
      },
      children: [
        {
          path: 'list',
          name: 'userList',
          component: UserList,
          meta: {
            title: '用户管理',
            menu: false,
            breadcrumb: false,
            activeMenu: '/user',
          },
        },
      ],
    },
  ],
}

const system: RouteRecordMainRaw = {
  meta: {
    title: '系统管理',
    icon: 'i-lucide:settings',
  },
  children: [
    {
      path: '/system',
      component: Layout,
      redirect: '/system/admin',
      name: 'system',
      meta: {
        title: '系统管理',
        icon: 'i-lucide:settings',
        auth: '*',
      },
      children: [
        {
          path: 'admin',
          name: 'systemAdmin',
          component: SystemAdmin,
          meta: {
            title: '管理员账号',
            auth: '*',
          },
        },
        {
          path: 'role',
          name: 'systemRole',
          component: SystemRole,
          meta: {
            title: '角色权限',
            auth: '*',
          },
        },
        {
          path: 'log',
          name: 'systemLog',
          component: SystemLog,
          meta: {
            title: '操作日志',
            auth: '*',
          },
        },
      ],
    },
  ],
}

const piggyRoutes: RouteRecordMainRaw[] = [
  dashboard,
  content,
  transaction,
  userManage,
  system,
]

export default piggyRoutes
