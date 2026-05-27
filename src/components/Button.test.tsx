import { render, screen } from '@solidjs/testing-library'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Button, { buttonClasses } from './Button'

describe('Button', () => {
  it('renders children inside a button', () => {
    render(() => <Button>Save</Button>)
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('defaults to type="button"', () => {
    render(() => <Button>Press</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('applies the default variant + size classes', () => {
    render(() => <Button>Press</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-primary')
    expect(btn.className).toContain('brutal-press')
    expect(btn.className).toContain('h-10')
  })

  it('applies destructive variant + lg size when requested', () => {
    render(() => (
      <Button variant="destructive" size="lg">
        Delete
      </Button>
    ))
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-destructive')
    expect(btn.className).toContain('h-12')
  })

  it('applies ghost variant without brutalist border classes', () => {
    render(() => <Button variant="ghost">Ghost</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).not.toContain('shadow-brutal')
    expect(btn.className).not.toContain('border-2')
  })

  it('composes user-provided class and btnClass with variant classes', () => {
    render(() => (
      <Button class="custom-1" btnClass="custom-2">
        X
      </Button>
    ))
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('custom-1')
    expect(btn.className).toContain('custom-2')
    expect(btn.className).toContain('bg-primary')
  })

  it('fires onClick on click', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(() => <Button onClick={onClick}>Press</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('activates via Enter (native button keyboard behavior)', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(() => <Button onClick={onClick}>Press</Button>)
    screen.getByRole('button').focus()
    await user.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('respects disabled', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(() => (
      <Button disabled onClick={onClick}>
        Press
      </Button>
    ))
    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('buttonClasses helper', () => {
  it('returns the same class string the component would render', () => {
    const cls = buttonClasses({ variant: 'neutral', size: 'sm', extra: 'x-1' })
    expect(cls).toContain('bg-secondary-background')
    expect(cls).toContain('h-9')
    expect(cls).toContain('x-1')
  })

  it('defaults variant to default and size to default', () => {
    const cls = buttonClasses()
    expect(cls).toContain('bg-primary')
    expect(cls).toContain('h-10')
  })
})
