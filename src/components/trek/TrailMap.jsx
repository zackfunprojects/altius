import { useEffect, useRef } from 'react'
import { useTrailSections } from '../../hooks/useTrailSections'

const STATUS_COLORS = {
  completed: '#4ADE80',  // phosphor-green
  active: '#1A3D7C',     // summit-cobalt
  locked: '#D1C9BC',     // light trail brown
  skipped: '#D9511C',    // signal-orange
}

const CAMP_STATUS_ICONS = {
  completed: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  active: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="2" fill="currentColor"/>
    </svg>
  ),
  locked: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="3" y="5" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1"/>
      <path d="M4.5 5V3.5C4.5 2.67 5.17 2 6 2C6.83 2 7.5 2.67 7.5 3.5V5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  ),
}

function CampNode({ camp, sections, currentSectionId, onSectionClick, isLast }) {
  const isCampActive = camp.status === 'active'
  const isCampCompleted = camp.status === 'completed'

  return (
    <div className="relative">
      {/* Camp marker */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            isCampCompleted
              ? 'bg-phosphor-green/15 border-phosphor-green text-phosphor-green'
              : isCampActive
                ? 'bg-summit-cobalt/15 border-summit-cobalt text-summit-cobalt'
                : 'bg-trail-brown/10 border-trail-brown/30 text-trail-brown/50'
          }`}
        >
          {CAMP_STATUS_ICONS[camp.status] || CAMP_STATUS_ICONS.locked}
        </div>
        <div className="min-w-0 pt-0.5">
          <p
            className={`text-sm font-ui font-medium leading-tight ${
              isCampCompleted
                ? 'text-trail-brown/60'
                : isCampActive
                  ? 'text-ink'
                  : 'text-trail-brown/40'
            }`}
          >
            {camp.camp_name}
          </p>
          {isCampActive && camp.learning_objectives?.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {camp.learning_objectives.slice(0, 2).map((obj, i) => (
                <li key={i} className="text-xs font-body text-trail-brown/60 leading-snug">
                  {obj}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Section dots */}
      <div className="ml-4 pl-4 border-l border-trail-brown/15 space-y-1.5 pb-4">
        {sections.map((section) => {
          const isCurrentSection = section.id === currentSectionId
          const color = STATUS_COLORS[section.status] || STATUS_COLORS.locked
          const isClickable = section.status !== 'locked'

          return (
            <button
              key={section.id}
              onClick={() => isClickable && onSectionClick(section)}
              disabled={!isClickable}
              className={`flex items-center gap-2.5 w-full text-left py-1 px-2 rounded-md transition-colors ${
                isCurrentSection
                  ? 'bg-summit-cobalt/8'
                  : isClickable
                    ? 'hover:bg-trail-brown/5'
                    : ''
              }`}
            >
              <span
                className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${
                  isCurrentSection ? 'ring-2 ring-summit-cobalt/30 ring-offset-1' : ''
                }`}
                style={{ backgroundColor: color }}
              />
              <span
                className={`text-xs font-ui leading-tight ${
                  section.status === 'completed'
                    ? 'text-trail-brown/50'
                    : section.status === 'active'
                      ? 'text-ink font-medium'
                      : 'text-trail-brown/35'
                }`}
              >
                {section.title}
              </span>
            </button>
          )
        })}
      </div>

      {/* Connector line to next camp */}
      {!isLast && (
        <div className="ml-4 h-2 border-l border-trail-brown/15" />
      )}
    </div>
  )
}

export default function TrailMap({ camps, currentSectionId, onSectionClick }) {
  const scrollRef = useRef(null)
  const activeRef = useRef(null)

  // Auto-scroll to current section (with delay to allow sections to render)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeRef.current && scrollRef.current) {
        const container = scrollRef.current
        const element = activeRef.current
        const containerRect = container.getBoundingClientRect()
        const elementRect = element.getBoundingClientRect()

        if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [currentSectionId])

  return (
    <div ref={scrollRef} className="p-4 lg:p-5">
      <p className="text-xs font-ui font-medium text-trail-brown/60 uppercase tracking-wider mb-4">
        Trail Map
      </p>
      <div>
        {camps.map((camp, i) => (
          <CampWithSections
            key={camp.id}
            camp={camp}
            currentSectionId={currentSectionId}
            onSectionClick={onSectionClick}
            isLast={i === camps.length - 1}
            activeRef={activeRef}
          />
        ))}
      </div>
    </div>
  )
}

function CampWithSections({ camp, currentSectionId, onSectionClick, isLast, activeRef }) {
  const { sections } = useTrailSections(camp.id)

  // Wrap the active section in a ref for auto-scroll
  const hasActiveSectionRef = useRef(false)

  useEffect(() => {
    if (sections.some(s => s.id === currentSectionId)) {
      hasActiveSectionRef.current = true
    }
  }, [sections, currentSectionId])

  return (
    <div ref={sections.some(s => s.id === currentSectionId) ? activeRef : undefined}>
      <CampNode
        camp={camp}
        sections={sections}
        currentSectionId={currentSectionId}
        onSectionClick={onSectionClick}
        isLast={isLast}
      />
    </div>
  )
}
