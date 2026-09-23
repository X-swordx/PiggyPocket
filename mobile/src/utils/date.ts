/** 东八区当天日历日，格式 YYYY-MM-DD（en-CA 本身就是该格式）。 */
export const beijingToday = (): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
