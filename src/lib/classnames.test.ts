import { describe, it, expect } from 'vitest'
import { cn } from './classnames'

describe('cn', () => {
  it('joins string arguments with single spaces', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('ignores falsy values (null, undefined, false, empty string)', () => {
    expect(cn('a', null, 'b', undefined, false, '', 'c')).toBe('a b c')
  })

  it('stringifies non-zero numbers and treats 0 as falsy (parity with Angular cn)', () => {
    expect(cn('a', 1, 'b', 2)).toBe('a 1 b 2')
    expect(cn('a', 0, 'b')).toBe('a b')
  })

  it('flattens nested arrays', () => {
    expect(cn(['a', ['b', ['c', 'd']]], 'e')).toBe('a b c d e')
  })

  it('picks object keys whose values are truthy', () => {
    expect(
      cn({ a: true, b: false, c: 1, d: null, e: 'yes', f: 0 })
    ).toBe('a c e')
  })

  it('combines all input shapes', () => {
    expect(
      cn('base', { active: true, disabled: false }, ['extra', null], undefined, 'tail')
    ).toBe('base active extra tail')
  })

  it('returns an empty string when given nothing useful', () => {
    expect(cn(null, undefined, false, '', { a: false })).toBe('')
  })
})
