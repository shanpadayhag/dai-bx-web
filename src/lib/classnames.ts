/**
 * Conditional className composer. Ported from client-web-old/.../shared/utils/cn.ts.
 * Accepts strings, numbers, falsy, nested arrays, and object maps where truthy
 * values include the key. Mirrors the well-known `clsx` shape but is dependency-free.
 */

export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | Record<string, unknown>
  | ClassValue[]

const flatten = (value: ClassValue, out: string[]): void => {
  if (!value) return
  if (typeof value === 'string') {
    if (value) out.push(value)
    return
  }
  if (typeof value === 'number') {
    out.push(String(value))
    return
  }
  if (Array.isArray(value)) {
    for (const v of value) flatten(v, out)
    return
  }
  for (const key of Object.keys(value)) {
    if (value[key]) out.push(key)
  }
}

export const cn = (...values: ClassValue[]): string => {
  const out: string[] = []
  for (const v of values) flatten(v, out)
  return out.join(' ')
}
