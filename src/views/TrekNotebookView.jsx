import { useNavigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { useTrekNotebook } from '../hooks/useTrekNotebook'
import FourColorBar from '../components/brand/FourColorBar'
import WordMark from '../components/brand/WordMark'
import ElevationCounter from '../components/brand/ElevationCounter'
import SherpaTerminal from '../components/brand/SherpaTerminal'
import SummitCard from '../components/summit/SummitCard'

export default function TrekNotebookView() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { entries, loading } = useTrekNotebook()

  return (
    <div className="min-h-screen bg-catalog-cream flex flex-col">
      <FourColorBar />

      {/* Header */}
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

      {/* Title */}
      <div className="text-center px-4 sm:px-6 pt-8 pb-4">
        <h1 className="font-display text-3xl sm:text-4xl text-ink mb-2">Trek Notebook</h1>
        <p className="font-body text-trail-brown">
          {entries.length > 0
            ? `${entries.length} skill${entries.length === 1 ? '' : 's'} mastered`
            : 'Your portfolio of mastered skills'}
        </p>
      </div>

      {/* Content */}
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="text-center py-12">
            <p className="font-mono text-trail-brown text-sm">Loading notebook...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="max-w-md mx-auto py-8">
            <SherpaTerminal>
              {'>'} No summits yet. The notebook waits for your first skill.{'\n'}
              {'>'} Complete a trek to earn your first entry.
            </SherpaTerminal>
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2.5 bg-summit-cobalt text-white font-ui font-semibold rounded-lg hover:bg-summit-cobalt/90 transition-colors text-sm"
              >
                Start a Trek
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {entries.map((entry, i) => (
              <SummitCard key={entry.id} entry={entry} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
