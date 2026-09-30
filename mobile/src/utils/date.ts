/**
 * 东八区时间换算。
 *
 * 不用 Intl.DateTimeFormat 的 timeZone：部分手机（iOS 的 JavaScriptCore /
 * 旧安卓 X5 内核）缺少完整 ICU 时区数据，构造时直接抛 RangeError，
 * 会让整个页面 setup 崩溃（devtools 的 Chromium 内核不受影响）。
 * 东八区是固定偏移，+8 小时最稳。
 */
const pad = (n: number) => String(n).padStart(2, '0')

/** 转东八区墙时间，格式 YYYY-MM-DD HH:mm。 */
export const beijingWall = (date: Date = new Date()): string => {
  const shifted = new Date(date.getTime() + 8 * 3600000)
  return `${shifted.toISOString().slice(0, 10)} ${pad(shifted.getUTCHours())}:${pad(
    shifted.getUTCMinutes(),
  )}`
}

/** 东八区当天日历日，格式 YYYY-MM-DD。 */
export const beijingToday = (): string => beijingWall().slice(0, 10)
