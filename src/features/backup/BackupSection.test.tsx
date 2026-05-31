import { render, screen, waitFor } from '@solidjs/testing-library'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import type { AllStores } from './repository'
import { BACKUP_FORMAT, BACKUP_FORMAT_VERSION, type BackupFile } from './types'

// Mock the DB seam: serialize() and BackupSection both import from
// './repository', so this stubs both without touching IndexedDB.
const { readAllStores, replaceAllStores } = vi.hoisted(() => ({
  readAllStores: vi.fn<() => Promise<AllStores>>(),
  replaceAllStores: vi.fn<(file: BackupFile) => Promise<void>>(),
}))
vi.mock('./repository', () => ({ readAllStores, replaceAllStores }))

// Mock only the download trigger; keep the real backupFilename.
const { downloadBackup } = vi.hoisted(() => ({ downloadBackup: vi.fn() }))
vi.mock('./download', async (importActual) => {
  const actual = await importActual<typeof import('./download')>()
  return { ...actual, downloadBackup }
})

const BackupSection = (await import('./BackupSection')).default

const EMPTY: AllStores = { groups: [], tasks: [], preferences: [], sounds: [] }

const validBackup = (): BackupFile => ({
  format: BACKUP_FORMAT,
  formatVersion: BACKUP_FORMAT_VERSION,
  dbVersion: 3,
  exportedAt: '2026-05-31T12:00:00.000Z',
  data: {
    groups: [{ id: 'g1', name: 'Work', order: 0, isOpen: true, isHidden: false }],
    tasks: [],
    preferences: [{ id: 'global', defaultSoundId: null }],
    sounds: [],
  },
})

const fileFrom = (value: unknown, name = 'backup.json'): File =>
  new File([typeof value === 'string' ? value : JSON.stringify(value)], name, {
    type: 'application/json',
  })

const dialogOpen = (): boolean =>
  document.querySelector('dialog')?.hasAttribute('open') ?? false

beforeEach(() => {
  readAllStores.mockReset()
  replaceAllStores.mockReset()
  downloadBackup.mockReset()
  readAllStores.mockResolvedValue(EMPTY)
  replaceAllStores.mockResolvedValue(undefined)
  // jsdom's window.location.reload throws "Not implemented"; replace it.
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { reload: vi.fn() },
  })
})

describe('BackupSection — export', () => {
  it('builds an envelope and downloads it with a dated filename', async () => {
    render(() => <BackupSection />)
    await userEvent.click(screen.getByRole('button', { name: /export backup/i }))

    await waitFor(() => expect(downloadBackup).toHaveBeenCalledTimes(1))
    const [file, filename] = downloadBackup.mock.calls[0] as [BackupFile, string]
    expect(file.format).toBe('daibx-backup')
    expect(filename).toMatch(/^daibx-backup-\d{4}-\d{2}-\d{2}\.json$/)
  })
})

describe('BackupSection — import validation', () => {
  it('shows an inline error and never opens the confirm for an invalid file', async () => {
    render(() => <BackupSection />)
    const input = screen.getByTestId('backup-file-input')
    await userEvent.upload(input, fileFrom('{ not json'))

    expect(await screen.findByRole('alert')).toHaveTextContent(/DaiBX backup/i)
    expect(dialogOpen()).toBe(false)
    expect(replaceAllStores).not.toHaveBeenCalled()
  })
})

describe('BackupSection — import confirm flow', () => {
  it('opens the confirm dialog for a valid file', async () => {
    render(() => <BackupSection />)
    await userEvent.upload(
      screen.getByTestId('backup-file-input'),
      fileFrom(validBackup()),
    )
    await waitFor(() => expect(dialogOpen()).toBe(true))
    expect(replaceAllStores).not.toHaveBeenCalled()
  })

  it('cancel aborts without replacing data', async () => {
    render(() => <BackupSection />)
    await userEvent.upload(
      screen.getByTestId('backup-file-input'),
      fileFrom(validBackup()),
    )
    await waitFor(() => expect(dialogOpen()).toBe(true))

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    await waitFor(() => expect(dialogOpen()).toBe(false))
    expect(replaceAllStores).not.toHaveBeenCalled()
  })

  it('confirm replaces all stores and reloads', async () => {
    const backup = validBackup()
    render(() => <BackupSection />)
    await userEvent.upload(
      screen.getByTestId('backup-file-input'),
      fileFrom(backup),
    )
    await waitFor(() => expect(dialogOpen()).toBe(true))

    await userEvent.click(
      screen.getByRole('button', { name: /replace everything/i }),
    )

    await waitFor(() => expect(replaceAllStores).toHaveBeenCalledTimes(1))
    const [applied] = replaceAllStores.mock.calls[0] as [BackupFile]
    expect(applied.data.groups[0]?.id).toBe('g1')
    expect(window.location.reload).toHaveBeenCalledTimes(1)
  })
})
