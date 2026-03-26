import { Outlet, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../features/auth/hooks/useAuth'
import {
  Sidebar,
  SidebarHeader,
  SidebarNav,
  NavItem,
  SidebarFooter,
  SidebarUserSection,
  SidebarProvider,
  SidebarOverlay,
  MobileHeader,
  Layout as DSLayout,
  MainContent,
  Spinner,
} from '../design-system'
import { AppIcon, CompaniesIcon, PlansIcon, SettingsIcon } from './icons'
import { CompanySwitcher } from '../features/companies/components/CompanySwitcher'
import './Layout.css'

export function Layout() {
  const { t } = useTranslation()
  const { user, isLoading, logout } = useAuth()

  if (isLoading) {
    return (
      <div className="layout-loading">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="layout-loading layout-loading--redirect">
        <Spinner size="lg" />
        <p className="layout-loading__text">{t('common.redirectingToLogin')}</p>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <DSLayout>
        <MobileHeader logo={<AppIcon />} title="App Template" />
        <SidebarOverlay />

        <Sidebar>
          <SidebarHeader logo={<AppIcon />} title="App Template" />

          <CompanySwitcher />

          <SidebarNav>
            <NavItem as={NavLink} to="/companies" icon={<CompaniesIcon />}>
              {t('sidebar.companies')}
            </NavItem>
            <NavItem as={NavLink} to="/plans" icon={<PlansIcon />}>
              {t('sidebar.plans')}
            </NavItem>
            <NavItem as={NavLink} to="/settings" icon={<SettingsIcon />}>
              {t('sidebar.settings')}
            </NavItem>
          </SidebarNav>

          <SidebarUserSection
            name={user.name || 'User'}
            email={user.email}
            avatar={user.name?.charAt(0) || 'U'}
          />
          <SidebarFooter onLogout={logout} />
        </Sidebar>

        <MainContent>
          <Outlet />
        </MainContent>
      </DSLayout>
    </SidebarProvider>
  )
}
