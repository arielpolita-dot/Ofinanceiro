import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HomeIcon, PlansIcon, SettingsIcon, CompaniesIcon } from '../icons'

describe('icons', () => {
  it('renders HomeIcon', () => {
    const { container } = render(<HomeIcon />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
  it('renders PlansIcon', () => {
    const { container } = render(<PlansIcon />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
  it('renders SettingsIcon', () => {
    const { container } = render(<SettingsIcon />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
  it('renders CompaniesIcon', () => {
    const { container } = render(<CompaniesIcon />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
