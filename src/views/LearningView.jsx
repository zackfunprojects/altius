import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { useActiveTrek } from '../hooks/useActiveTrek'
import { useTrekJournal } from '../hooks/useTrekJournal'
import { useExerciseResponses } from '../hooks/useExerciseResponses'
import { completeSection } from '../lib/trek'
import { generateLesson } from '../lib/sherpa'
import { awardElevation, getElevationDelta } from '../lib/elevation'
import CoachingPanel from '../components/trek/CoachingPanel'
import FiresideMode from '../components/trek/FiresideMode'
import DifficultyBadge from '../components/brand/DifficultyBadge'
import SherpaTerminal from '../components/brand/SherpaTerminal'
import TrailMap from '../components/trek/TrailMap'
import LessonRenderer from '../components/trek/LessonRenderer'
import SherpaAside from '../components/trek/SherpaAside'
import PageTitle from '../components/ui/PageTitle'

export default function LearningView() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { trek, camps, currentSection, loading: trekLoading, refetch: refetchTrek } = useActiveTrek()

  // displayedSection tracks what the user is viewing (may differ from currentSection during review)
  const [displayedSection, setDisplayedSection] = useState(null)
  const [isReviewing, setIsReviewing] = useState(false)
  const [activeCamp, setActiveCamp] = useState(null)
  const [lessonContent, setLessonContent] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState(null)
  const [sherpaOpen, setSherpaOpen] = useState(false)
  const [coachingOpen, setCoachingOpen] = useState(false)
  const [firesideOpen, setFiresideOpen] = useState(false)
  const [journalOpen, setJournalOpen] = useState(false)
  const [journalText, setJournalText] = useState('')
  const [journalError, setJournalError] = useState(null)
  const [completing, setCompleting] = useState(false)
  const [completedExercises, setCompletedExercises] = useState(new Set())

  const { addNote } = useTrekJournal(trek?.id)
  const { responses: exerciseResponses, refetch: refetchExercises } = useExerciseResponses(displayedSection?.id)

  // Sync displayedSection with currentSection when not reviewing
  useEffect(() => {
    if (!isReviewing && currentSection) {
      setDisplayedSection(currentSection)
    }
  }, [currentSection, isReviewing])

  // Build completedExercises set from prior responses
  useEffect(() => {
    if (!exerciseResponses?.length) {
      setCompletedExercises(new Set())
      return
    }
    const passed = new Set()
    for (const r of exerciseResponses) {
      if (r.passed) passed.add(r.exercise_index)
    }
    setCompletedExercises(passed)
  }, [exerciseResponses])

  const handleExerciseComplete = useCallback(async ({ passed, attemptNumber, exerciseIndex }) => {
    if (!passed || !displayedSection || !trek) return
    setCompletedExercises(prev => {
      const next = new Set(prev)
      next.add(exerciseIndex ?? prev.size)
      return next
    })
    try {
      await awardElevation({
        userId: trek.user_id,
        delta: getElevationDelta('exercise_passed', { attemptNumber }),
        sourceType: 'exercise_passed',
        sourceId: displayedSection.id,
        trekId: trek.id,
      })
    } catch (err) {
      console.error('Failed to award exercise elevation:', err)
    }
    await refetchExercises()
  }, [displayedSection, trek, refetchExercises])

  // Find the active camp from the displayed section
  useEffect(() => {
    if (camps.length && displayedSection) {
      const camp = camps.find(c => c.id === displayedSection.camp_id)
      setActiveCamp(camp || null)
    }
  }, [camps, displayedSection])

  // Load lesson content when displayed section changes
  useEffect(() => {
    if (!displayedSection) {
      setLessonContent(null)
      return
    }

    if (displayedSection.content) {
      setLessonContent(displayedSection.content)
      return
    }

    // Content is null - generate on demand (only for active sections, not review)
    if (isReviewing) return

    let cancelled = false
    async function generate() {
      setGenerating(true)
      setGenError(null)
      try {
        const content = await generateLesson({
          sectionId: displayedSection.id,
        })
        if (!cancelled) {
          setLessonContent(content)
        }
      } catch (err) {
        if (!cancelled) setGenError(err.message)
      } finally {
        if (!cancelled) setGenerating(false)
      }
    }
    generate()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedSection?.id, isReviewing])

  const handleCompleteSection = useCallback(async () => {
    if (!displayedSection || completing || isReviewing) return
    setCompleting(true)
    try {
      await completeSection(displayedSection.id)
      setLessonContent(null)
      await refetchTrek()
    } catch (err) {
      console.error('Failed to complete section:', err)
    } finally {
      setCompleting(false)
    }
  }, [displayedSection, completing, isReviewing, refetchTrek])

  const handleJournalSubmit = useCallback(async () => {
    if (!journalText.trim() || !trek) return
    try {
      await addNote({
        body: journalText.trim(),
        sectionId: displayedSection?.id,
        campId: activeCamp?.id,
      })
      setJournalText('')
      setJournalOpen(false)
    } catch {
      setJournalError('Failed to save note. Please try again.')
    }
  }, [journalText, trek, displayedSection, activeCamp, addNote])

  // Navigate to section on Trail Map click
  const handleSectionClick = useCallback((section) => {
    if (section.status === 'locked') return

    if (section.id === currentSection?.id) {
      setIsReviewing(false)
      setDisplayedSection(currentSection)
      if (currentSection.content) {
        setLessonContent(currentSection.content)
      } else {
        setLessonContent(null)
      }
      return
    }

    if (section.status === 'completed' && section.content) {
      setIsReviewing(true)
      setDisplayedSection(section)
      setLessonContent(section.content)
    }
  }, [currentSection])

  const handleBackToActive = useCallback(() => {
    setIsReviewing(false)
    setDisplayedSection(currentSection)
    if (currentSection?.content) {
      setLessonContent(currentSection.content)
    } else {
      setLessonContent(null)
    }
  }, [currentSection])

  if (trekLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-mono text-trail-brown text-sm italic">Loading your trek...</p>
      </div>
    )
  }

  if (!trek) {
    navigate('/')
    return null
  }

  return (
    <>
      <PageTitle title="Learning" />

      {/* Breadcrumb bar */}
      <div className="px-4 sm:px-6 lg:px-12 py-3 border-b border-trail-brown/15">
        <p className="font-ui text-xs text-trail-brown">
          {activeCamp?.camp_name || 'Base Camp'}
          {displayedSection && (
            <> &rsaquo; {displayedSection.title}</>
          )}
        </p>
      </div>

      {/* Review mode banner */}
      {isReviewing && (
        <div className="bg-alpine-gold/10 border-b border-alpine-gold/20 px-4 sm:px-8 py-2 flex items-center justify-between">
          <p className="text-xs font-ui font-medium text-alpine-gold">
            Reviewing: {displayedSection?.title}
          </p>
          <button
            onClick={handleBackToActive}
            className="text-xs font-ui font-medium text-summit-cobalt hover:text-summit-cobalt/80 transition-colors"
          >
            Back to current section
          </button>
        </div>
      )}

      {/* Main content - two panel layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Trail Map panel */}
        <aside className="lg:w-72 xl:w-80 border-b lg:border-b-0 lg:border-r border-trail-brown/15 bg-cream-light/50 overflow-y-auto">
          <TrailMap
            camps={camps}
            currentSectionId={currentSection?.id}
            onSectionClick={handleSectionClick}
          />
        </aside>

        {/* Lesson panel */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
            {generating ? (
              <div className="max-w-[640px] mx-auto">
                <SherpaTerminal>
                  The Sherpa is preparing the next stretch of trail...
                </SherpaTerminal>
              </div>
            ) : genError ? (
              <div className="max-w-[640px] mx-auto space-y-4">
                <p className="font-body text-signal-orange">
                  Failed to generate lesson content.
                </p>
                <p className="font-body text-sm text-trail-brown">{genError}</p>
                <button
                  onClick={() => {
                    setGenError(null)
                    setLessonContent(null)
                    refetchTrek()
                  }}
                  className="px-4 py-2 bg-signal-orange text-catalog-cream font-ui font-medium rounded-lg text-sm hover:bg-signal-orange/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : lessonContent ? (
              <div className="max-w-[640px] mx-auto">
                <LessonRenderer
                  content={lessonContent}
                  section={displayedSection}
                  onComplete={isReviewing ? null : handleCompleteSection}
                  completing={completing}
                  onExerciseComplete={isReviewing ? null : handleExerciseComplete}
                  completedExercises={completedExercises}
                  exerciseResponses={exerciseResponses}
                />
              </div>
            ) : displayedSection ? (
              <div className="max-w-[640px] mx-auto">
                <SherpaTerminal>
                  Preparing your trail...
                </SherpaTerminal>
              </div>
            ) : (
              <div className="max-w-[640px] mx-auto text-center py-12">
                <h2 className="font-display text-2xl text-ink mb-2">All sections complete</h2>
                <p className="font-body text-trail-brown mb-2">
                  The summit challenge awaits.
                </p>
                {trek?.summit_challenge?.description && (
                  <p className="font-body text-sm text-trail-brown/70 mb-6 max-w-md mx-auto">
                    {trek.summit_challenge.description}
                  </p>
                )}
                <button
                  onClick={() => navigate('/summit')}
                  className="px-8 py-3 bg-summit-cobalt text-catalog-cream font-ui font-semibold rounded-lg hover:bg-summit-cobalt/90 transition-colors"
                >
                  Attempt Summit
                </button>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-trail-brown/15 bg-cream-light/50 px-4 sm:px-8 lg:px-12 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSherpaOpen(true)}
                className="px-3 py-1.5 text-sm font-ui font-medium text-summit-cobalt border border-summit-cobalt/30 rounded-md hover:bg-summit-cobalt/5 transition-colors"
              >
                Ask the Sherpa
              </button>
              <button
                onClick={() => setJournalOpen(!journalOpen)}
                className="px-3 py-1.5 text-sm font-ui font-medium text-trail-brown border border-trail-brown/30 rounded-md hover:bg-trail-brown/5 transition-colors"
                title="Take notes about what you're learning"
              >
                Journal
              </button>
              <button
                onClick={() => setCoachingOpen(true)}
                className="px-3 py-1.5 text-sm font-ui font-medium text-signal-orange border border-signal-orange/30 rounded-md hover:bg-signal-orange/5 transition-colors"
                title="Share your screen for live coaching feedback (Pro)"
              >
                Screen Coach
              </button>
              <button
                onClick={() => setFiresideOpen(true)}
                className="px-3 py-1.5 text-sm font-ui font-medium text-alpine-gold border border-alpine-gold/30 rounded-md hover:bg-alpine-gold/5 transition-colors"
                title="Talk to the Sherpa using voice"
              >
                Voice Chat
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Journal quick-entry */}
      {journalOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-catalog-cream border-t border-trail-brown/20 shadow-lg px-4 sm:px-8 py-4">
          <div className="max-w-2xl mx-auto">
            <label className="block text-xs font-ui font-medium text-trail-brown mb-1.5">
              Trail Journal
            </label>
            <textarea
              value={journalText}
              onChange={(e) => { setJournalText(e.target.value); setJournalError(null) }}
              placeholder="A quick note about what you're learning..."
              className="w-full h-20 px-4 py-3 font-body text-sm text-ink bg-cream-light border border-trail-brown/25 rounded-md resize-none focus:outline-none focus:border-summit-cobalt placeholder:font-body placeholder:font-light placeholder:italic placeholder:text-trail-brown/50"
              autoFocus
            />
            {journalError && (
              <p className="text-xs text-signal-orange mt-1">{journalError}</p>
            )}
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => { setJournalOpen(false); setJournalText('') }}
                className="px-3 py-1 text-xs font-body text-trail-brown hover:underline transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJournalSubmit}
                disabled={!journalText.trim()}
                className="px-3 py-1 text-xs font-ui font-medium bg-summit-cobalt text-catalog-cream rounded-md hover:bg-summit-cobalt/90 transition-colors disabled:opacity-50"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sherpa aside panel */}
      <SherpaAside
        open={sherpaOpen}
        onClose={() => setSherpaOpen(false)}
        section={displayedSection}
        trekId={trek?.id}
      />

      {/* OTS Coaching panel */}
      <CoachingPanel
        open={coachingOpen}
        onClose={() => setCoachingOpen(false)}
        trekId={trek?.id}
        subscriptionTier={profile?.subscription_tier}
      />

      {/* Fireside voice dialogue */}
      <FiresideMode
        open={firesideOpen}
        onClose={() => setFiresideOpen(false)}
        trekId={trek?.id}
        sectionId={displayedSection?.id}
      />
    </>
  )
}
