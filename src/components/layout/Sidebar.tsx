import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '../../context/AuthContext'
import { managerSidebarMenuItems, sidebarMenuItems } from '../../data/mock'
import Icon from '../ui/Icon'

interface SidebarProps {
  isMobileOpen: boolean
  onMobileClose: () => void
}

interface SortableItemProps {
  id: string
  label: string
  icon: string
  isActive: boolean
  isUnlocked: boolean
  isCollapsed: boolean
  onClick: () => void
}

function SortableItem({ id, label, icon, isActive, isUnlocked, isCollapsed, onClick }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      title={isCollapsed ? label : undefined}
      className={`
        flex items-center gap-2.5 rounded-lg mx-2 text-sm cursor-pointer select-none
        transition-all duration-150
        ${isCollapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2'}
        ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}
        ${isDragging ? 'shadow-lg bg-white' : ''}
      `}
      onClick={!isUnlocked ? onClick : undefined}
    >
      {isUnlocked && !isCollapsed && (
        <div
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0"
        >
          <Icon name="grip" className="w-3.5 h-3.5" />
        </div>
      )}
      <Icon name={icon} className="w-4 h-4 shrink-0" />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </div>
  )
}

function NavContent({
  order,
  isUnlocked,
  isCollapsed,
  onNavigate,
  onToggleLock,
  getActivePath,
  menuItems,
}: {
  order: string[]
  isUnlocked: boolean
  isCollapsed: boolean
  onNavigate: (id: string) => void
  onToggleLock: () => void
  getActivePath: (id: string) => boolean
  menuItems: typeof sidebarMenuItems
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const [localOrder, setLocalOrder] = useState(order)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setLocalOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as string)
        const newIndex = prev.indexOf(over.id as string)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  const orderedItems = localOrder
    .map((id) => menuItems.find((m) => m.id === id))
    .filter(Boolean) as typeof menuItems

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={localOrder} strategy={verticalListSortingStrategy}>
        <nav className="flex flex-col gap-0.5 flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-2">
          {orderedItems.map((item) => (
            <SortableItem
              key={item.id}
              id={item.id}
              label={item.label}
              icon={item.icon}
              isActive={getActivePath(item.id)}
              isUnlocked={isUnlocked}
              isCollapsed={isCollapsed}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </nav>
      </SortableContext>

      {!isCollapsed && (
        <div className="px-3 pt-3 border-t border-gray-100 mx-2 mt-2">
          <button
            onClick={onToggleLock}
            className={`
              w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-150
              ${isUnlocked
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              }
            `}
          >
            <Icon name={isUnlocked ? 'unlock' : 'lock'} className="w-3.5 h-3.5 shrink-0" />
            <span>{isUnlocked ? '並び替えモード' : 'メニューを並び替え'}</span>
          </button>
        </div>
      )}
    </DndContext>
  )
}

export default function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const { currentUser, activeMode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const effectiveMode =
    currentUser?.role === 'manager' ? 'manager' :
    currentUser?.role === 'dual' ? activeMode : 'player'
  const menuItems = effectiveMode === 'manager' ? managerSidebarMenuItems : sidebarMenuItems
  const roleDefaultOrder = menuItems.map((m) => m.id)
  const userOrder = currentUser?.sidebar_settings.order ?? roleDefaultOrder
  const normalizedUserOrder = [
    ...userOrder.filter((id) => menuItems.some((m) => m.id === id)),
    ...roleDefaultOrder.filter((id) => !userOrder.includes(id)),
  ]
  const initialOrder = effectiveMode === 'manager'
    ? roleDefaultOrder
    : normalizedUserOrder
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  function getActivePath(itemId: string) {
    if (itemId === 'home') return location.pathname === '/dashboard'
    if (itemId === 'customers') return location.pathname.startsWith('/customers')
    if (itemId === 'projects') return location.pathname.startsWith('/projects')
    if (itemId === 'minutes') return location.pathname.startsWith('/minutes')
    if (itemId === 'tasks') return location.pathname.startsWith('/tasks')
    if (itemId === 'members') return location.pathname.startsWith('/members')
    if (itemId === 'budget') return location.pathname.startsWith('/budget') || location.pathname.startsWith('/my-budget')
    if (itemId === 'reviews') return location.pathname.startsWith('/reviews')
    if (itemId === 'risks') return location.pathname.startsWith('/risks')
    if (itemId === 'reports') return location.pathname.startsWith('/reports')
    return false
  }

  function handleNavigate(itemId: string) {
    if (itemId === 'home') navigate('/dashboard')
    else if (itemId === 'customers') navigate('/customers')
    else if (itemId === 'projects') navigate('/projects')
    else if (itemId === 'minutes') navigate('/minutes')
    else if (itemId === 'tasks') navigate('/tasks')
    else if (itemId === 'members') navigate('/members')
    else if (itemId === 'budget') navigate(effectiveMode === 'manager' ? '/budget' : '/my-budget')
    else if (itemId === 'reviews') navigate('/reviews')
    else if (itemId === 'risks') navigate('/risks')
    else if (itemId === 'reports') navigate('/reports/rep-001')
    else navigate('/dashboard')
    onMobileClose()
  }

  const sharedProps = {
    order: initialOrder,
    isUnlocked,
    isCollapsed: false,
    onNavigate: handleNavigate,
    onToggleLock: () => setIsUnlocked((v) => !v),
    getActivePath,
    menuItems,
  }

  return (
    <>
      {/* ─── モバイル：オーバーレイドロワー ─────────────────── */}
      <div
        className={`
          md:hidden fixed inset-0 z-40 transition-opacity duration-200
          ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      >
        {/* 背景タップで閉じる */}
        <div className="absolute inset-0 bg-black/30" onClick={onMobileClose} />

        {/* ドロワー本体 */}
        <aside
          className={`
            absolute top-0 left-0 h-full w-64 bg-white flex flex-col py-3 overflow-hidden
            border-r border-gray-200 shadow-xl
            transition-transform duration-200
            ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* 閉じるボタン */}
          <div className="flex items-center justify-between px-4 mb-3">
            <span className="text-sm font-semibold text-gray-800">メニュー</span>
            <button
              onClick={onMobileClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <Icon name="chevron-left" className="w-4 h-4" />
            </button>
          </div>
          <NavContent {...sharedProps} />
        </aside>
      </div>

      {/* ─── デスクトップ：インラインサイドバー ──────────────── */}
      <aside
        className={`
          hidden md:flex flex-col py-3 bg-white border-r border-gray-200 shrink-0 overflow-hidden
          transition-all duration-200
          ${isCollapsed ? 'w-12' : 'w-52'}
        `}
      >
        {/* 折り畳みトグル */}
        <div className={`flex mb-2 ${isCollapsed ? 'justify-center' : 'justify-end px-3'}`}>
          <button
            onClick={() => { setIsCollapsed((v) => !v); if (!isCollapsed) setIsUnlocked(false) }}
            title={isCollapsed ? 'サイドバーを開く' : 'サイドバーを閉じる'}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <Icon name={isCollapsed ? 'chevron-right' : 'chevron-left'} className="w-3.5 h-3.5" />
          </button>
        </div>
        <NavContent {...sharedProps} isCollapsed={isCollapsed} />
      </aside>
    </>
  )
}
