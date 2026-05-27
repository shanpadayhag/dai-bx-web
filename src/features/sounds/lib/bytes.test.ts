import { describe, it, expect } from 'vitest'
import { formatBytes } from './bytes'

describe('formatBytes', () => {
  it('renders bytes as "B" below 1 KiB', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1)).toBe('1 B')
    expect(formatBytes(1023)).toBe('1023 B')
  })

  it('renders kilobytes (1 decimal) up to 1 MiB', () => {
    // bytes/102.4 yields 10 per KiB; rounded/10 = the KB value.
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(2048)).toBe('2 KB')
    expect(formatBytes(10 * 1024)).toBe('10 KB')
  })

  it('renders megabytes (1 decimal) at or above 1 MiB', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB')
  })
})
