import { useState, useCallback, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const MIN_DURATION = 1

function SortableClip({
  clip,
  totalDuration,
  disabled,
  onResizeStart,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: clip.id, disabled })

  const widthPercent = totalDuration > 0 ? (clip.duration / totalDuration) * 100 : 10

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: `${widthPercent}%`,
    minWidth: '40px',
    zIndex: isDragging ? 10 : undefined,
    backgroundColor: clip.color || '#1A3D7C',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex items-center justify-center rounded-md h-14 select-none ${
        isDragging ? 'shadow-lg opacity-90' : ''
      } ${disabled ? 'opacity-50' : ''}`}
    >
      {/* Left resize handle */}
      {!disabled && (
        <div
          onMouseDown={(e) => onResizeStart(e, clip.id, 'left')}
          className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/20 rounded-l-md"
        />
      )}

      {/* Drag area - center */}
      <div
        {...attributes}
        {...listeners}
        className={`flex-1 flex items-center justify-center px-3 overflow-hidden ${
          disabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        <span className="text-white text-xs font-ui font-medium truncate">
          {clip.label}
        </span>
      </div>

      {/* Right resize handle */}
      {!disabled && (
        <div
          onMouseDown={(e) => onResizeStart(e, clip.id, 'right')}
          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/20 rounded-r-md"
        />
      )}

      {/* Duration label */}
      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-trail-brown/60 whitespace-nowrap">
        {clip.duration}s
      </span>
    </div>
  )
}

export default function TimelineEditorLedge({ spec, onResponseChange, disabled }) {
  const [clips, setClips] = useState(() =>
    spec.clips.map((c) => ({ ...c }))
  )
  const trackRef = useRef(null)
  const resizeRef = useRef(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const totalDuration = clips.reduce((sum, c) => sum + c.duration, 0)

  const emitChange = useCallback(
    (updatedClips) => {
      const durations = {}
      updatedClips.forEach((c) => {
        durations[c.id] = c.duration
      })
      onResponseChange?.({
        clip_order: updatedClips.map((c) => c.id),
        clip_durations: durations,
      })
    },
    [onResponseChange]
  )

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      setClips((prev) => {
        const oldIndex = prev.findIndex((c) => c.id === active.id)
        const newIndex = prev.findIndex((c) => c.id === over.id)
        const next = arrayMove(prev, oldIndex, newIndex)
        emitChange(next)
        return next
      })
    },
    [emitChange]
  )

  // Resize via mouse drag on edges
  const handleResizeStart = useCallback(
    (e, clipId, edge) => {
      e.preventDefault()
      e.stopPropagation()

      const track = trackRef.current
      if (!track) return

      const trackRect = track.getBoundingClientRect()
      const clipIndex = clips.findIndex((c) => c.id === clipId)
      const startX = e.clientX
      const startDuration = clips[clipIndex].duration

      // Pixels per second based on current track width
      const pxPerSec = trackRect.width / totalDuration

      resizeRef.current = {
        clipId,
        clipIndex,
        edge,
        startX,
        startDuration,
        pxPerSec,
      }

      const handleMouseMove = (moveEvent) => {
        const info = resizeRef.current
        if (!info) return

        const dx = moveEvent.clientX - info.startX
        const durationDelta = dx / info.pxPerSec

        let newDuration
        if (info.edge === 'right') {
          newDuration = Math.max(MIN_DURATION, Math.round(info.startDuration + durationDelta))
        } else {
          newDuration = Math.max(MIN_DURATION, Math.round(info.startDuration - durationDelta))
        }

        setClips((prev) => {
          const next = prev.map((c, i) =>
            i === info.clipIndex ? { ...c, duration: newDuration } : c
          )
          return next
        })
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        // Emit final state
        setClips((prev) => {
          emitChange(prev)
          return prev
        })
        resizeRef.current = null
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [clips, totalDuration, emitChange]
  )

  return (
    <div className="space-y-4">
      {spec.instructions && (
        <p className="font-body text-sm text-ink/80">{spec.instructions}</p>
      )}

      {/* Timeline track */}
      <div
        ref={trackRef}
        className="bg-ink/5 rounded-lg p-2 border border-trail-brown/15"
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={clips.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-1 pb-6">
              {clips.map((clip) => (
                <SortableClip
                  key={clip.id}
                  clip={clip}
                  totalDuration={totalDuration}
                  disabled={disabled}
                  onResizeStart={handleResizeStart}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Duration comparison */}
      <div className="flex items-center justify-between text-xs font-mono text-trail-brown">
        <span>
          Total: <span className="text-ink font-medium">{totalDuration}s</span>
        </span>
        {spec.target_total_duration != null && (
          <span>
            Target:{' '}
            <span
              className={`font-medium ${
                totalDuration === spec.target_total_duration
                  ? 'text-phosphor-green'
                  : totalDuration > spec.target_total_duration
                    ? 'text-signal-orange'
                    : 'text-alpine-gold'
              }`}
            >
              {spec.target_total_duration}s
            </span>
          </span>
        )}
      </div>
    </div>
  )
}
