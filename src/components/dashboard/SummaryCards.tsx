import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { dashboardCardDefs } from '../../data/mock'
import type { ActiveMode } from '../../types'
import Icon from '../ui/Icon'

interface CardValue {
  id: number
  value: string | number
}

function computeCardValues(_mode: ActiveMode): CardValue[] {
  return [
    { id: 1,  value: 3 },
    { id: 2,  value: 2 },
    { id: 3,  value: '1,850' },
    { id: 4,  value: 5 },
    { id: 5,  value: 72 },
    { id: 6,  value: 68 },
    { id: 7,  value: 8 },
    { id: 8,  value: 3 },
    { id: 9,  value: 2 },
    { id: 10, value: '640' },
  ]
}

const colorMap: Record<string, string> = {
  blue:   'bg-blue-50 text-blue-600',
  green:  'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-700',
  red:    'bg-red-50 text-red-600',
}

interface SortableCardProps {
  cardId: number
  isEditMode: boolean
  values: CardValue[]
}

function SortableCard({ cardId, isEditMode, values }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cardId })
  const def = dashboardCardDefs.find((d) => d.id === cardId)
  const val = values.find((v) => v.id === cardId)
  if (!def) return null

  const iconClass = colorMap[def.color] ?? colorMap.blue

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
      className={`
        flex-1 min-w-36 border border-gray-200 bg-white rounded-lg px-3.5 py-2.5 flex items-center gap-3 select-none
        text-gray-900 transition-all duration-150 hover:bg-gray-50
        ${isEditMode ? 'cursor-grab active:cursor-grabbing shadow-md scale-[1.02]' : ''}
        ${isDragging ? 'shadow-xl' : ''}
      `}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
        <Icon name={def.icon} className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 truncate">{def.label}</p>
        <p className="text-xl font-bold leading-tight text-gray-900">
          {val?.value ?? '—'}
          <span className="text-xs font-normal ml-1 text-gray-400">{def.unit}</span>
        </p>
      </div>
    </div>
  )
}

interface SummaryCardsProps {
  mode: ActiveMode
  cardOrder: number[]
  onOrderChange: (newOrder: number[]) => void
}

export default function SummaryCards({ mode, cardOrder, onOrderChange }: SummaryCardsProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const values = computeCardValues(mode)

  const visibleDefs = dashboardCardDefs.filter(
    (d) => d.role_visibility === mode || d.role_visibility === 'both'
  )
  const orderedIds = cardOrder.filter((id) => visibleDefs.some((d) => d.id === id))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = orderedIds.indexOf(active.id as number)
      const newIndex = orderedIds.indexOf(over.id as number)
      onOrderChange(arrayMove(orderedIds, oldIndex, newIndex))
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 shrink-0">
      <div className="flex items-center gap-3 py-2">
        {/* 折り畳みトグル + ラベル */}
        <button
          onClick={() => { setIsVisible(!isVisible); if (isEditMode) setIsEditMode(false) }}
          className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
        >
          <Icon
            name={isVisible ? 'chevron-up' : 'chevron-down'}
            className="w-3.5 h-3.5"
          />
          <span className="text-xs font-medium uppercase tracking-wider">サマリー</span>
        </button>

        {/* カード列 */}
        {isVisible && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedIds} strategy={horizontalListSortingStrategy}>
              <div className="flex gap-2.5 flex-1 overflow-x-auto min-w-0">
                {orderedIds.map((id) => (
                  <SortableCard
                    key={id}
                    cardId={id}
                    isEditMode={isEditMode}
                    values={values}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* 並び替えボタン（展開時のみ） */}
        {isVisible && (
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`shrink-0 text-xs px-2.5 py-1 rounded-full border transition-all ${
              isEditMode
                ? 'bg-blue-50 border-blue-200 text-blue-600 font-medium'
                : 'border-gray-200 text-gray-400 hover:text-gray-600'
            }`}
          >
            {isEditMode ? '完了' : '並び替え'}
          </button>
        )}
      </div>
    </div>
  )
}
