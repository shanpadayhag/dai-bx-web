import { createSignal } from 'solid-js'
import { render, screen, waitFor } from '@solidjs/testing-library'
import userEvent from '@testing-library/user-event'
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

describe('importGroup', () => {
  const ImportProbe = (props: { text: string }) => {
    const ws = useWorkspace()
    const [out, setOut] = createSignal('pending')
    const groupCount = () => ws.groups.state.groups.length
    return (
      <div>
        <span data-testid="result">{out()}</span>
        <span data-testid="groups">{String(groupCount())}</span>
        <button
          type="button"
          onClick={() => {
            void ws.importGroup(props.text).then((r) => setOut(JSON.stringify(r)))
          }}
        >
          run
        </button>
      </div>
    )
  }

  const renderProbe = (text: string) =>
    render(() => (
      <WorkspaceContextProvider>
        <ImportProbe text={text} />
      </WorkspaceContextProvider>
    ))

  it('creates a group and its tasks from valid JSON', async () => {
    const user = userEvent.setup()
    const text = JSON.stringify({
      name: 'Errands',
      tasks: [
        { name: 'Buy groceries', tasks: [{ name: 'Milk' }, { name: 'Eggs' }] },
        { name: 'Call the bank' },
      ],
    })
    renderProbe(text)
    await waitFor(() => expect(screen.getByTestId('groups').textContent).toBe('0'))
    await user.click(screen.getByRole('button', { name: 'run' }))

    await waitFor(() => {
      expect(JSON.parse(screen.getByTestId('result').textContent!)).toEqual({
        ok: true,
        groupName: 'Errands',
        taskCount: 4,
      })
    })
    expect(screen.getByTestId('groups').textContent).toBe('1')
  })

  it('returns an error and creates nothing for invalid JSON', async () => {
    const user = userEvent.setup()
    renderProbe('not json {')
    await waitFor(() => expect(screen.getByTestId('groups').textContent).toBe('0'))
    await user.click(screen.getByRole('button', { name: 'run' }))

    await waitFor(() => {
      const result = JSON.parse(screen.getByTestId('result').textContent!)
      expect(result.ok).toBe(false)
      expect(result.error).toMatch(/not valid json/i)
    })
    expect(screen.getByTestId('groups').textContent).toBe('0')
  })
})
