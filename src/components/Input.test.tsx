import { render, screen } from '@solidjs/testing-library'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Input from './Input'

describe('Input', () => {
  it('renders a text input with the brutalist base classes', () => {
    render(() => <Input placeholder="Type…" />)
    const node = screen.getByPlaceholderText('Type…')
    expect(node.tagName).toBe('INPUT')
    expect(node.className).toContain('shadow-brutal-sm')
    expect(node.className).toContain('focus-visible:shadow-brutal')
  })

  it('defaults autocomplete/correct/capitalize off and spellcheck false', () => {
    render(() => <Input data-testid="i" />)
    const node = screen.getByTestId('i')
    expect(node).toHaveAttribute('autocomplete', 'off')
    expect(node).toHaveAttribute('autocorrect', 'off')
    expect(node).toHaveAttribute('autocapitalize', 'off')
    expect(node).toHaveAttribute('spellcheck', 'false')
  })

  it('lets the caller override autocomplete', () => {
    render(() => <Input data-testid="i" autocomplete="email" />)
    expect(screen.getByTestId('i')).toHaveAttribute('autocomplete', 'email')
  })

  it('composes user-provided class with the base classes', () => {
    render(() => <Input data-testid="i" class="my-extra" />)
    const node = screen.getByTestId('i')
    expect(node.className).toContain('my-extra')
    expect(node.className).toContain('shadow-brutal-sm')
  })

  it('fires onInput as the user types', async () => {
    const onInput = vi.fn()
    const user = userEvent.setup()
    render(() => <Input data-testid="i" onInput={onInput} />)
    await user.type(screen.getByTestId('i'), 'hi')
    expect(onInput).toHaveBeenCalled()
  })
})
