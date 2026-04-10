import { useState } from 'react'

export default function BranchingScenarioBlock({ spec }) {
  const [history, setHistory] = useState([])
  const [currentScenario, setCurrentScenario] = useState(spec)
  const [ended, setEnded] = useState(false)

  if (!spec) return null

  const handleChoice = (choice) => {
    setHistory(prev => [...prev, {
      scenario: currentScenario.scenario_text,
      choice: choice.text,
      consequence: choice.consequence,
    }])

    if (choice.next_scenario) {
      setCurrentScenario(choice.next_scenario)
    } else {
      setEnded(true)
    }
  }

  const handleRestart = () => {
    setHistory([])
    setCurrentScenario(spec)
    setEnded(false)
  }

  return (
    <div className="bg-white rounded-lg border border-summit-cobalt/20 overflow-hidden">
      <div className="bg-summit-cobalt/5 px-5 py-3 border-b border-summit-cobalt/10">
        <p className="text-xs font-ui font-medium text-summit-cobalt uppercase tracking-wider">
          Branching Scenario
        </p>
      </div>

      {/* History of prior choices */}
      {history.length > 0 && (
        <div className="px-5 pt-4 space-y-3">
          {history.map((entry, i) => (
            <div key={i} className="opacity-60">
              <p className="font-body text-sm text-ink">{entry.scenario}</p>
              <div className="ml-3 mt-1 pl-3 border-l-2 border-summit-cobalt/20">
                <p className="text-xs font-ui font-medium text-summit-cobalt">You chose: {entry.choice}</p>
                {entry.consequence && (
                  <p className="text-xs font-body text-trail-brown italic mt-0.5">{entry.consequence}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current scenario or end state */}
      <div className="p-5">
        {ended ? (
          <div className="text-center space-y-3">
            <p className="font-body text-ink">
              The scenario has concluded. You made {history.length} decision{history.length !== 1 ? 's' : ''}.
            </p>
            <button
              onClick={handleRestart}
              className="px-4 py-1.5 text-sm font-ui font-medium text-summit-cobalt border border-summit-cobalt/30 rounded-md hover:bg-summit-cobalt/5 transition-colors"
            >
              Try a different path
            </button>
          </div>
        ) : (
          <>
            <p className="font-body text-ink mb-4">{currentScenario.scenario_text}</p>
            {currentScenario.choices && (
              <div className="space-y-2">
                {currentScenario.choices.map((choice, i) => (
                  <button
                    key={choice.id || i}
                    onClick={() => handleChoice(choice)}
                    className="w-full text-left px-4 py-3 bg-catalog-cream border border-trail-brown/15 rounded-lg hover:border-summit-cobalt/30 hover:bg-summit-cobalt/5 transition-colors"
                  >
                    <p className="font-ui text-sm font-medium text-ink">{choice.text}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
