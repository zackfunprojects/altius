import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useProfile } from './hooks/useProfile'
import RouteErrorBoundary from './components/ui/RouteErrorBoundary'
import NetworkStatus from './components/ui/NetworkStatus'

// Eager-load auth views (first paint)
import AuthView from './views/AuthView'
import ResetPasswordView from './views/ResetPasswordView'
import NotFoundView from './views/NotFoundView'

// Lazy-load all protected views (code splitting)
const OnboardingFlow = lazy(() => import('./views/OnboardingFlow'))
const LandingView = lazy(() => import('./views/LandingView'))
const LearningView = lazy(() => import('./views/LearningView'))
const TrailView = lazy(() => import('./views/TrailView'))
const SummitChallenge = lazy(() => import('./views/SummitChallenge'))
const TrekNotebookView = lazy(() => import('./views/TrekNotebookView'))
const SettingsView = lazy(() => import('./views/SettingsView'))
const ExpeditionLogView = lazy(() => import('./views/ExpeditionLogView'))
const SherpaChat = lazy(() => import('./views/SherpaChat'))

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
      <p className="font-mono text-phosphor-green phosphor-glow text-lg">
        Loading...
      </p>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
        <p className="font-mono text-phosphor-green phosphor-glow text-lg">
          Checking elevation...
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (profile && !profile.expedition_origin) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <RouteErrorBoundary>
      {children}
    </RouteErrorBoundary>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
        <p className="font-mono text-phosphor-green phosphor-glow text-lg">
          Preparing base camp...
        </p>
      </div>
    )
  }

  return (
    <>
      <NetworkStatus />
      <div id="main-content">
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route
            path="/auth"
            element={user ? <Navigate to="/" replace /> : <AuthView />}
          />
          <Route
            path="/reset-password"
            element={<ResetPasswordView />}
          />
          <Route
            path="/onboarding"
            element={user ? <RouteErrorBoundary><OnboardingFlow /></RouteErrorBoundary> : <Navigate to="/auth" replace />}
          />
          <Route
            path="/"
            element={<ProtectedRoute><LandingView /></ProtectedRoute>}
          />
          <Route
            path="/learn"
            element={<ProtectedRoute><LearningView /></ProtectedRoute>}
          />
          <Route
            path="/trail"
            element={<ProtectedRoute><TrailView /></ProtectedRoute>}
          />
          <Route
            path="/summit"
            element={<ProtectedRoute><SummitChallenge /></ProtectedRoute>}
          />
          <Route
            path="/notebook"
            element={<ProtectedRoute><TrekNotebookView /></ProtectedRoute>}
          />
          <Route
            path="/settings"
            element={<ProtectedRoute><SettingsView /></ProtectedRoute>}
          />
          <Route
            path="/expedition-log"
            element={<ProtectedRoute><ExpeditionLogView /></ProtectedRoute>}
          />
          <Route
            path="/chat"
            element={<ProtectedRoute><SherpaChat /></ProtectedRoute>}
          />
          <Route path="*" element={<NotFoundView />} />
        </Routes>
      </Suspense>
      </div>
    </>
  )
}
