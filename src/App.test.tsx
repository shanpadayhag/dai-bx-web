import { render, screen } from '@solidjs/testing-library'
import { Route, Router } from '@solidjs/router'
import { beforeEach, describe, it, expect } from 'vitest'
import App from './App'
import { __resetForTests, DB_NAME } from '~/lib/db'

const HelloPage = () => <div>hello from the matched route</div>

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

describe('App', () => {
  it('renders the status strip and the matched route component', async () => {
    render(() => (
      <Router root={App}>
        <Route path="/" component={HelloPage} />
      </Router>
    ))
    expect(await screen.findByText('DaiBX')).toBeInTheDocument()
    expect(await screen.findByText(/hello from the matched route/i)).toBeInTheDocument()
  })
})
