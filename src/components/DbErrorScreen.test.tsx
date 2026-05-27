import { render, screen } from '@solidjs/testing-library'
import { describe, it, expect } from 'vitest'
import DbErrorScreen from './DbErrorScreen'

describe('DbErrorScreen', () => {
  it('renders the storage-error chrome and headline', () => {
    render(() => <DbErrorScreen />)
    expect(screen.getByText(/storage error/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /indexeddb unavailable/i })).toBeInTheDocument()
  })

  it('mentions checking the browser settings', () => {
    render(() => <DbErrorScreen />)
    expect(screen.getByText(/private\/incognito mode/i)).toBeInTheDocument()
  })
})
