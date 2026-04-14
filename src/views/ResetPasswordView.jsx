import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { sanitizeErrorMessage } from '../lib/sanitize'
import FourColorBar from '../components/brand/FourColorBar'
import WordMark from '../components/brand/WordMark'
import PageTitle from '../components/ui/PageTitle'

export default function ResetPasswordView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isUpdateMode = searchParams.get('type') === 'recovery'

  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [updated, setUpdated] = useState(false)
  const [error, setError] = useState(null)

  // Listen for recovery token from email link
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User arrived via password reset link - show new password form
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleRequestReset = useCallback(async (e) => {
    e.preventDefault()
    if (!email.trim() || loading) return
    setLoading(true)
    setError(null)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password?type=recovery`,
    })

    if (resetError) {
      setError(sanitizeErrorMessage(resetError))
    } else {
      setSent(true)
    }
    setLoading(false)
  }, [email, loading])

  const handleUpdatePassword = useCallback(async (e) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 8 || loading) return
    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      setError(sanitizeErrorMessage(updateError))
    } else {
      setUpdated(true)
    }
    setLoading(false)
  }, [newPassword, loading])

  return (
    <div className="min-h-screen bg-catalog-cream flex flex-col">
      <PageTitle title="Reset Password" />
      <FourColorBar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <WordMark size="lg" />

          {updated ? (
            <div className="mt-8 space-y-4">
              <h2 className="font-display text-2xl text-ink">Password updated</h2>
              <p className="font-body text-trail-brown">You can now sign in with your new password.</p>
              <button
                onClick={() => navigate('/auth')}
                className="w-full py-2.5 bg-summit-cobalt text-white font-ui font-semibold rounded-md hover:bg-summit-cobalt/90 transition-colors"
              >
                Sign In
              </button>
            </div>
          ) : isUpdateMode ? (
            <form onSubmit={handleUpdatePassword} className="mt-8 space-y-4 text-left">
              <h2 className="font-display text-2xl text-ink text-center">Set new password</h2>
              <div>
                <label htmlFor="new-password" className="block text-sm font-ui font-medium text-ink mb-1">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(null) }}
                  className="w-full px-3 py-2 border border-trail-brown/30 rounded-md bg-white font-body text-ink focus:outline-none focus:ring-2 focus:ring-summit-cobalt/50"
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                />
              </div>
              {error && <p className="text-signal-orange text-sm font-ui">{error}</p>}
              <button
                type="submit"
                disabled={loading || newPassword.length < 8}
                className="w-full py-2.5 bg-signal-orange text-white font-ui font-semibold rounded-md hover:bg-signal-orange/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          ) : sent ? (
            <div className="mt-8 space-y-4">
              <h2 className="font-display text-2xl text-ink">Check your email</h2>
              <p className="font-body text-trail-brown">
                We sent a password reset link to <strong className="text-ink">{email}</strong>.
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="w-full py-2.5 bg-summit-cobalt text-white font-ui font-semibold rounded-md hover:bg-summit-cobalt/90 transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleRequestReset} className="mt-8 space-y-4 text-left">
              <h2 className="font-display text-2xl text-ink text-center">Reset password</h2>
              <p className="font-body text-sm text-trail-brown text-center">
                Enter your email and we will send a reset link.
              </p>
              <div>
                <label htmlFor="reset-email" className="block text-sm font-ui font-medium text-ink mb-1">Email</label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null) }}
                  className="w-full px-3 py-2 border border-trail-brown/30 rounded-md bg-white font-body text-ink focus:outline-none focus:ring-2 focus:ring-summit-cobalt/50"
                  placeholder="climber@example.com"
                  required
                />
              </div>
              {error && <p className="text-signal-orange text-sm font-ui">{error}</p>}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-2.5 bg-signal-orange text-white font-ui font-semibold rounded-md hover:bg-signal-orange/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="w-full py-2 text-sm font-ui text-trail-brown hover:text-ink transition-colors"
              >
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
