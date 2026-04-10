import SherpaTextBlock from './blocks/SherpaTextBlock'
import TrailSketchBlock from './blocks/TrailSketchBlock'
import DemonstrationBlock from './blocks/DemonstrationBlock'
import GuidedAnalysisBlock from './blocks/GuidedAnalysisBlock'
import ExerciseBlock from './blocks/ExerciseBlock'
import ToolRecBlock from './blocks/ToolRecBlock'
import ReflectionBlock from './blocks/ReflectionBlock'

function renderBlock(block, index, onExerciseComplete) {
  switch (block.type) {
    case 'sherpa_text':
      return <SherpaTextBlock key={index} content={block.content} />

    case 'trail_sketch':
      return <TrailSketchBlock key={index} spec={block.spec} />

    case 'demonstration':
      return <DemonstrationBlock key={index} spec={block.spec} />

    case 'guided_analysis':
      return <GuidedAnalysisBlock key={index} spec={block.spec} />

    case 'exercise':
      return (
        <ExerciseBlock
          key={index}
          spec={block.spec}
          onExerciseComplete={onExerciseComplete}
        />
      )

    case 'tool_recommendation':
      return <ToolRecBlock key={index} spec={block.spec} />

    case 'reflection_prompt':
      return <ReflectionBlock key={index} prompt={block.prompt} />

    default:
      // Unknown block type - render as sherpa text if it has content
      if (block.content) {
        return <SherpaTextBlock key={index} content={block.content} />
      }
      return null
  }
}

export default function LessonRenderer({ content, section, onComplete, completing }) {
  const narrative = content?.narrative || []

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
        {narrative.map((block, i) => renderBlock(block, i, null))}
      </div>

      {/* Section complete button */}
      {onComplete && (
        <div className="mt-8 pt-6 border-t border-trail-brown/15 flex justify-end">
          <button
            onClick={onComplete}
            disabled={completing}
            className="px-6 py-2.5 bg-summit-cobalt text-white font-ui font-semibold rounded-lg hover:bg-summit-cobalt/90 transition-colors disabled:opacity-50"
          >
            {completing ? 'Marking complete...' : 'Continue to Next Section'}
          </button>
        </div>
      )}
    </div>
  )
}
