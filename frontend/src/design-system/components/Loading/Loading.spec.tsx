import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Spinner, Skeleton, LoadingOverlay, Progress } from './Loading'

describe('Spinner', () => {
  it('renders', () => {
    const { container } = render(<Spinner />)
    expect(container.querySelector('.spinner')).toBeInTheDocument()
  })
  it('renders with size', () => {
    const { container } = render(<Spinner size="lg" />)
    expect(container.querySelector('.spinner-lg')).toBeInTheDocument()
  })
})
describe('Skeleton', () => {
  it('renders', () => {
    const { container } = render(<Skeleton />)
    expect(container.querySelector('.skeleton')).toBeInTheDocument()
  })
})
describe('LoadingOverlay', () => {
  it('renders when visible', () => {
    const { container } = render(<LoadingOverlay visible />)
    expect(container.querySelector('.loading-overlay')).toBeInTheDocument()
  })
})
describe('Progress', () => {
  it('renders with value', () => {
    const { container } = render(<Progress value={50} />)
    expect(container.querySelector('.progress')).toBeInTheDocument()
  })
})
