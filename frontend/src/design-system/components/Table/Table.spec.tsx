import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Table, TableHead, TableBody, TableRow, TableHeader } from './Table'

describe('Table', () => {
  it('renders', () => {
    render(
      <Table>
        <TableHead><TableRow><TableHeader>Name</TableHeader></TableRow></TableHead>
        <TableBody><TableRow><td>Diego</td></TableRow></TableBody>
      </Table>
    )
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Diego')).toBeInTheDocument()
  })
})
