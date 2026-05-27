import { render, screen } from '@solidjs/testing-library'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ManageGroupsModal from './ManageGroupsModal'
import type { Group } from '~/features/groups/types'

const sampleGroups: Group[] = [
  { id: 'g1', name: 'Alpha', order: 0, isOpen: true, isHidden: false },
  { id: 'g2', name: 'Beta', order: 1, isOpen: true, isHidden: true },
  { id: 'g3', name: 'Gamma', order: 2, isOpen: true, isHidden: false },
]

const noop = () => {}

describe('ManageGroupsModal', () => {
  it('does not render content while closed', () => {
    render(() => (
      <ManageGroupsModal
        show={false}
        groups={sampleGroups}
        onToggleHidden={noop}
        onShowAll={noop}
        onClose={noop}
      />
    ))
    // The <dialog> exists but should not be open.
    const dialog = screen.getByRole('dialog', { hidden: true })
    expect((dialog as HTMLDialogElement).open).toBe(false)
  })

  it('opens the dialog when show=true and lists every group as a checkbox', () => {
    render(() => (
      <ManageGroupsModal
        show={true}
        groups={sampleGroups}
        onToggleHidden={noop}
        onShowAll={noop}
        onClose={noop}
      />
    ))
    const dialog = screen.getByRole('dialog')
    expect((dialog as HTMLDialogElement).open).toBe(true)
    expect(screen.getAllByRole('checkbox')).toHaveLength(3)
  })

  it('marks visible groups checked and hidden groups unchecked', () => {
    render(() => (
      <ManageGroupsModal
        show={true}
        groups={sampleGroups}
        onToggleHidden={noop}
        onShowAll={noop}
        onClose={noop}
      />
    ))
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    expect(checkboxes[0]?.checked).toBe(true) // Alpha
    expect(checkboxes[1]?.checked).toBe(false) // Beta is hidden
    expect(checkboxes[2]?.checked).toBe(true) // Gamma
  })

  it('toggling a visible group emits onToggleHidden(id, true)', async () => {
    const onToggleHidden = vi.fn()
    const user = userEvent.setup()
    render(() => (
      <ManageGroupsModal
        show={true}
        groups={sampleGroups}
        onToggleHidden={onToggleHidden}
        onShowAll={noop}
        onClose={noop}
      />
    ))
    await user.click(screen.getAllByRole('checkbox')[0]!)
    expect(onToggleHidden).toHaveBeenCalledWith('g1', true)
  })

  it('Show all button appears only when there is at least one hidden group', () => {
    const { unmount } = render(() => (
      <ManageGroupsModal
        show={true}
        groups={[{ id: 'g', name: 'G', order: 0, isOpen: true, isHidden: false }]}
        onToggleHidden={noop}
        onShowAll={noop}
        onClose={noop}
      />
    ))
    expect(screen.queryByRole('button', { name: /show all/i })).not.toBeInTheDocument()
    unmount()

    render(() => (
      <ManageGroupsModal
        show={true}
        groups={sampleGroups}
        onToggleHidden={noop}
        onShowAll={noop}
        onClose={noop}
      />
    ))
    expect(screen.getByRole('button', { name: /show all/i })).toBeInTheDocument()
  })

  it('Done fires onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(() => (
      <ManageGroupsModal
        show={true}
        groups={sampleGroups}
        onToggleHidden={noop}
        onShowAll={noop}
        onClose={onClose}
      />
    ))
    await user.click(screen.getByRole('button', { name: /^done$/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
