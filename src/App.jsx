import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useProfile } from './hooks/useProfile'
import AuthView from './views/AuthView'
import LandingView from './views/LandingView'
import LearningView from './views/LearningView'
import SherpaChat from './views/SherpaChat'
import TrailView from './views/TrailView'
import OnboardingFlow from './views/OnboardingFlow'

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

  // If the user hasn't completed onboarding, redirect there
  if (profile && !profile.expedition_origin) {
    return <Navigate to="/onboarding" replace />
  }

  return children
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
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to="/" replace /> : <AuthView />}
      />
      <Route
        path="/onboarding"
        element={user ? <OnboardingFlow /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <LandingView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learn"
        element={
          <ProtectedRoute>
            <LearningView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trail"
        element={
          <ProtectedRoute>
            <TrailView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <SherpaChat />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
