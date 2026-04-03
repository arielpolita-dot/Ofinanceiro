import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal'

describe('Modal', () => {
  it('renders when open', () => {
    render(<Modal open onClose={() => {}}><ModalBody>Content</ModalBody></Modal>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })
  it('does not render when closed', () => {
    render(<Modal open={false} onClose={() => {}}><ModalBody>Hidden</ModalBody></Modal>)
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
  })
})
describe('ModalHeader', () => {
  it('renders children', () => {
    render(<Modal open onClose={() => {}}><ModalHeader>Title</ModalHeader></Modal>)
    expect(screen.getByText('Title')).toBeInTheDocument()
  })
})
describe('ModalBody', () => {
  it('renders children', () => {
    render(<Modal open onClose={() => {}}><ModalBody>Body</ModalBody></Modal>)
    expect(screen.getByText('Body')).toBeInTheDocument()
  })
})
describe('ModalFooter', () => {
  it('renders children', () => {
    render(<Modal open onClose={() => {}}><ModalFooter><button>Save</button></ModalFooter></Modal>)
    expect(screen.getByText('Save')).toBeInTheDocument()
  })
})
