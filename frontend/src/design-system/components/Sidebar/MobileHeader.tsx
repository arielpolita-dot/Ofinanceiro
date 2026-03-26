import React, { HTMLAttributes } from 'react'
import { useSidebar } from './SidebarContext'

export interface MobileHeaderProps extends HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode
  title?: string
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  logo,
  title,
  className = '',
  ...props
}) => {
  const { toggle } = useSidebar()

  return (
    <header className={`mobile-header ${className}`} {...props}>
      <button className="mobile-menu-btn" onClick={toggle} aria-label="Toggle menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      {logo && <div className="mobile-header-logo">{logo}</div>}
      {title && <span className="mobile-header-title">{title}</span>}
    </header>
  )
}
