import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './features/auth/hooks/useAuth'
import { CompanyProvider } from './features/companies/hooks/useCompany'
import { Layout } from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initAnalytics } from './services/analytics'
import { Spinner } from './design-system'
import { PageTracker } from './components/PageTracker'

const Plans = lazy(() => import('./features/plans/pages/Plans').then(m => ({ default: m.Plans })))
const AuthCallback = lazy(() => import('./features/auth/pages/AuthCallback').then(m => ({ default: m.AuthCallback })))
const Companies = lazy(() => import('./features/companies/pages/Companies').then(m => ({ default: m.Companies })))
const CompanyMembers = lazy(() => import('./features/companies/pages/CompanyMembers').then(m => ({ default: m.CompanyMembers })))
const Settings = lazy(() => import('./features/settings/pages/Settings').then(m => ({ default: m.Settings })))
const InviteAccept = lazy(() => import('./features/auth/pages/InviteAccept').then(m => ({ default: m.InviteAccept })))

function SuspenseFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spinner size="lg" />
    </div>
  )
}

function App() {
  useEffect(() => {
    initAnalytics()
  }, [])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <PageTracker />
        <Suspense fallback={<SuspenseFallback />}>
          <Routes>
            <Route path="/*" element={
              <AuthProvider>
                <CompanyProvider>
                  <Routes>
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/invite/:token" element={<InviteAccept />} />

                    <Route path="/" element={<Layout />}>
                      <Route index element={<Navigate to="/companies" replace />} />
                      <Route path="companies" element={<Companies />} />
                      <Route path="companies/:id" element={<CompanyMembers />} />
                      <Route path="plans" element={<Plans />} />
                      <Route path="settings" element={<Settings />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </CompanyProvider>
              </AuthProvider>
            } />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
