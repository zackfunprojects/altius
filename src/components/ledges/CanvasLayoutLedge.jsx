import { useState, useCallback } from 'react'
import {
  DndContext,
  useDraggable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'

const GRID_SIZE = 10

function snapToGrid(value) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function DraggableElement({
  element,
  disabled,
  onResizeStart,
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: element.id, disabled })

  const x = element.x + (transform?.x || 0)
  const y = element.y + (transform?.y || 0)

  const style = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    zIndex: isDragging ? 20 : 1,
  }

  const isShape = element.type === 'shape' || element.type === 'rectangle' || element.type === 'circle'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group select-none ${isDragging ? 'opacity-80' : ''} ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      {/* Main draggable surface */}
      <div
        {...attributes}
        {...listeners}
        className={`w-full h-full flex items-center justify-center rounded border border-trail-brown/30 overflow-hidden ${
          disabled ? 'cursor-default' : 'cursor-move'
        } ${
          isShape
            ? ''
            : 'bg-catalog-cream'
        }`}
        style={
          isShape
            ? {
                backgroundColor: element.color || '#1A3D7C',
                borderRadius: element.type === 'circle' ? '50%' : undefined,
              }
            : undefined
        }
      >
        {!isShape && (
          <span className="text-xs font-ui text-ink px-2 text-center leading-tight">
            {element.content}
          </span>
        )}
      </div>

      {/* Resize handles (four corners) */}
      {!disabled && (
        <>
          {['nw', 'ne', 'sw', 'se'].map((corner) => {
            const posClasses = {
              nw: '-top-1 -left-1 cursor-nwse-resize',
              ne: '-top-1 -right-1 cursor-nesw-resize',
              sw: '-bottom-1 -left-1 cursor-nesw-resize',
              se: '-bottom-1 -right-1 cursor-nwse-resize',
            }
            return (
              <div
                key={corner}
                onMouseDown={(e) => onResizeStart(e, element.id, corner)}
                className={`absolute w-3 h-3 bg-summit-cobalt border border-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity ${posClasses[corner]}`}
              />
            )
          })}
        </>
      )}
    </div>
  )
}

export default function CanvasLayoutLedge({ spec, onResponseChange, disabled }) {
  const [elements, setElements] = useState(() =>
    spec.available_elements.map((el) => ({
      id: el.id,
      type: el.type,
      content: el.content,
      color: el.color,
      x: el.default_position?.x || 0,
      y: el.default_position?.y || 0,
      width: el.default_position?.width || 100,
      height: el.default_position?.height || 60,
    }))
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  )

  const emitChange = useCallback(
    (updated) => {
      onResponseChange?.({
        element_positions: updated.map((el) => ({
          id: el.id,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
        })),
      })
    },
    [onResponseChange]
  )

  const handleDragEnd = useCallback(
    (event) => {
      const { active, delta } = event
      if (!delta) return

      setElements((prev) => {
        const next = prev.map((el) => {
          if (el.id !== active.id) return el
          return {
            ...el,
            x: snapToGrid(clamp(el.x + delta.x, 0, spec.canvas_width - el.width)),
            y: snapToGrid(clamp(el.y + delta.y, 0, spec.canvas_height - el.height)),
          }
        })
        emitChange(next)
        return next
      })
    },
    [spec.canvas_width, spec.canvas_height, emitChange]
  )

  const handleResizeStart = useCallback(
    (e, elementId, corner) => {
      e.preventDefault()
      e.stopPropagation()

      const el = elements.find((el) => el.id === elementId)
      if (!el) return

      const startX = e.clientX
      const startY = e.clientY
      const startEl = { ...el }

      const handleMouseMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX
        const dy = moveEvent.clientY - startY

        setElements((prev) =>
          prev.map((item) => {
            if (item.id !== elementId) return item

            let newX = startEl.x
            let newY = startEl.y
            let newW = startEl.width
            let newH = startEl.height

            if (corner.includes('e')) {
              newW = snapToGrid(Math.max(30, startEl.width + dx))
            }
            if (corner.includes('w')) {
              const delta = snapToGrid(dx)
              newW = Math.max(30, startEl.width - delta)
              newX = startEl.x + (startEl.width - newW)
            }
            if (corner.includes('s')) {
              newH = snapToGrid(Math.max(30, startEl.height + dy))
            }
            if (corner.includes('n')) {
              const delta = snapToGrid(dy)
              newH = Math.max(30, startEl.height - delta)
              newY = startEl.y + (startEl.height - newH)
            }

            // Clamp to canvas bounds
            newX = clamp(newX, 0, spec.canvas_width - newW)
            newY = clamp(newY, 0, spec.canvas_height - newH)

            return { ...item, x: newX, y: newY, width: newW, height: newH }
          })
        )
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        setElements((prev) => {
          emitChange(prev)
          return prev
        })
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [elements, spec.canvas_width, spec.canvas_height, emitChange]
  )

  return (
    <div className="space-y-3">
      {spec.instructions && (
        <p className="font-body text-sm text-ink/80">{spec.instructions}</p>
      )}

      {/* Canvas */}
      <div
        className="relative border border-trail-brown/20 rounded-lg bg-white overflow-hidden mx-auto"
        style={{
          width: `${spec.canvas_width}px`,
          height: `${spec.canvas_height}px`,
          maxWidth: '100%',
          // Grid dots
          backgroundImage:
            'radial-gradient(circle, rgba(139,115,85,0.15) 1px, transparent 1px)',
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        }}
      >
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {elements.map((el) => (
            <DraggableElement
              key={el.id}
              element={el}
              disabled={disabled}
              onResizeStart={handleResizeStart}
            />
          ))}
        </DndContext>
      </div>
    </div>
  )
}
