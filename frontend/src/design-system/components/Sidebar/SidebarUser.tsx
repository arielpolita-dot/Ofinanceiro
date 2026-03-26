import React, { HTMLAttributes } from 'react'

export interface UserProfileProps extends HTMLAttributes<HTMLDivElement> {
  name: string
  email?: string
  avatar?: React.ReactNode
}

export const UserProfile: React.FC<UserProfileProps> = ({
  name,
  email,
  avatar,
  className = '',
  ...props
}) => {
  return (
    <div className={`user-profile ${className}`} {...props}>
      {avatar && <div className="user-avatar">{avatar}</div>}
      <div className="user-info">
        <span className="user-name">{name}</span>
        {email && <span className="user-email">{email}</span>}
      </div>
    </div>
  )
}

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

export interface LogoutButtonProps extends HTMLAttributes<HTMLButtonElement> {
  onLogout: () => void
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  onLogout,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`logout-button ${className}`}
      onClick={onLogout}
      {...props}
    >
      <LogoutIcon />
      <span className="logout-text">Sair</span>
    </button>
  )
}

export interface SidebarUserSectionProps extends HTMLAttributes<HTMLDivElement> {
  name: string
  email?: string
  avatar?: React.ReactNode
}

export const SidebarUserSection: React.FC<SidebarUserSectionProps> = ({
  name,
  email,
  avatar,
  children,
  className = '',
  ...props
}) => {
  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  return (
    <div className={`sidebar-user-section ${className}`} {...props}>
      <div className="user-section-info">
        <div className="user-section-avatar">
          {avatar || initials}
        </div>
        <div className="user-section-details">
          <span className="user-section-name">{name}</span>
          {email && <span className="user-section-email">{email}</span>}
        </div>
      </div>
      {children && (
        <div className="user-section-actions">
          {children}
        </div>
      )}
    </div>
  )
}
