import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ToastProvider, useToast } from './Toast'

const TestConsumer = () => {
  const { addToast, toasts } = useToast()
  return (
    <div>
      <button onClick={() => addToast({ message: 'Hello', variant: 'success' })}>Add</button>
      <span data-testid="count">{toasts.length}</span>
    </div>
  )
}

describe('ToastProvider', () => {
  it('renders children', () => {
    render(<ToastProvider><div>App</div></ToastProvider>)
    expect(screen.getByText('App')).toBeInTheDocument()
  })
  it('addToast adds a toast', async () => {
    render(<ToastProvider><TestConsumer /></ToastProvider>)
    await act(async () => { fireEvent.click(screen.getByText('Add')) })
    expect(screen.getByTestId('count').textContent).toBe('1')
  })
})

describe('useToast', () => {
  it('throws when used outside provider', () => {
    const Broken = () => { useToast(); return null }
    expect(() => render(<Broken />)).toThrow()
  })
})
