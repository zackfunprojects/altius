import { useEffect, useState } from 'react'

export default function DemonstrationBlock({ spec }) {
  const [currentStep, setCurrentStep] = useState(0)
  const steps = spec?.steps || []

  // Clamp currentStep if steps array changes
  useEffect(() => {
    if (steps.length > 0 && currentStep >= steps.length) {
      setCurrentStep(steps.length - 1)
    }
  }, [steps.length, currentStep])

  if (!steps.length) return null

  const step = steps[currentStep]
  const isLast = currentStep === steps.length - 1
  const isFirst = currentStep === 0

  return (
    <div className="bg-white rounded-lg border border-trail-brown/15 overflow-hidden">
      {spec?.title && (
        <div className="px-5 pt-4 pb-2">
          <h3 className="font-display text-lg text-ink">{spec.title}</h3>
          <p className="text-xs font-ui text-trail-brown mt-1">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
      )}
      <div className="px-5 py-4">
        <div className="bg-catalog-cream rounded-md p-4">
          <p className="font-ui font-medium text-sm text-ink mb-2">
            {step.instruction}
          </p>
          {step.explanation && (
            <p className="font-body text-sm text-trail-brown italic">
              {step.explanation}
            </p>
          )}
        </div>
      </div>
      <div className="px-5 pb-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(prev => prev - 1)}
          disabled={isFirst}
          className="text-xs font-ui font-medium text-trail-brown hover:text-ink transition-colors disabled:opacity-30"
        >
          Previous
        </button>
        {/* Step indicators */}
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === currentStep ? 'bg-summit-cobalt' : i < currentStep ? 'bg-phosphor-green' : 'bg-trail-brown/20'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setCurrentStep(prev => prev + 1)}
          disabled={isLast}
          className="text-xs font-ui font-medium text-summit-cobalt hover:text-summit-cobalt/80 transition-colors disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  )
}
