import { render, screen } from '@solidjs/testing-library'
import { describe, it, expect } from 'vitest'
import IconButton from './IconButton'

describe('IconButton', () => {
  it('defaults to a square neutral icon button', () => {
    render(() => (
      <IconButton aria-label="settings">
        <span>⚙</span>
      </IconButton>
    ))
    const btn = screen.getByRole('button', { name: /settings/i })
    expect(btn.className).toContain('h-10')
    expect(btn.className).toContain('w-10')
    expect(btn.className).toContain('bg-secondary-background')
  })

  it('supports the smaller icon-sm size', () => {
    render(() => (
      <IconButton aria-label="x" size="icon-sm">
        <span>×</span>
      </IconButton>
    ))
    const btn = screen.getByRole('button', { name: /x/i })
    expect(btn.className).toContain('h-8')
    expect(btn.className).toContain('w-8')
  })

  it('allows overriding the variant', () => {
    render(() => (
      <IconButton aria-label="delete" variant="destructive">
        <span>🗑</span>
      </IconButton>
    ))
    expect(
      screen.getByRole('button', { name: /delete/i }).className,
    ).toContain('bg-destructive')
  })
})
