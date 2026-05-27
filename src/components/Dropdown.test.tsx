import { render, screen } from '@solidjs/testing-library'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Dropdown, { type DropdownOption } from './Dropdown'

const OPTIONS: DropdownOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
]

describe('Dropdown', () => {
  it('renders the trigger with the placeholder when nothing is selected', () => {
    render(() => (
      <Dropdown
        options={OPTIONS}
        value=""
        placeholder="Pick one"
        onValueChange={() => {}}
      />
    ))
    expect(screen.getByRole('button', { name: /pick one/i })).toBeInTheDocument()
  })

  it('shows the matching label when a value is selected', () => {
    render(() => (
      <Dropdown options={OPTIONS} value="b" onValueChange={() => {}} />
    ))
    expect(
      screen.getByRole('button', { expanded: false, name: /beta/i }),
    ).toBeInTheDocument()
  })

  it('opens the listbox on click and exposes every option', async () => {
    const user = userEvent.setup()
    render(() => <Dropdown options={OPTIONS} value="" onValueChange={() => {}} />)
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('selecting an option fires onValueChange and closes the listbox', async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()
    render(() => (
      <Dropdown options={OPTIONS} value="" onValueChange={onValueChange} />
    ))
    await user.click(screen.getByRole('button', { expanded: false }))
    await user.click(screen.getByRole('option', { name: /gamma/i }))
    expect(onValueChange).toHaveBeenCalledWith('c')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('marks the selected option with aria-selected=true', async () => {
    const user = userEvent.setup()
    render(() => (
      <Dropdown options={OPTIONS} value="b" onValueChange={() => {}} />
    ))
    await user.click(screen.getByRole('button'))
    const selected = screen.getByRole('option', { name: /beta/i })
    expect(selected).toHaveAttribute('aria-selected', 'true')
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    render(() => <Dropdown options={OPTIONS} value="" onValueChange={() => {}} />)
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes on outside pointer down', async () => {
    const user = userEvent.setup()
    render(() => (
      <div>
        <div data-testid="outside">outside</div>
        <Dropdown options={OPTIONS} value="" onValueChange={() => {}} />
      </div>
    ))
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.click(screen.getByTestId('outside'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
