import React, { HTMLAttributes } from 'react'
import { useSidebar } from './SidebarContext'

export interface SidebarNavProps extends HTMLAttributes<HTMLElement> {}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <nav className={`sidebar-nav ${className}`} {...props}>
      {children}
    </nav>
  )
}

export interface NavItemProps extends HTMLAttributes<HTMLAnchorElement> {
  href?: string
  to?: string
  icon?: React.ReactNode
  active?: boolean
  badge?: React.ReactNode
  as?: React.ElementType
  end?: boolean
}

export const NavItem: React.FC<NavItemProps> = ({
  href,
  to,
  icon,
  active = false,
  badge,
  children,
  className = '',
  as: Component = 'a',
  onClick,
  end,
  ...props
}) => {
  const { close } = useSidebar()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    close()
    if (onClick) onClick(e)
  }

  const getClassName = (navLinkProps?: { isActive?: boolean }) => {
    const isActive = navLinkProps?.isActive ?? active
    return `nav-item ${isActive ? 'active' : ''} ${className}`
  }

  const isNavLink = Component !== 'a' && to !== undefined

  return (
    <Component
      href={href}
      to={to}
      end={end}
      className={isNavLink ? getClassName : getClassName()}
      onClick={handleClick}
      {...props}
    >
      {icon && <span className="nav-item-icon">{icon}</span>}
      <span className="nav-item-text">{children}</span>
      {badge && <span className="nav-item-badge">{badge}</span>}
    </Component>
  )
}
