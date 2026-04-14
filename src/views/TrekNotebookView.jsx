import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { useTrekNotebook } from '../hooks/useTrekNotebook'
import SherpaTerminal from '../components/brand/SherpaTerminal'
import SummitCard from '../components/summit/SummitCard'
import SkillRefresh from '../components/summit/SkillRefresh'
import PageTitle from '../components/ui/PageTitle'

export default function TrekNotebookView() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { entries, loading, error } = useTrekNotebook()
  const [refreshingEntry, setRefreshingEntry] = useState(null)

  return (
    <>
      <PageTitle title="Trek Notebook" />

      {/* Title */}
      <div className="text-center px-4 sm:px-6 pt-8 pb-4">
        <h1 className="font-display text-4xl text-ink mb-2">Trek Notebook</h1>
        <p className="font-body text-trail-brown">
          {entries.length > 0
            ? `${entries.length} skill${entries.length === 1 ? '' : 's'} mastered`
            : 'Your portfolio of mastered skills'}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-6 py-6 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="text-center py-12">
            <p className="font-mono text-trail-brown text-sm italic">Loading notebook...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="font-body text-signal-orange">Could not load your notebook.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-signal-orange text-catalog-cream font-ui font-semibold rounded-lg hover:bg-signal-orange/90 transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="max-w-md mx-auto py-8">
            <SherpaTerminal>
              The notebook is empty. Your first summit will be recorded here.
            </SherpaTerminal>
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2.5 bg-summit-cobalt text-catalog-cream font-ui font-semibold rounded-lg hover:bg-summit-cobalt/90 transition-colors text-sm"
              >
                Start a Trek
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {entries.map((entry, i) => (
              <div key={entry.id}>
                <SummitCard entry={entry} index={i} onRefresh={() => setRefreshingEntry(entry)} />
                {refreshingEntry?.id === entry.id && (
                  <div className="mt-3 bg-cream-light rounded-lg border border-trail-brown/15">
                    <SkillRefresh
                      entry={entry}
                      onClose={() => setRefreshingEntry(null)}
                      subscriptionTier={profile?.subscription_tier}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
