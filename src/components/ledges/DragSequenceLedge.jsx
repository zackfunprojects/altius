import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function GripIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="text-trail-brown/50 shrink-0"
    >
      <circle cx="5" cy="3" r="1.25" />
      <circle cx="11" cy="3" r="1.25" />
      <circle cx="5" cy="8" r="1.25" />
      <circle cx="11" cy="8" r="1.25" />
      <circle cx="5" cy="13" r="1.25" />
      <circle cx="11" cy="13" r="1.25" />
    </svg>
  )
}

function SortableCard({ id, content, imageUrl, disabled }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 bg-catalog-cream rounded-lg border border-trail-brown/20 px-4 py-3 ${
        isDragging ? 'shadow-lg opacity-90' : ''
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className={`touch-none ${disabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
        tabIndex={disabled ? -1 : 0}
        aria-label="Drag to reorder"
      >
        <GripIcon />
      </button>

      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="w-10 h-10 rounded object-cover shrink-0"
        />
      )}

      <span className="font-body text-sm text-ink leading-snug">{content}</span>
    </div>
  )
}

export default function DragSequenceLedge({ spec, onResponseChange, disabled }) {
  const [items, setItems] = useState(() =>
    spec.items.map((item) => ({ ...item }))
  )

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id)
        const newIndex = prev.findIndex((i) => i.id === over.id)
        const next = arrayMove(prev, oldIndex, newIndex)
        onResponseChange?.({ ordered_ids: next.map((i) => i.id) })
        return next
      })
    },
    [onResponseChange]
  )

  return (
    <div className="space-y-3">
      {spec.instructions && (
        <p className="font-body text-sm text-ink/80 mb-2">{spec.instructions}</p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((item) => (
              <SortableCard
                key={item.id}
                id={item.id}
                content={item.content}
                imageUrl={item.image_url}
                disabled={disabled}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
