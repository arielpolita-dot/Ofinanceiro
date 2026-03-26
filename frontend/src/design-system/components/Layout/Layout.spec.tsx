import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Layout, Page, Container, MainContent } from './Layout'

describe('Layout', () => {
  it('renders children', () => {
    render(<Layout>Content</Layout>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })
})
describe('Page', () => {
  it('renders with title', () => {
    render(<Page title="Title">Body</Page>)
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
  })
})
describe('Container', () => {
  it('renders children', () => {
    render(<Container>Inner</Container>)
    expect(screen.getByText('Inner')).toBeInTheDocument()
  })
})
describe('MainContent', () => {
  it('renders children', () => {
    render(<MainContent>Main</MainContent>)
    expect(screen.getByText('Main')).toBeInTheDocument()
  })
})
