import React, { HTMLAttributes } from 'react'
import { useSidebar } from './SidebarContext'

export const SidebarOverlay: React.FC = () => {
  const { isOpen, close } = useSidebar()

  if (!isOpen) return null

  return (
    <div
      className="sidebar-overlay open"
      onClick={close}
      aria-hidden="true"
    />
  )
}

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  collapsed?: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  children,
  className = '',
  ...props
}) => {
  const { isOpen } = useSidebar()

  return (
    <aside
      className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${isOpen ? 'open' : ''} ${className}`}
      {...props}
    >
      {children}
    </aside>
  )
}

export interface SidebarHeaderProps extends HTMLAttributes<HTMLDivElement> {
  logo?: React.ReactNode
  title?: string
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  logo,
  title,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`sidebar-header ${className}`} {...props}>
      {logo && <div className="sidebar-logo">{logo}</div>}
      {title && <span className="sidebar-title">{title}</span>}
      {children}
    </div>
  )
}

export interface SidebarFooterProps extends HTMLAttributes<HTMLDivElement> {
  onLogout?: () => void
}

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  onLogout,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`sidebar-footer ${className}`} {...props}>
      {children}
      {onLogout && (
        <button className="logout-button" onClick={onLogout}>
          <LogoutIcon />
          <span className="logout-text">Sair</span>
        </button>
      )}
    </div>
  )
}
