import { createSignal } from 'solid-js'
import { render, screen } from '@solidjs/testing-library'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import TimeSpinner, { type TimeOfDay } from './TimeSpinner'

const noon: TimeOfDay = { hour: 12, minute: 0 }

describe('TimeSpinner', () => {
  it('renders the hour and minute in 12-hour form with zero padding', () => {
    render(() => <TimeSpinner value={{ hour: 9, minute: 5 }} onChange={() => {}} />)
    expect((screen.getByLabelText('Hour') as HTMLInputElement).value).toBe('09')
    expect((screen.getByLabelText('Minute') as HTMLInputElement).value).toBe('05')
  })

  it('displays 12 instead of 0 for midnight/noon', () => {
    const { unmount } = render(() => (
      <TimeSpinner value={{ hour: 0, minute: 0 }} onChange={() => {}} />
    ))
    expect((screen.getByLabelText('Hour') as HTMLInputElement).value).toBe('12')
    unmount()

    render(() => <TimeSpinner value={noon} onChange={() => {}} />)
    expect((screen.getByLabelText('Hour') as HTMLInputElement).value).toBe('12')
  })

  it('marks AM/PM via aria-pressed', () => {
    render(() => <TimeSpinner value={{ hour: 9, minute: 0 }} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /^AM$/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: /^PM$/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('clicking + on the hour increases by 1', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(() => <TimeSpinner value={{ hour: 9, minute: 30 }} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: /increase hour/i }))
    expect(onChange).toHaveBeenCalledWith({ hour: 10, minute: 30 })
  })

  it('hour wraps at 24', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(() => <TimeSpinner value={{ hour: 23, minute: 0 }} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: /increase hour/i }))
    expect(onChange).toHaveBeenCalledWith({ hour: 0, minute: 0 })
  })

  it('clicking + on the minute carries into the hour at minute=59', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(() => <TimeSpinner value={{ hour: 9, minute: 59 }} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: /increase minute/i }))
    expect(onChange).toHaveBeenCalledWith({ hour: 10, minute: 0 })
  })

  it('clicking PM when currently AM flips the meridiem', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(() => <TimeSpinner value={{ hour: 9, minute: 0 }} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: /^PM$/ }))
    expect(onChange).toHaveBeenCalledWith({ hour: 21, minute: 0 })
  })

  it('clicking the already-active meridiem is a no-op', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(() => <TimeSpinner value={{ hour: 9, minute: 0 }} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: /^AM$/ }))
    expect(onChange).not.toHaveBeenCalled()
  })

  // Regression: the inputs use `attr:value` (attribute, not property) so
  // Solid's reactive binding doesn't clobber the user's in-flight typing
  // mid-keystroke. Without this, typing "17" into the minute field force-
  // padded to "01" after the first digit and `maxLength=2` then blocked the
  // "7" from landing.
  it('typing a second digit into the minute is not blocked by mid-keystroke padding', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    const [value, setValue] = createSignal<TimeOfDay>({ hour: 9, minute: 0 })
    render(() => (
      <TimeSpinner
        value={value()}
        onChange={(next) => { onChange(next); setValue(next) }}
      />
    ))
    const minute = screen.getByLabelText('Minute') as HTMLInputElement
    await user.click(minute)
    await user.clear(minute)
    await user.type(minute, '1')
    expect(minute.value).toBe('1')
    expect(onChange).toHaveBeenLastCalledWith({ hour: 9, minute: 1 })
    await user.type(minute, '7')
    expect(minute.value).toBe('17')
    expect(onChange).toHaveBeenLastCalledWith({ hour: 9, minute: 17 })
  })

  it('blurring the minute pads single digits to two characters', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    const [value, setValue] = createSignal<TimeOfDay>({ hour: 9, minute: 0 })
    render(() => (
      <TimeSpinner
        value={value()}
        onChange={(next) => { onChange(next); setValue(next) }}
      />
    ))
    const minute = screen.getByLabelText('Minute') as HTMLInputElement
    await user.click(minute)
    await user.clear(minute)
    await user.type(minute, '9')
    expect(minute.value).toBe('9')
    await user.tab() // blur
    expect(minute.value).toBe('09')
  })
})
