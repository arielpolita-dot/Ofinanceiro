import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs'

describe('Tabs', () => {
  it('renders tabs and content', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList><TabsTrigger value="a">Tab A</TabsTrigger><TabsTrigger value="b">Tab B</TabsTrigger></TabsList>
        <TabsContent value="a">Content A</TabsContent>
        <TabsContent value="b">Content B</TabsContent>
      </Tabs>
    )
    expect(screen.getByText('Tab A')).toBeInTheDocument()
    expect(screen.getByText('Content A')).toBeInTheDocument()
  })
  it('switches content on click', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList><TabsTrigger value="a">Tab A</TabsTrigger><TabsTrigger value="b">Tab B</TabsTrigger></TabsList>
        <TabsContent value="a">Content A</TabsContent>
        <TabsContent value="b">Content B</TabsContent>
      </Tabs>
    )
    fireEvent.click(screen.getByText('Tab B'))
    expect(screen.getByText('Content B')).toBeInTheDocument()
  })
})
