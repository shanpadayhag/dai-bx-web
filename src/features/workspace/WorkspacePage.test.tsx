import { render, screen, waitFor } from '@solidjs/testing-library'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, it, expect } from 'vitest'
import { WorkspaceContextProvider } from '~/state/workspaceContext'
import { putGroup } from '~/features/groups/repository'
import { DB_NAME, __resetForTests } from '~/lib/db'
import WorkspacePage from './WorkspacePage'

const wipe = (): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })

const renderPage = () =>
  render(() => (
    <WorkspaceContextProvider>
      <WorkspacePage />
    </WorkspaceContextProvider>
  ))

beforeEach(async () => {
  await __resetForTests()
  await wipe()
})

describe('WorkspacePage', () => {
  it('renders skeletons before the groups store finishes loading', () => {
    renderPage()
    expect(screen.getByLabelText(/loading your tasks/i)).toBeInTheDocument()
  })

  it('renders the empty state when there are no groups after load', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/no groups yet\./i)).toBeInTheDocument()
    })
  })

  it('renders pre-seeded groups from IndexedDB', async () => {
    await putGroup({ id: 'g1', name: 'Alpha', order: 0, isOpen: true, isHidden: false })
    await putGroup({ id: 'g2', name: 'Beta', order: 1, isOpen: true, isHidden: false })
    renderPage()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alpha' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Beta' })).toBeInTheDocument()
    })
  })

  it('creating a group through the form persists and renders it', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/no groups yet\./i)).toBeInTheDocument()
    })
    await user.type(screen.getByPlaceholderText(/create a new group/i), 'Alpha{Enter}')
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alpha' })).toBeInTheDocument()
    })
  })

  it('opens the manage modal when the eye button is clicked', async () => {
    await putGroup({ id: 'g1', name: 'Alpha', order: 0, isOpen: true, isHidden: false })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alpha' })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /manage visible groups/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('shows the hidden-count link when at least one group is hidden', async () => {
    await putGroup({ id: 'g1', name: 'Alpha', order: 0, isOpen: true, isHidden: false })
    await putGroup({ id: 'g2', name: 'Beta', order: 1, isOpen: true, isHidden: true })
    renderPage()
    // The same "1 hidden" string also lives inside the always-mounted closed
    // <dialog>; narrow to the visible button to avoid the duplicate match.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /1 hidden/i })).toBeInTheDocument()
    })
  })
})
