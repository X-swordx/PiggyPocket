/// <reference types="vite/client" />
interface ImportMetaEnv {
  // Auto generate by env-parse
  /**
   * 网络请求地址，应用于 axios 的 baseURL
   */
  readonly VITE_APP_API_BASEURL: string
  /**
   * 调试工具，可设置 eruda 或 vconsole
   */
  readonly VITE_APP_DEBUG_TOOL: string
  /**
   * 应用配置面板
   */
  readonly VITE_APP_SETTING: boolean
  /**
   * localStorage/sessionStorage 前缀
   */
  readonly VITE_APP_STORAGE_PREFIX: string
  /**
   * 网站标题
   */
  readonly VITE_APP_TITLE: string
  /**
   * 启用代理（true 时前端通过 /proxy 转发到 VITE_APP_API_BASEURL）
   */
  readonly VITE_ENABLE_PROXY: boolean
  /**
   * 启用 turbo console
   */
  readonly VITE_ENABLE_TURBO_CONSOLE: boolean
  /**
   * 启用 Vue 开发工具
   */
  readonly VITE_ENABLE_VUE_DEVTOOLS: boolean
  /**
   * 启动编辑器
   */
  readonly VITE_LAUNCH_EDITOR: string
}
