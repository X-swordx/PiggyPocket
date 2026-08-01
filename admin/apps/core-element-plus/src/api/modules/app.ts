import api from '../index'

/**
 * fantastic-admin 内置 store 期望的字段名是 account / password / avatar，
 * 后端 admin 接口用 username。在此做字段翻译，避免侵入 store。
 */

interface LoginRequest {
  account: string
  password: string
}

interface RawLoginResponse {
  status: number
  error: string
  data: {
    token: string
    username: string
    nickname?: string
    avatar?: string
    role: string
    permissions: string[]
  }
}

interface RawProfileResponse {
  status: number
  error: string
  data: {
    id: number
    username: string
    nickname?: string
    avatar?: string
    role: string
    permissions: string[]
  }
}

const DEFAULT_AVATAR = 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed='

let cachedPermissions: string[] = []

export default {
  // 后端未提供动态路由，路由结构在前端本地 modules 中静态定义
  // 这里保留接口以兼容 fantastic-admin 的调用（返回空数组）
  routeList: async () => {
    return {
      error: '',
      status: 1,
      data: [] as any[],
    }
  },

  // 登录
  login: async (data: LoginRequest) => {
    const res = (await api.post('admin/auth/login', {
      username: data.account,
      password: data.password,
    })) as unknown as RawLoginResponse

    cachedPermissions = res.data.permissions

    return {
      error: res.error,
      status: res.status,
      data: {
        account: res.data.username,
        token: res.data.token,
        avatar: res.data.avatar || DEFAULT_AVATAR + res.data.username,
      },
    }
  },

  // 获取权限
  permission: async () => {
    // 优先使用登录时后端返回的权限，避免多余请求
    if (cachedPermissions.length > 0) {
      const permissions = cachedPermissions
      return {
        error: '',
        status: 1,
        data: { permissions },
      }
    }
    const res = (await api.get('admin/auth/profile')) as unknown as RawProfileResponse
    cachedPermissions = res.data.permissions
    return {
      error: res.error,
      status: res.status,
      data: { permissions: res.data.permissions },
    }
  },

  // 修改密码（M0 未实现后端接口，占位报错）
  passwordEdit: async (_data: {
    password: string
    newPassword: string
  }) => {
    return Promise.reject(new Error('修改密码功能将在后续版本提供'))
  },
}
