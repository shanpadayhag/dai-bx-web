import { render, screen } from '@solidjs/testing-library'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import SoundListItem from './SoundListItem'
import type { SoundMeta } from './types'

const meta = (overrides: Partial<SoundMeta> = {}): SoundMeta => ({
  id: 's1',
  name: 'bell',
  contentType: 'audio/mpeg',
  sizeBytes: 2048,
  createdAt: '2026-05-24T10:00:00Z',
  ...overrides,
})

const noop = () => {}

describe('SoundListItem', () => {
  it('renders the name and a formatted size', () => {
    render(() => (
      <SoundListItem
        sound={meta()}
        isPlaying={false}
        isDefault={false}
        onPreviewToggle={noop}
        onSetDefault={noop}
        onDelete={noop}
      />
    ))
    expect(screen.getByText('bell')).toBeInTheDocument()
    // 2048 bytes ⇒ "2 KB" per formatBytes' Angular-parity formula.
    expect(screen.getByText(/2 KB/)).toBeInTheDocument()
  })

  it('shows a Play icon when not playing and a Stop icon when playing', () => {
    const { unmount } = render(() => (
      <SoundListItem
        sound={meta()}
        isPlaying={false}
        isDefault={false}
        onPreviewToggle={noop}
        onSetDefault={noop}
        onDelete={noop}
      />
    ))
    expect(screen.getByRole('button', { name: /^preview bell$/i })).toBeInTheDocument()
    unmount()

    render(() => (
      <SoundListItem
        sound={meta()}
        isPlaying={true}
        isDefault={false}
        onPreviewToggle={noop}
        onSetDefault={noop}
        onDelete={noop}
      />
    ))
    expect(
      screen.getByRole('button', { name: /^stop preview of bell$/i }),
    ).toBeInTheDocument()
  })

  it('shows the DEFAULT badge only when isDefault is true', () => {
    const { unmount } = render(() => (
      <SoundListItem
        sound={meta()}
        isPlaying={false}
        isDefault={false}
        onPreviewToggle={noop}
        onSetDefault={noop}
        onDelete={noop}
      />
    ))
    expect(screen.queryByText(/^default$/i)).not.toBeInTheDocument()
    unmount()

    render(() => (
      <SoundListItem
        sound={meta()}
        isPlaying={false}
        isDefault={true}
        onPreviewToggle={noop}
        onSetDefault={noop}
        onDelete={noop}
      />
    ))
    expect(screen.getByText(/^default$/i)).toBeInTheDocument()
  })

  it('fires the callback for each control', async () => {
    const onPreviewToggle = vi.fn()
    const onSetDefault = vi.fn()
    const onDelete = vi.fn()
    const user = userEvent.setup()

    render(() => (
      <SoundListItem
        sound={meta()}
        isPlaying={false}
        isDefault={false}
        onPreviewToggle={onPreviewToggle}
        onSetDefault={onSetDefault}
        onDelete={onDelete}
      />
    ))

    await user.click(screen.getByRole('button', { name: /^preview bell$/i }))
    await user.click(screen.getByRole('button', { name: /^set bell as default$/i }))
    await user.click(screen.getByRole('button', { name: /^delete bell$/i }))

    expect(onPreviewToggle).toHaveBeenCalledOnce()
    expect(onSetDefault).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledOnce()
  })
})
