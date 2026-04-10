import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import FourColorBar from '../components/brand/FourColorBar'
import WordMark from '../components/brand/WordMark'

export default function AuthView() {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = isSignUp
      ? await signUp(email, password, displayName)
      : await signIn(email, password)

    if (result.error) {
      setError(result.error.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-catalog-cream flex flex-col">
      <FourColorBar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <WordMark size="lg" />
            <p className="mt-3 font-body text-trail-brown text-lg">
              Everything worth knowing is uphill.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-ui font-medium text-ink mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-trail-brown/30 rounded-md bg-white font-body text-ink focus:outline-none focus:ring-2 focus:ring-summit-cobalt/50"
                  placeholder="Your name on the mountain"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-ui font-medium text-ink mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-trail-brown/30 rounded-md bg-white font-body text-ink focus:outline-none focus:ring-2 focus:ring-summit-cobalt/50"
                placeholder="climber@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-ui font-medium text-ink mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-trail-brown/30 rounded-md bg-white font-body text-ink focus:outline-none focus:ring-2 focus:ring-summit-cobalt/50"
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </div>

            {error && (
              <p className="text-signal-orange text-sm font-ui">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-signal-orange text-white font-ui font-semibold rounded-md hover:bg-signal-orange/90 transition-colors disabled:opacity-50"
            >
              {loading
                ? 'Loading...'
                : isSignUp
                  ? 'Begin the Climb'
                  : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-ui text-trail-brown">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
              }}
              className="text-summit-cobalt font-semibold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
