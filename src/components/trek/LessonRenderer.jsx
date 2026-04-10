import { useMemo } from 'react'
import SherpaTextBlock from './blocks/SherpaTextBlock'
import TrailSketchBlock from './blocks/TrailSketchBlock'
import DemonstrationBlock from './blocks/DemonstrationBlock'
import GuidedAnalysisBlock from './blocks/GuidedAnalysisBlock'
import ToolRecBlock from './blocks/ToolRecBlock'
import ReflectionBlock from './blocks/ReflectionBlock'
import ParallelRouteBlock from './blocks/ParallelRouteBlock'
import BranchingScenarioBlock from './blocks/BranchingScenarioBlock'
import ExerciseWrapper from '../exercises/ExerciseWrapper'

function renderBlock(block, index, { exerciseCounter, sectionId, trekId, onExerciseComplete, exerciseResponses }) {
  switch (block.type) {
    case 'sherpa_text':
      return <SherpaTextBlock key={index} content={block.content} />

    case 'trail_sketch':
      return <TrailSketchBlock key={index} spec={block.spec} />

    case 'demonstration':
      return <DemonstrationBlock key={index} spec={block.spec} />

    case 'guided_analysis':
      return <GuidedAnalysisBlock key={index} spec={block.spec} />

    case 'exercise': {
      const exerciseIndex = exerciseCounter.current++
      const priorResponses = (exerciseResponses || []).filter(
        r => r.exercise_index === exerciseIndex
      )
      return (
        <ExerciseWrapper
          key={`exercise-${index}`}
          spec={block.spec}
          exerciseIndex={exerciseIndex}
          sectionId={sectionId}
          trekId={trekId}
          onExerciseComplete={onExerciseComplete}
          priorResponses={priorResponses}
        />
      )
    }

    case 'tool_recommendation':
      return <ToolRecBlock key={index} spec={block.spec} />

    case 'reflection_prompt':
      return <ReflectionBlock key={index} prompt={block.prompt} />

    case 'parallel_route':
      return <ParallelRouteBlock key={index} spec={block.spec} />

    case 'branching_scenario':
      return <BranchingScenarioBlock key={index} spec={block.spec} />

    default:
      if (block.content) {
        return <SherpaTextBlock key={index} content={block.content} />
      }
      return null
  }
}

export default function LessonRenderer({ content, section, onComplete, completing, onExerciseComplete, completedExercises, exerciseResponses }) {
  const narrative = useMemo(() => content?.narrative || [], [content])

  // Exercise types that are fully implemented and can gate progression
  const GRADABLE_TYPES = new Set([
    'multiple_choice', 'short_answer', 'writing_prompt', 'drag_sequence',
    'code_editor', 'timeline_editor', 'canvas_layout', 'conversation_sim',
  ])

  // Count only gradable exercises (exclude deferred shell types)
  const totalExercises = useMemo(
    () => narrative.filter(b =>
      b.type === 'exercise' && GRADABLE_TYPES.has(b.spec?.exercise_type)
    ).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [narrative]
  )

  const completedCount = completedExercises?.size || 0
  const allExercisesDone = totalExercises === 0 || completedCount >= totalExercises
  const exerciseCounter = { current: 0 }

  if (!narrative.length) {
    return (
      <div className="text-center py-8">
        <p className="font-body text-trail-brown">No content available for this section.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Section header */}
      {section && (
        <div className="mb-6">
          <h2 className="font-display text-2xl text-ink">{section.title}</h2>
          {content.estimated_minutes && (
            <p className="text-xs font-ui text-trail-brown mt-1">
              ~{content.estimated_minutes} min
            </p>
          )}
        </div>
      )}

      {/* Content blocks */}
      <div className="space-y-5">
        {narrative.map((block, i) =>
          renderBlock(block, i, {
            exerciseCounter,
            sectionId: section?.id,
            trekId: section?.trek_id,
            onExerciseComplete,
            completedExercises,
            exerciseResponses,
          })
        )}
      </div>

      {/* Section complete button */}
      {onComplete && (
        <div className="mt-8 pt-6 border-t border-trail-brown/15">
          {!allExercisesDone && (
            <p className="text-xs font-ui text-signal-orange mb-3">
              Complete all exercises before advancing ({completedCount}/{totalExercises})
            </p>
          )}
          <div className="flex justify-end">
            <button
              onClick={onComplete}
              disabled={completing || !allExercisesDone}
              className="px-6 py-2.5 bg-summit-cobalt text-white font-ui font-semibold rounded-lg hover:bg-summit-cobalt/90 transition-colors disabled:opacity-50"
            >
              {completing ? 'Marking complete...' : 'Continue to Next Section'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
