import { render, screen, waitFor } from '@solidjs/testing-library'
import userEvent from '@testing-library/user-event'
import { Route, Router } from '@solidjs/router'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { WorkspaceContextProvider } from '~/state/workspaceContext'
import { putSound } from '~/features/sounds/repository'
import { setDefaultSoundId } from '~/features/preferences/repository'
import { DB_NAME, __resetForTests } from '~/lib/db'
import SettingsPage from './SettingsPage'

// jsdom doesn't implement HTMLMediaElement.play / pause. Stub them so the
// preview button can be exercised without throwing.
// jsdom doesn't implement HTMLMediaElement.play / pause, and fake-indexeddb
// loses Blob's prototype in jsdom (the stored row's `blob` round-trips as a
// plain object), which would break `URL.createObjectURL(blob)`. Stub all
// three so the preview button can be exercised without throwing.
const installAudioStubs = (): void => {
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  })
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: vi.fn(),
  })
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
  vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined)
}

const wipe = (): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })

const renderPage = () =>
  render(() => (
    <Router>
      <Route
        path="*"
        component={() => (
          <WorkspaceContextProvider>
            <SettingsPage />
          </WorkspaceContextProvider>
        )}
      />
    </Router>
  ))

const audioRow = (id: string, name: string) => ({
  id,
  name,
  contentType: 'audio/mpeg',
  sizeBytes: 4096,
  createdAt: '2026-05-24T10:00:00.000Z',
  blob: new Blob([new ArrayBuffer(4096)], { type: 'audio/mpeg' }),
})

beforeEach(async () => {
  await __resetForTests()
  await wipe()
  installAudioStubs()
})

describe('SettingsPage', () => {
  it('renders the Sound library heading and an empty state when no sounds exist', async () => {
    renderPage()
    expect(
      await screen.findByRole('heading', { name: /sound library/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/no sounds yet/i)).toBeInTheDocument()
  })

  it('lists pre-seeded sounds with their names', async () => {
    await putSound(audioRow('s1', 'alarm-bell'))
    await putSound(audioRow('s2', 'gentle-chime'))
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('alarm-bell')).toBeInTheDocument()
      expect(screen.getByText('gentle-chime')).toBeInTheDocument()
    })
  })

  it('marks the default sound with the DEFAULT badge', async () => {
    await putSound(audioRow('s1', 'star'))
    await setDefaultSoundId('s1')
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/^default$/i)).toBeInTheDocument()
    })
  })

  it('clicking the star sets the sound as default', async () => {
    await putSound(audioRow('s1', 'star'))
    const user = userEvent.setup()
    renderPage()
    const btn = await screen.findByRole('button', { name: /^set star as default$/i })
    await user.click(btn)
    await waitFor(() => {
      expect(screen.getByText(/^default$/i)).toBeInTheDocument()
    })
  })

  it('clicking delete removes the sound', async () => {
    await putSound(audioRow('s1', 'doomed'))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('doomed')
    await user.click(screen.getByRole('button', { name: /^delete doomed$/i }))
    await waitFor(() => {
      expect(screen.queryByText('doomed')).not.toBeInTheDocument()
    })
  })

  it('clicking play switches the button to the stop state, click again resets it', async () => {
    await putSound(audioRow('s1', 'beep'))
    const user = userEvent.setup()
    renderPage()
    const playBtn = await screen.findByRole('button', { name: /^preview beep$/i })
    await user.click(playBtn)
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^stop preview of beep$/i }),
      ).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /^stop preview of beep$/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^preview beep$/i })).toBeInTheDocument()
    })
  })
})
