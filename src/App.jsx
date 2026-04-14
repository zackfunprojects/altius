import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useProfile } from './hooks/useProfile'
import RouteErrorBoundary from './components/ui/RouteErrorBoundary'
import NetworkStatus from './components/ui/NetworkStatus'
import AppShell from './components/AppShell'

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
      <div className="text-center">
        <p className="font-mono text-phosphor-green phosphor-glow text-sm italic">
          Preparing the trail...
        </p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
        <p className="font-mono text-phosphor-green phosphor-glow text-sm italic">
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

/**
 * Routes wrapped in the shared AppShell (ink nav bar, FourColorBar, elevation counter).
 * TrailView and OnboardingFlow opt out - they own their full-screen layouts.
 */
function ShellRoute({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
        <p className="font-mono text-phosphor-green phosphor-glow text-sm italic">
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
          {/* Onboarding: full-screen CRT, no shared shell */}
          <Route
            path="/onboarding"
            element={user ? <RouteErrorBoundary><OnboardingFlow /></RouteErrorBoundary> : <Navigate to="/auth" replace />}
          />
          {/* Trail View: full-screen terminal-dark, no shared shell */}
          <Route
            path="/trail"
            element={<ProtectedRoute><TrailView /></ProtectedRoute>}
          />

          {/* All other protected routes use the shared AppShell */}
          <Route path="/" element={<ShellRoute><LandingView /></ShellRoute>} />
          <Route path="/learn" element={<ShellRoute><LearningView /></ShellRoute>} />
          <Route path="/summit" element={<ShellRoute><SummitChallenge /></ShellRoute>} />
          <Route path="/notebook" element={<ShellRoute><TrekNotebookView /></ShellRoute>} />
          <Route path="/settings" element={<ShellRoute><SettingsView /></ShellRoute>} />
          <Route path="/expedition-log" element={<ShellRoute><ExpeditionLogView /></ShellRoute>} />
          <Route path="/chat" element={<ShellRoute><SherpaChat /></ShellRoute>} />

          <Route path="*" element={<NotFoundView />} />
        </Routes>
      </Suspense>
      </div>
    </>
  )
}
