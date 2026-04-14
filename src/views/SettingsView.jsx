import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { getExpeditionDay } from '../lib/expedition'
import { createCheckoutSession, getSubscriptionStatus } from '../lib/stripe'
import FourColorBar from '../components/brand/FourColorBar'
import WordMark from '../components/brand/WordMark'
import ElevationCounter from '../components/brand/ElevationCounter'
import PageTitle from '../components/ui/PageTitle'

export default function SettingsView() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { profile, updateProfile } = useProfile()

  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeError, setUpgradeError] = useState(null)

  const sub = getSubscriptionStatus(profile)
  const expeditionDay = getExpeditionDay(profile?.created_at)

  // Check for upgrade success from Stripe redirect
  const upgraded = new URLSearchParams(window.location.search).get('upgraded')

  const handleSaveProfile = useCallback(async () => {
    if (saving) return
    setSaving(true)
    setSaveMsg(null)
    try {
      await updateProfile({ display_name: displayName.trim() })
      setSaveMsg('Saved.')
    } catch {
      setSaveMsg('Failed to save.')
    } finally {
      setSaving(false)
    }
  }, [displayName, saving, updateProfile])

  const handleUpgrade = useCallback(async () => {
    if (upgrading) return
    setUpgrading(true)
    setUpgradeError(null)
    try {
      const url = await createCheckoutSession()
      window.location.href = url
    } catch (err) {
      setUpgradeError(err.message || 'Failed to start checkout.')
      setUpgrading(false)
    }
  }, [upgrading])

  const handleSignOut = useCallback(async () => {
    const { error: signOutError } = await signOut()
    if (!signOutError) {
      navigate('/auth')
    }
  }, [signOut, navigate])

  return (
    <div className="min-h-screen bg-catalog-cream flex flex-col">
      <PageTitle title="Settings" />
      <FourColorBar />

      <header className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-trail-brown/20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-sm font-ui text-trail-brown hover:text-ink transition-colors"
          >
            &larr; Home
          </button>
          <WordMark size="sm" />
        </div>
        <ElevationCounter elevation={profile?.current_elevation || 0} />
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8 max-w-lg mx-auto w-full space-y-8">
        <h1 className="font-display text-3xl text-ink">Settings</h1>

        {/* Upgrade success banner */}
        {upgraded && (
          <div className="p-4 bg-phosphor-green/10 border border-phosphor-green/30 rounded-lg">
            <p className="font-ui text-sm text-ink font-medium">
              Welcome to Pro. All features are now unlocked.
            </p>
          </div>
        )}

        {/* Profile */}
        <section className="space-y-4">
          <h2 className="font-display text-xl text-ink">Profile</h2>

          <div>
            <label className="block text-sm font-ui font-medium text-ink mb-1">Email</label>
            <p className="text-sm font-mono text-trail-brown">{user?.email || '-'}</p>
          </div>

          <div>
            <label className="block text-sm font-ui font-medium text-ink mb-1">Display Name</label>
            <div className="flex gap-2">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 px-3 py-2 border border-trail-brown/20 rounded-lg font-body text-sm text-ink bg-white focus:outline-none focus:border-summit-cobalt/50"
              />
              <button
                onClick={handleSaveProfile}
                disabled={saving || displayName.trim() === (profile?.display_name || '')}
                className="px-4 py-2 bg-summit-cobalt text-white font-ui text-sm font-semibold rounded-lg hover:bg-summit-cobalt/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
            {saveMsg && <p className="text-xs font-ui text-trail-brown mt-1">{saveMsg}</p>}
          </div>
        </section>

        {/* Subscription */}
        <section className="space-y-4">
          <h2 className="font-display text-xl text-ink">Subscription</h2>

          <div className="p-4 border border-trail-brown/15 rounded-lg bg-white/50">
            <div className="flex items-center justify-between mb-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-ui font-bold ${
                sub.tier === 'pro'
                  ? 'bg-phosphor-green/15 text-phosphor-green border border-phosphor-green/30'
                  : 'bg-trail-brown/10 text-trail-brown border border-trail-brown/20'
              }`}>
                {sub.label}
              </span>
            </div>

            {sub.tier === 'free' ? (
              <div className="space-y-3">
                <p className="font-body text-sm text-trail-brown">
                  Free tier: 1 active trek, Day Hike difficulty, 3 notebook entries.
                </p>
                <ul className="text-xs font-ui text-trail-brown/70 space-y-1">
                  <li>- Unlimited treks and all difficulties</li>
                  <li>- Over-the-Shoulder coaching</li>
                  <li>- Skill Refresh for completed treks</li>
                  <li>- Unlimited notebook entries</li>
                </ul>
                {upgradeError && (
                  <p className="text-xs text-signal-orange">{upgradeError}</p>
                )}
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="w-full py-2.5 bg-summit-cobalt text-white font-ui font-semibold rounded-lg hover:bg-summit-cobalt/90 transition-colors disabled:opacity-50"
                >
                  {upgrading ? 'Starting checkout...' : 'Upgrade to Pro'}
                </button>
              </div>
            ) : (
              <p className="font-body text-sm text-trail-brown">
                All features unlocked. Thank you for supporting Altius.
              </p>
            )}
          </div>
        </section>

        {/* Expedition stats */}
        <section className="space-y-4">
          <h2 className="font-display text-xl text-ink">Expedition</h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white/50 rounded-lg border border-trail-brown/10">
              <p className="font-mono text-lg text-phosphor-green font-bold">
                {profile?.current_elevation?.toLocaleString() || 0}
              </p>
              <p className="text-xs font-ui text-trail-brown/60">ft elevation</p>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg border border-trail-brown/10">
              <p className="font-mono text-lg text-ink font-bold">
                {profile?.total_treks_completed || 0}
              </p>
              <p className="text-xs font-ui text-trail-brown/60">treks completed</p>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg border border-trail-brown/10">
              <p className="font-mono text-lg text-ink font-bold">
                {expeditionDay}
              </p>
              <p className="text-xs font-ui text-trail-brown/60">expedition day</p>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section className="space-y-3">
          <button
            onClick={() => navigate('/expedition-log')}
            className="w-full text-left px-4 py-3 border border-trail-brown/15 rounded-lg hover:bg-white/50 transition-colors"
          >
            <span className="font-ui text-sm text-ink">Expedition Log</span>
            <span className="block text-xs font-ui text-trail-brown/60">View your complete journey</span>
          </button>
          <button
            onClick={() => navigate('/notebook')}
            className="w-full text-left px-4 py-3 border border-trail-brown/15 rounded-lg hover:bg-white/50 transition-colors"
          >
            <span className="font-ui text-sm text-ink">Trek Notebook</span>
            <span className="block text-xs font-ui text-trail-brown/60">Portfolio of mastered skills</span>
          </button>
        </section>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full py-2.5 border border-signal-orange/30 text-signal-orange font-ui text-sm rounded-lg hover:bg-signal-orange/5 transition-colors"
        >
          Sign Out
        </button>
      </main>
    </div>
  )
}
