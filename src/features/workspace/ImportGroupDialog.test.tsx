import { render, screen, waitFor } from '@solidjs/testing-library'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ImportGroupDialog from './ImportGroupDialog'
import type { ImportResult } from '~/features/import/types'

const jsonFile = (contents: string): File =>
  new File([contents], 'group.json', { type: 'application/json' })

const fileInput = (): HTMLInputElement =>
  document.querySelector('input[type="file"]') as HTMLInputElement

describe('ImportGroupDialog', () => {
  it('stays closed when show=false', () => {
    render(() => (
      <ImportGroupDialog show={false} onImport={vi.fn()} onClose={vi.fn()} />
    ))
    const dialog = screen.getByRole('dialog', { hidden: true }) as HTMLDialogElement
    expect(dialog.open).toBe(false)
  })

  it('opens and shows the file picker when show=true', () => {
    render(() => (
      <ImportGroupDialog show={true} onImport={vi.fn()} onClose={vi.fn()} />
    ))
    expect((screen.getByRole('dialog') as HTMLDialogElement).open).toBe(true)
    expect(screen.getByText(/choose a \.json file/i)).toBeInTheDocument()
  })

  it('passes the file text to onImport and shows a success line, then auto-closes', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onImport = vi.fn(
      async (): Promise<ImportResult> => ({
        ok: true,
        groupName: 'Errands',
        taskCount: 12,
      }),
    )
    const onClose = vi.fn()
    render(() => (
      <ImportGroupDialog show={true} onImport={onImport} onClose={onClose} />
    ))

    await user.upload(fileInput(), jsonFile('{"name":"Errands","tasks":[]}'))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        /imported "errands" with 12 tasks/i,
      ),
    )
    expect(onImport).toHaveBeenCalledWith('{"name":"Errands","tasks":[]}')
    expect(onClose).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1000)
    expect(onClose).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('uses the singular "task" for a count of one', async () => {
    const user = userEvent.setup()
    const onImport = vi.fn(
      async (): Promise<ImportResult> => ({
        ok: true,
        groupName: 'Solo',
        taskCount: 1,
      }),
    )
    render(() => (
      <ImportGroupDialog show={true} onImport={onImport} onClose={vi.fn()} />
    ))
    await user.upload(fileInput(), jsonFile('{}'))
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/with 1 task\./i),
    )
  })

  it('shows an inline error and stays open on a failed import', async () => {
    const user = userEvent.setup()
    const onImport = vi.fn(
      async (): Promise<ImportResult> => ({
        ok: false,
        error: 'Task at position 3 is missing a name.',
      }),
    )
    const onClose = vi.fn()
    render(() => (
      <ImportGroupDialog show={true} onImport={onImport} onClose={onClose} />
    ))

    await user.upload(fileInput(), jsonFile('garbage'))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        /task at position 3 is missing a name/i,
      ),
    )
    expect(onClose).not.toHaveBeenCalled()
    expect((screen.getByRole('dialog') as HTMLDialogElement).open).toBe(true)
  })
})
