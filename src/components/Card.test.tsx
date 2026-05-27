import { render, screen } from '@solidjs/testing-library'
import { describe, it, expect } from 'vitest'
import { Card, CardContent } from './Card'

describe('Card', () => {
  it('renders children with the brutalist container classes', () => {
    render(() => <Card>hello</Card>)
    const node = screen.getByText('hello')
    expect(node.className).toContain('rounded-lg')
    expect(node.className).toContain('border-2')
    expect(node.className).toContain('shadow-brutal')
    expect(node.className).toContain('bg-secondary-background')
  })

  it('composes user-provided class with the base classes', () => {
    render(() => <Card class="custom-card">child</Card>)
    const node = screen.getByText('child')
    expect(node.className).toContain('custom-card')
    expect(node.className).toContain('shadow-brutal')
  })
})

describe('CardContent', () => {
  it('renders children with the padded slot classes', () => {
    render(() => <CardContent>body</CardContent>)
    const node = screen.getByText('body')
    expect(node.className).toContain('p-5')
  })

  it('composes user-provided class', () => {
    render(() => <CardContent class="more-pad">body</CardContent>)
    const node = screen.getByText('body')
    expect(node.className).toContain('more-pad')
    expect(node.className).toContain('p-5')
  })
})
