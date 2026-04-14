import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import FourColorBar from '../components/brand/FourColorBar'
import WordMark from '../components/brand/WordMark'

const MIN_PASSWORD_LENGTH = 8
const RESEND_COOLDOWN_MS = 60_000

function validatePassword(pw) {
  if (pw.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  return null
}

function validateEmail(email) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
  return null
}

export default function AuthView() {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Email confirmation state
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(false)
  const lastSubmitRef = useRef(0)

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setError(null)

    // Debounce - prevent rapid resubmission
    const now = Date.now()
    if (now - lastSubmitRef.current < 2000) return
    lastSubmitRef.current = now

    // Client-side validation
    const emailError = validateEmail(email)
    if (emailError) { setError(emailError); return }

    if (isSignUp) {
      const pwError = validatePassword(password)
      if (pwError) { setError(pwError); return }
      if (!displayName.trim()) { setError('Display name is required.'); return }
    }

    setLoading(true)

    if (isSignUp) {
      const { data, error: signUpError } = await signUp(email, password, displayName.trim())

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      // Supabase returns user but no session when email confirmation is required
      if (data?.user && !data.session) {
        setAwaitingConfirmation(true)
        setLoading(false)
        return
      }

      // If email confirmation is disabled, user gets a session immediately
      setLoading(false)
    } else {
      const { error: signInError } = await signIn(email, password)

      if (signInError) {
        // Map common Supabase errors to friendlier messages
        if (signInError.message?.includes('Invalid login credentials')) {
          setError('Incorrect email or password.')
        } else if (signInError.message?.includes('Email not confirmed')) {
          setAwaitingConfirmation(true)
        } else {
          setError(signInError.message)
        }
      }
      setLoading(false)
    }
  }, [email, password, displayName, isSignUp, signUp, signIn])

  const handleResendConfirmation = useCallback(async () => {
    if (resendCooldown || !email) return
    setError(null)

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
    })

    if (resendError) {
      setError(resendError.message)
    } else {
      setResendCooldown(true)
      setTimeout(() => setResendCooldown(false), RESEND_COOLDOWN_MS)
    }
  }, [email, resendCooldown])

  // Confirmation waiting screen
  if (awaitingConfirmation) {
    return (
      <div className="min-h-screen bg-catalog-cream flex flex-col">
        <FourColorBar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm text-center">
            <WordMark size="lg" />
            <div className="mt-8 space-y-4">
              <h2 className="font-display text-2xl text-ink">Check your email</h2>
              <p className="font-body text-trail-brown leading-relaxed">
                We sent a confirmation link to <strong className="text-ink">{email}</strong>. Click the link to activate your account, then return here to sign in.
              </p>

              {error && (
                <p className="text-signal-orange text-sm font-ui">{error}</p>
              )}

              <button
                onClick={handleResendConfirmation}
                disabled={resendCooldown}
                className="w-full py-2.5 border border-summit-cobalt/30 text-summit-cobalt font-ui font-semibold rounded-md hover:bg-summit-cobalt/5 transition-colors disabled:opacity-50"
              >
                {resendCooldown ? 'Email sent - check your inbox' : 'Resend confirmation email'}
              </button>

              <button
                onClick={() => {
                  setAwaitingConfirmation(false)
                  setIsSignUp(false)
                  setError(null)
                }}
                className="w-full py-2.5 bg-summit-cobalt text-white font-ui font-semibold rounded-md hover:bg-summit-cobalt/90 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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
            <p className="mt-2 font-body text-trail-brown/70 text-sm max-w-xs mx-auto leading-relaxed">
              Tell an AI guide what you want to learn. It builds a personalized curriculum, teaches interactively, and verifies mastery.
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
                  onChange={(e) => { setDisplayName(e.target.value); setError(null) }}
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
                onChange={(e) => { setEmail(e.target.value); setError(null) }}
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
                onChange={(e) => { setPassword(e.target.value); setError(null) }}
                className="w-full px-3 py-2 border border-trail-brown/30 rounded-md bg-white font-body text-ink focus:outline-none focus:ring-2 focus:ring-summit-cobalt/50"
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                minLength={MIN_PASSWORD_LENGTH}
                required
              />
              {isSignUp && password.length > 0 && password.length < MIN_PASSWORD_LENGTH && (
                <p className="text-xs font-ui text-trail-brown/60 mt-1">
                  {MIN_PASSWORD_LENGTH - password.length} more character{MIN_PASSWORD_LENGTH - password.length !== 1 ? 's' : ''} needed
                </p>
              )}
            </div>

            {!isSignUp && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => navigate('/reset-password')}
                  className="text-xs font-ui text-summit-cobalt hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

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
