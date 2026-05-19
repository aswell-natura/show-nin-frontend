import { useMemo, useState } from 'react'
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import AppLayout from '../../components/layout/AppLayout'
import { useDataStore } from '../../context/DataStoreContext'
import type { Task } from '../../types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type ViewMode = 'table' | 'cards' | 'kanban' | 'gantt'
type KanbanStatus = '未処理' | '実行中' | '完了' | '保留'
type Priority = 'High' | 'Middle' | 'Low'

interface TaskView {
  id: string
  title: string
  description: string
  customer: string
  project: string
  status: KanbanStatus
  priority: Priority
  owner: string
  startDate: string
  endDate: string
  progressPercent: number
  progressUpdatedAt?: string
}

const kanbanColumns: KanbanStatus[] = ['未処理', '実行中', '完了', '保留']
const statusOptions: Array<'all' | KanbanStatus> = ['all', '未処理', '実行中', '完了', '保留']
const priorityOptions: Array<'all' | Priority> = ['all', 'High', 'Middle', 'Low']
const progressOptions = Array.from({ length: 11 }, (_, index) => index * 10)

const statusColor: Record<KanbanStatus, string> = {
  未処理: 'bg-muted text-muted-foreground hover:bg-muted/80',
  実行中: 'bg-primary/10 text-primary hover:bg-primary/20',
  完了: 'bg-green-500/10 text-green-600 hover:bg-green-500/20',
  保留: 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20',
}

const priorityColor: Record<Priority, string> = {
  High: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
  Middle: 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20',
  Low: 'bg-muted text-muted-foreground hover:bg-muted/80',
}

const kanbanTone: Record<KanbanStatus, string> = {
  未処理: 'border-border bg-muted/30',
  実行中: 'border-primary/20 bg-primary/5',
  完了: 'border-green-500/20 bg-green-500/5',
  保留: 'border-yellow-500/20 bg-yellow-500/5',
}

const ganttBarColor: Record<KanbanStatus, string> = {
  未処理: 'bg-muted-foreground',
  実行中: 'bg-primary',
  完了: 'bg-green-500',
  保留: 'bg-yellow-500',
}

const taskDescriptions = [
  '録音議事録から抽出された先方依頼をもとに、次回商談までに必要な対応を進める。',
  '会話内で確認が必要と判断された論点について、担当者に確認して回答を準備する。',
  '提案内容の精度を上げるため、関連資料と過去商談メモを整理して共有する。',
  '先方の検討スケジュールに合わせて、社内確認と次回アクションを完了させる。',
]

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(`${date}T00:00:00`).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })
}

function addDays(date: string, days: number) {
  const base = new Date(`${date}T00:00:00`)
  base.setDate(base.getDate() + days)
  return base.toISOString().slice(0, 10)
}

function daysBetween(start: string, end: string) {
  const startTime = new Date(`${start}T00:00:00`).getTime()
  const endTime = new Date(`${end}T00:00:00`).getTime()
  return Math.max(1, Math.round((endTime - startTime) / 86400000) + 1)
}

function TaskCard({ task }: { task: TaskView }) {
  return (
    <article className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground leading-6">{task.title}</h3>
        <Badge variant="outline" className={`shrink-0 px-2 py-0.5 font-bold border-0 ${priorityColor[task.priority]}`}>
          {task.priority}
        </Badge>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground line-clamp-2">{task.description}</p>
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div>
          <span className="text-muted-foreground">企業</span>
          <p className="mt-0.5 text-foreground/90 truncate">{task.customer}</p>
        </div>
        <div>
          <span className="text-muted-foreground">案件</span>
          <p className="mt-0.5 text-foreground/90 truncate">{task.project}</p>
        </div>
        <div>
          <span className="text-muted-foreground">担当者</span>
          <p className="mt-0.5 text-foreground/90">{task.owner}</p>
        </div>
        <div>
          <span className="text-muted-foreground">期限</span>
          <p className="mt-0.5 text-foreground/90">{formatDate(task.endDate)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">進捗率</span>
          <p className="mt-0.5 text-foreground/90">{task.progressPercent}%</p>
        </div>
        <div>
          <span className="text-muted-foreground">進捗率更新日</span>
          <p className="mt-0.5 text-foreground/90">{task.progressUpdatedAt ?? '-'}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <Badge variant="outline" className={`px-2.5 py-0.5 text-[11px] font-bold border-0 ${statusColor[task.status]}`}>
          {task.status}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatDate(task.startDate)} - {formatDate(task.endDate)}
        </span>
      </div>
    </article>
  )
}

function DraggableTaskCard({ task }: { task: TaskView }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, position: 'relative', zIndex: 50 } : undefined}
      className={`touch-none cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-40' : ''}`}
      {...listeners}
      {...attributes}
    >
      <TaskCard task={task} />
    </div>
  )
}

function DroppableTaskColumn({ status, tasks }: { status: KanbanStatus; tasks: TaskView[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: status })
  return (
    <section
      ref={setNodeRef}
      className={`min-h-[520px] rounded-xl border transition-all ${kanbanTone[status]} ${isOver ? 'ring-2 ring-primary ring-inset shadow-md' : 'shadow-sm'}`}
    >
      <div className="border-b border-border/50 px-4 py-3 flex items-center justify-between bg-card/50 rounded-t-xl">
        <h2 className="text-sm font-bold text-foreground">{status}</h2>
        <span className="rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground shadow-sm">{tasks.length}件</span>
      </div>
      <div className="p-3 flex flex-col gap-3">
        {tasks.map((task) => (
          <DraggableTaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">タスクなし</p>
        )}
      </div>
    </section>
  )
}

export default function TaskBoard() {
  const { tasks, customers, projects, profiles, updateTask } = useDataStore()
  const [viewMode] = useState<ViewMode>('table')
  const [statusFilter, setStatusFilter] = useState<'all' | KanbanStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all')
  const [search, setSearch] = useState('')
  const [kanbanOverrides, setKanbanOverrides] = useState<Record<string, KanbanStatus>>({})

  const taskViews = useMemo<TaskView[]>(
    () =>
      tasks.map((task, index) => {
        const customer = customers.find((item) => item.id === task.customer_id)
        const project =
          projects.find((item) => item.id === task.project_id) ??
          projects.find((item) => item.customer_id === task.customer_id && item.user_id === task.user_id) ??
          projects.find((item) => item.customer_id === task.customer_id)
        const owner = profiles.find((profile) => profile.id === task.user_id)
        const status: KanbanStatus = task.is_completed
          ? '完了'
          : index % 5 === 0
            ? '保留'
            : index % 3 === 0
              ? '実行中'
              : '未処理'
        const priority: Priority = index % 6 === 0 ? 'High' : index % 4 === 0 ? 'Low' : 'Middle'
        const startDate = addDays(task.due_date, -Math.max(1, (index % 7) + 1))

        return {
          id: task.id,
          title: task.title.replace(/^.+?：/, ''),
          description: taskDescriptions[index % taskDescriptions.length],
          customer: customer?.name ?? '未設定',
          project: project?.name ?? '未設定',
          status,
          priority,
          owner: owner?.name ?? '未担当',
          startDate,
          endDate: task.due_date,
          progressPercent: task.progress_percent ?? (task.is_completed ? 100 : 0),
          progressUpdatedAt: task.progress_updated_at,
        }
      }),
    [customers, profiles, projects, tasks],
  )

  const getStatus = (task: TaskView): KanbanStatus => kanbanOverrides[task.id] ?? task.status

  const filteredTasks = useMemo(
    () =>
      taskViews.filter((task) => {
        const query = search.trim()
        const matchesSearch =
          !query ||
          task.title.includes(query) ||
          task.description.includes(query) ||
          task.customer.includes(query) ||
          task.project.includes(query)
        const matchesStatus = statusFilter === 'all' || (kanbanOverrides[task.id] ?? task.status) === statusFilter
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
        return matchesSearch && matchesStatus && matchesPriority
      }),
    [priorityFilter, search, statusFilter, taskViews, kanbanOverrides],
  )

  const ganttStart = '2026-05-01'
  const ganttDays = Array.from({ length: 31 }, (_, index) => addDays(ganttStart, index))
  const ganttStartTime = new Date(`${ganttStart}T00:00:00`).getTime()

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) {
      setKanbanOverrides((prev) => ({ ...prev, [String(active.id)]: over.id as KanbanStatus }))
    }
  }

  function handleProgressChange(taskId: string, value: number) {
    updateTask(taskId, { progress_percent: value } satisfies Partial<Task>)
    if (value === 100) {
      setKanbanOverrides((prev) => ({ ...prev, [taskId]: '完了' }))
    }
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-background">
        <div className="bg-card border-b border-border px-4 md:px-6 py-4 shrink-0 shadow-sm z-10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">タスク</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">AIが抽出したタスクを複数の形式で確認します</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'all' | KanbanStatus)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'すべてのステータス' : status}
                  </option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as 'all' | Priority)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority === 'all' ? 'すべての優先度' : priority}
                  </option>
                ))}
              </select>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="タスク・企業・案件で検索"
                className="h-9 w-full sm:w-72 rounded-lg border border-border bg-card px-3 text-sm outline-none placeholder-gray-400 focus:ring-2 focus:border-primary focus:ring-1 focus:ring-primary transition-colors border-input"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button variant="primary" className="hidden sm:inline-flex h-9 items-center px-4 font-medium shadow-sm gap-1.5">
                <span className="text-base leading-none mb-0.5">+</span> タスク追加
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {viewMode === 'table' && (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1640px] table-fixed text-left">
                  <thead className="bg-muted/30 text-xs font-medium text-muted-foreground">
                    <tr>
                      <th className="w-60 px-4 py-3 whitespace-nowrap">タスク名</th>
                      <th className="w-80 px-4 py-3 whitespace-nowrap">説明</th>
                      <th className="w-56 px-4 py-3 whitespace-nowrap">企業</th>
                      <th className="w-64 px-4 py-3 whitespace-nowrap">案件</th>
                      <th className="w-32 px-4 py-3 whitespace-nowrap">ステータス</th>
                      <th className="w-32 px-4 py-3 whitespace-nowrap">優先度</th>
                      <th className="w-36 px-4 py-3 whitespace-nowrap">担当者</th>
                      <th className="w-32 px-4 py-3 whitespace-nowrap">進捗率</th>
                      <th className="w-36 px-4 py-3 whitespace-nowrap">進捗率更新日</th>
                      <th className="w-32 px-4 py-3 whitespace-nowrap">開始日</th>
                      <th className="w-32 px-4 py-3 whitespace-nowrap">終了日</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {filteredTasks.map((task) => {
                      const s = getStatus(task)
                      return (
                        <tr key={task.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium text-foreground truncate">{task.title}</td>
                          <td className="px-4 py-3 text-muted-foreground truncate">{task.description}</td>
                          <td className="px-4 py-3 text-muted-foreground/80 truncate">{task.customer}</td>
                          <td className="px-4 py-3 text-muted-foreground/80 truncate">{task.project}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`inline-flex whitespace-nowrap px-2.5 py-0.5 text-[11px] font-bold border-0 ${statusColor[s]}`}>
                              {s}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`inline-flex whitespace-nowrap px-2.5 py-0.5 text-[11px] font-bold border-0 ${priorityColor[task.priority]}`}>
                              {task.priority}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground/80 whitespace-nowrap">{task.owner}</td>
                          <td className="px-4 py-3">
                            <select
                              value={task.progressPercent}
                              onChange={(event) => handleProgressChange(task.id, Number(event.target.value))}
                              className="h-8 w-24 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                            >
                              {progressOptions.map((value) => (
                                <option key={value} value={value}>{value}%</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{task.progressUpdatedAt ?? '-'}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{task.startDate}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{task.endDate}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'cards' && (
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={{ ...task, status: getStatus(task) }} />
              ))}
            </div>
          )}

          {viewMode === 'kanban' && (
            <DndContext onDragEnd={handleDragEnd}>
              <div className="overflow-x-auto">
                <div className="grid min-w-[900px] grid-cols-4 gap-4">
                  {kanbanColumns.map((col) => {
                    const colTasks = filteredTasks
                      .filter((task) => getStatus(task) === col)
                      .map((task) => ({ ...task, status: col }))
                    return <DroppableTaskColumn key={col} status={col} tasks={colTasks} />
                  })}
                </div>
              </div>
            </DndContext>
          )}

          {viewMode === 'gantt' && (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <div className="min-w-[1280px]">
                  <div className="grid border-b border-border bg-muted/30" style={{ gridTemplateColumns: '320px repeat(31, 38px)' }}>
                    <div className="px-4 py-3 text-sm font-medium text-foreground/90">タスク名</div>
                    {ganttDays.map((day) => (
                      <div key={day} className="border-l border-border px-1 py-2 text-center text-xs text-muted-foreground">
                        <div>{new Date(`${day}T00:00:00`).getDate()}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {'日月火水木金土'[new Date(`${day}T00:00:00`).getDay()]}
                        </div>
                      </div>
                    ))}
                  </div>
                  {filteredTasks.map((task) => {
                    const offset = Math.max(0, Math.round((new Date(`${task.startDate}T00:00:00`).getTime() - ganttStartTime) / 86400000))
                    const width = Math.min(31 - offset, daysBetween(task.startDate, task.endDate))
                    return (
                      <div key={task.id} className="grid min-h-16 border-b border-gray-100" style={{ gridTemplateColumns: '320px repeat(31, 38px)' }}>
                        <div className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{task.startDate} - {task.endDate}</p>
                        </div>
                        <div className="relative grid" style={{ gridColumn: '2 / span 31', gridTemplateColumns: 'repeat(31, 38px)' }}>
                          {ganttDays.map((day) => (
                            <div key={day} className="border-l border-gray-100" />
                          ))}
                          <div
                            className={`absolute top-4 h-8 rounded-lg px-3 text-xs font-medium text-white flex items-center overflow-hidden ${ganttBarColor[getStatus(task)]}`}
                            style={{ left: `${offset * 38 + 6}px`, width: `${Math.max(1, width) * 38 - 12}px` }}
                          >
                            <span className="truncate">{task.title}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
