import { render, screen } from '@solidjs/testing-library'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import GroupCreateInput from './GroupCreateInput'

describe('GroupCreateInput', () => {
  it('disables submit when input is empty', () => {
    render(() => <GroupCreateInput onSubmit={() => {}} onImport={() => {}} />)
    expect(screen.getByRole('button', { name: /new/i })).toBeDisabled()
  })

  it('calls onImport when the import button is clicked', async () => {
    const onImport = vi.fn()
    const user = userEvent.setup()
    render(() => <GroupCreateInput onSubmit={() => {}} onImport={onImport} />)
    await user.click(
      screen.getByRole('button', { name: /import group from json/i }),
    )
    expect(onImport).toHaveBeenCalledOnce()
  })

  it('calls onSubmit with the trimmed name and clears the input', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(() => <GroupCreateInput onSubmit={onSubmit} onImport={() => {}} />)

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
    render(() => <GroupCreateInput onSubmit={onSubmit} onImport={() => {}} />)
    await user.type(screen.getByPlaceholderText(/create a new group/i), 'Beta{Enter}')
    expect(onSubmit).toHaveBeenCalledWith('Beta')
  })

  it('does nothing for whitespace-only input', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(() => <GroupCreateInput onSubmit={onSubmit} onImport={() => {}} />)
    await user.type(screen.getByPlaceholderText(/create a new group/i), '   {Enter}')
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
