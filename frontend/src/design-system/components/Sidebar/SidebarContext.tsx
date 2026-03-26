import React, { createContext, useContext, useState } from 'react'

interface SidebarContextType {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

export interface SidebarProviderProps {
  children: React.ReactNode
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => setIsOpen(prev => !prev)
  const close = () => setIsOpen(false)

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  )
}
