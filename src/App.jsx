import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AuthView from './views/AuthView'
import LandingView from './views/LandingView'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
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
        path="/"
        element={
          <ProtectedRoute>
            <LandingView />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
