import { useAuth } from '../context/AuthContext'
import FourColorBar from '../components/brand/FourColorBar'
import WordMark from '../components/brand/WordMark'
import ElevationCounter from '../components/brand/ElevationCounter'

export default function LandingView() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-catalog-cream flex flex-col">
      <FourColorBar />
      <header className="px-6 py-4 flex items-center justify-between border-b border-trail-brown/20">
        <WordMark size="sm" />
        <div className="flex items-center gap-4">
          <ElevationCounter elevation={0} />
          <button
            onClick={signOut}
            className="text-sm font-ui text-trail-brown hover:text-ink transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-lg">
          <h1 className="text-4xl text-ink mb-4">
            Welcome, Climber
          </h1>
          <p className="font-body text-lg text-trail-brown mb-8">
            The mountain is waiting. Tell the Sherpa what you want to learn,
            and the expedition begins.
          </p>
          <div className="bg-terminal-dark rounded-lg p-6 crt-scanlines crt-vignette">
            <p className="font-mono text-phosphor-green phosphor-glow text-sm leading-relaxed">
              {'>'} The Sherpa is ready. Onboarding and trek creation
              are coming in Phase 3.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
