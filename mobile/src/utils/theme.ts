import { reactive } from 'vue'

export interface ThemeColors {
  primary: string
  primaryRgb: string
  primaryLight: string
  primaryLighter: string
  primaryLightest: string
  primaryDark: string
  gradientEnd: string
  bg: string
  bgCard: string
}

export interface Theme {
  key: string
  name: string
  colors: ThemeColors
}

const THEME_STORAGE_KEY = 'piggy_theme_key'

export const themes: Theme[] = [
  {
    key: 'pink',
    name: '樱花粉',
    colors: {
      primary: '#ffc2cc',
      primaryRgb: '255, 194, 204',
      primaryLight: '#ffe6ea',
      primaryLighter: '#fff0f2',
      primaryLightest: '#fff7f8',
      primaryDark: '#f08da0',
      gradientEnd: '#f8a5b4',
      bg: '#F8F5F6',
      bgCard: '#F8F5F6'
    }
  },
  {
    key: 'blue',
    name: '天空蓝',
    colors: {
      primary: '#6ecbf5',
      primaryRgb: '110, 203, 245',
      primaryLight: '#e0f5ff',
      primaryLighter: '#f0fbff',
      primaryLightest: '#f7fdff',
      primaryDark: '#3ba5d9',
      gradientEnd: '#9fdbf7',
      bg: '#f0f9ff',
      bgCard: '#f0f9ff'
    }
  },
  {
    key: 'green',
    name: '薄荷绿',
    colors: {
      primary: '#6ee7b7',
      primaryRgb: '110, 231, 183',
      primaryLight: '#e0fced',
      primaryLighter: '#f0fef5',
      primaryLightest: '#f7fff9',
      primaryDark: '#34d399',
      gradientEnd: '#9cf5d3',
      bg: '#f0fdf4',
      bgCard: '#f0fdf4'
    }
  },
  {
    key: 'orange',
    name: '暖阳橙',
    colors: {
      primary: '#fdba74',
      primaryRgb: '253, 186, 116',
      primaryLight: '#ffedd5',
      primaryLighter: '#fff7ed',
      primaryLightest: '#fffbf7',
      primaryDark: '#f97316',
      gradientEnd: '#fed7aa',
      bg: '#fff7ed',
      bgCard: '#fff7ed'
    }
  }
]

const themeMap = new Map(themes.map((t) => [t.key, t]))

function varsFromTheme(theme: Theme): Record<string, string> {
  const c = theme.colors
  return {
    '--theme-primary': c.primary,
    '--theme-primary-rgb': c.primaryRgb,
    '--theme-primary-light': c.primaryLight,
    '--theme-primary-lighter': c.primaryLighter,
    '--theme-primary-lightest': c.primaryLightest,
    '--theme-primary-dark': c.primaryDark,
    '--theme-gradient-end': c.gradientEnd,
    '--theme-bg': c.bg,
    '--theme-bg-card': c.bgCard
  }
}

export const themeStyle = reactive<Record<string, string>>(varsFromTheme(themes[0]))

export function getSavedTheme(): string {
  try {
    const key = uni.getStorageSync(THEME_STORAGE_KEY) as string
    if (key && themeMap.has(key)) return key
  } catch {
    // ignore storage errors
  }
  return themes[0].key
}

export function saveTheme(key: string) {
  try {
    uni.setStorageSync(THEME_STORAGE_KEY, key)
  } catch {
    // ignore storage errors
  }
}

export function applyTheme(key: string) {
  const theme = themeMap.get(key)
  if (!theme) return

  const vars = varsFromTheme(theme)
  Object.keys(vars).forEach((k) => {
    themeStyle[k] = vars[k]
  })

  // H5: also set on documentElement so non-page roots can access
  // #ifdef H5
  if (typeof document !== 'undefined') {
    Object.keys(vars).forEach((k) => {
      document.documentElement.style.setProperty(k, vars[k])
    })
  }
  // #endif
}

export function getThemeList(): Theme[] {
  return themes
}

export function getThemeByKey(key: string): Theme | undefined {
  return themeMap.get(key)
}
