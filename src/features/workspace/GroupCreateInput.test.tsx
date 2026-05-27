import { render, screen } from '@solidjs/testing-library'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import GroupCreateInput from './GroupCreateInput'

describe('GroupCreateInput', () => {
  it('disables submit when input is empty', () => {
    render(() => <GroupCreateInput onSubmit={() => {}} />)
    expect(screen.getByRole('button', { name: /new/i })).toBeDisabled()
  })

  it('calls onSubmit with the trimmed name and clears the input', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(() => <GroupCreateInput onSubmit={onSubmit} />)

    await user.type(screen.getByPlaceholderText(/create a new group/i), '  Alpha  ')
    await user.click(screen.getByRole('button', { name: /new/i }))

    expect(onSubmit).toHaveBeenCalledWith('Alpha')
    expect(
      (screen.getByPlaceholderText(/create a new group/i) as HTMLInputElement).value,
    ).toBe('')
  })

  it('submits on Enter', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(() => <GroupCreateInput onSubmit={onSubmit} />)
    await user.type(screen.getByPlaceholderText(/create a new group/i), 'Beta{Enter}')
    expect(onSubmit).toHaveBeenCalledWith('Beta')
  })

  it('does nothing for whitespace-only input', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(() => <GroupCreateInput onSubmit={onSubmit} />)
    await user.type(screen.getByPlaceholderText(/create a new group/i), '   {Enter}')
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
