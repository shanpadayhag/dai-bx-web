/**
 * Local-calendar date helpers ported from client-web-old/.../shared/utils/dates.ts.
 * Local-zone, deliberately: completion dates and `hiddenUntil` are user-local.
 */

export const dateToLocalIso = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const todayIso = (): string => dateToLocalIso(new Date())
