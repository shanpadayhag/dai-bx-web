import { render, screen, waitFor } from '@solidjs/testing-library'
import { beforeEach, describe, it, expect } from 'vitest'
import { WorkspaceContextProvider, useWorkspace } from './workspaceContext'
import { __resetForTests, DB_NAME } from '~/lib/db'

const Probe = () => {
  const ws = useWorkspace()
  return (
    <div>
      <span data-testid="ready">{String(ws.dbReady())}</span>
      <span data-testid="error">{String(ws.dbError() ?? 'null')}</span>
    </div>
  )
}

const wipe = (): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })

beforeEach(async () => {
  await __resetForTests()
  await wipe()
})

describe('WorkspaceContextProvider', () => {
  it('eventually marks dbReady=true with the in-memory IDB', async () => {
    render(() => (
      <WorkspaceContextProvider>
        <Probe />
      </WorkspaceContextProvider>
    ))
    expect(screen.getByTestId('ready').textContent).toBe('false')
    await waitFor(() => {
      expect(screen.getByTestId('ready').textContent).toBe('true')
    })
    expect(screen.getByTestId('error').textContent).toBe('null')
  })
})

describe('useWorkspace', () => {
  it('throws when used outside the provider', () => {
    expect(() => useWorkspace()).toThrow(/inside WorkspaceContextProvider/)
  })
})
