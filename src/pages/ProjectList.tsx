import { useMemo, useState } from 'react'
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import AppLayout from '../components/layout/AppLayout'
import { useAuth } from '../context/AuthContext'
import { useDataStore } from '../context/DataStoreContext'
import type { Project, ProjectStatus } from '../types'
import { StatusBadge } from '../components/dashboard/shared/StatusBadge'
import { StatCard } from '../components/dashboard/shared/StatCard'
import { Button } from '@/components/ui/button'

type SortKey = 'updated_at' | 'name' | 'customer' | 'labels' | 'status' | 'priority' | 'amount' | 'next_action_date' | 'source'
type SortDirection = 'asc' | 'desc'
type StatusFilter = 'all' | ProjectStatus
type SourceFilter = 'all' | 'recording' | 'manual'
type LinkFilter = 'all' | 'linked' | 'unlinked'
type ViewMode = 'table' | 'cards' | 'kanban' | 'gantt'

const statusLabel: Record<ProjectStatus, string> = {
  lead: 'リード',
  proposing: '提案中',
  negotiating: '交渉中',
  closed: '成約',
}

// statusColor removed as we use StatusBadge directly

const sourceLabel: Record<'recording' | 'manual', string> = {
  recording: '音声録音',
  manual: '手動登録',
}

const sourceColor: Record<'recording' | 'manual', string> = {
  recording: 'bg-primary/10 text-primary',
  manual: 'bg-emerald-500/10 text-emerald-600 font-medium',
}

const priorityLabel: Record<Project['priority'], string> = {
  1: '高',
  2: '中',
  3: '低',
}

const priorityColor: Record<Project['priority'], string> = {
  1: 'bg-destructive/10 text-destructive',
  2: 'bg-yellow-500/10 text-yellow-600',
  3: 'bg-muted text-muted-foreground',
}

const projectStatuses: ProjectStatus[] = ['lead', 'proposing', 'negotiating', 'closed']

const kanbanTone: Record<ProjectStatus, string> = {
  lead: 'border-border bg-muted/30',
  proposing: 'border-primary/20 bg-primary/5',
  negotiating: 'border-yellow-500/20 bg-yellow-500/5',
  closed: 'border-green-500/20 bg-green-500/5',
}

function DraggableProjectCard({
  project,
  customerName,
  customerIndustry,
  ownerName,
}: {
  project: Project
  customerName: string
  customerIndustry: string
  ownerName: string
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: project.id })
  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, position: 'relative', zIndex: 50 } : undefined}
      className={`touch-none cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-40' : ''}`}
      {...listeners}
      {...attributes}
    >
      <ProjectCard project={project} customerName={customerName} customerIndustry={customerIndustry} ownerName={ownerName} />
    </div>
  )
}

function DroppableProjectColumn({
  status,
  projects,
  customers,
  profiles,
}: {
  status: ProjectStatus
  projects: Project[]
  customers: ReturnType<typeof useDataStore>['customers']
  profiles: ReturnType<typeof useDataStore>['profiles']
}) {
  const { isOver, setNodeRef } = useDroppable({ id: status })
  const colProjects = projects.filter((p) => p.status === status)
  return (
    <section
      ref={setNodeRef}
      className={`min-h-[520px] rounded-xl border transition-all ${kanbanTone[status]} ${isOver ? 'ring-2 ring-primary ring-inset shadow-md' : 'shadow-sm'}`}
    >
      <div className="border-b border-border/50 px-4 py-3 flex items-center justify-between bg-card/50 rounded-t-xl">
        <h2 className="text-sm font-bold text-foreground">{statusLabel[status]}</h2>
        <span className="rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground shadow-sm">{colProjects.length}件</span>
      </div>
      <div className="p-3 flex flex-col gap-3">
        {colProjects.map((project) => {
          const customer = project.customer_id ? customers.find((c) => c.id === project.customer_id) : null
          const owner = profiles.find((p) => p.id === project.user_id)
          return (
            <DraggableProjectCard
              key={project.id}
              project={project}
              customerName={customer?.name ?? '企業未紐付け'}
              customerIndustry={customer?.industry ?? ''}
              ownerName={owner?.name ?? '未担当'}
            />
          )
        })}
        {colProjects.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">案件なし</p>
        )}
      </div>
    </section>
  )
}

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, '')
}

function formatDate(value?: string) {
  if (!value) return '-'
  return new Date(value.includes('T') ? value : `${value}T00:00:00`).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function formatAmount(value: number) {
  if (!value) return '未設定'
  return `${(value / 10000).toLocaleString()}万円`
}

function ProjectLabels({ labels, compact = false }: { labels?: string[]; compact?: boolean }) {
  if (!labels?.length) return <span className="text-xs text-muted-foreground/50">-</span>
  return (
    <span className={`block text-xs text-muted-foreground ${compact ? 'truncate' : 'leading-5'}`}>
      {labels.join('、')}
    </span>
  )
}

function toDateInput(value: string) {
  return value.includes('T') ? value.slice(0, 10) : value
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

function compareValue(a: string | number | undefined, b: string | number | undefined) {
  const left = a ?? ''
  const right = b ?? ''
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return String(left).localeCompare(String(right), 'ja')
}

function SortButton({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className = '',
}: {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  direction: SortDirection
  onSort: (key: SortKey) => void
  className?: string
}) {
  const active = sortKey === activeKey
  return (
    <th className={`px-4 py-3 whitespace-nowrap ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <span>{label}</span>
        <span className={`text-[10px] ${active ? 'text-foreground' : 'text-muted-foreground/30'}`}>
          {active ? (direction === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  )
}

function ViewButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean
  label: string
  icon: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-colors ${
        active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'
      }`}
    >
      {icon}
    </button>
  )
}

function ProjectCard({
  project,
  customerName,
  customerIndustry,
  ownerName,
}: {
  project: Project
  customerName: string
  customerIndustry: string
  ownerName: string
}) {
  const source = project.source ?? 'manual'
  const isUnlinked = !project.customer_id

  return (
    <article className={`rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isUnlinked ? 'bg-destructive/5 border-destructive/20' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {isUnlinked && (
              <span className="shrink-0 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[11px] font-medium text-destructive">
                要紐付け
              </span>
            )}
            <h2 className="text-sm font-bold text-foreground truncate">{project.name}</h2>
          </div>
          <p className={`mt-1 text-xs truncate ${isUnlinked ? 'text-destructive/80' : 'text-muted-foreground'}`}>
            {customerName}{customerIndustry ? ` / ${customerIndustry}` : ''}
          </p>
          <div className="mt-2">
            <ProjectLabels labels={project.labels} />
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div>
          <span className="text-muted-foreground">金額</span>
          <p className="mt-0.5 text-foreground font-bold">{formatAmount(project.amount)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">優先度</span>
          <p className="mt-0.5">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor[project.priority]}`}>
              {priorityLabel[project.priority]}
            </span>
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">担当者</span>
          <p className="mt-0.5 text-foreground/80 font-medium truncate">{ownerName}</p>
        </div>
        <div>
          <span className="text-muted-foreground">ネクストアクション日</span>
          <p className="mt-0.5 text-foreground/80 font-medium">{formatDate(project.next_action_date)}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${sourceColor[source]}`}>
          {sourceLabel[source]}
        </span>
        <span className="text-[11px] text-muted-foreground font-medium">{formatDate(project.updated_at)}</span>
      </div>
      {project.note && <p className="mt-4 text-xs leading-5 text-muted-foreground bg-muted/30 p-2 rounded-md line-clamp-2">{project.note}</p>}
    </article>
  )
}

export default function ProjectList() {
  const { currentUser } = useAuth()
  const { projects, customers, profiles, addProject, updateProject } = useDataStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [linkFilter, setLinkFilter] = useState<LinkFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [sortKey, setSortKey] = useState<SortKey>('updated_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    customer_id: '',
    status: 'lead' as ProjectStatus,
    priority: 2 as Project['priority'],
    amount: '',
    close_date: '',
    note: '',
  })

  const filteredProjects = useMemo(() => {
    const query = normalizeSearch(search)
    const sorted = [...projects]
      .filter((project) => {
        // 録音から生まれた未紐付け案件は議事録一覧で管理するため除外
        if (!project.customer_id && (project.source ?? 'manual') === 'recording') return false
        const customer = project.customer_id
          ? customers.find((item) => item.id === project.customer_id)
          : null
        const owner = profiles.find((profile) => profile.id === project.user_id)
        const source = project.source ?? 'manual'
        const isLinked = Boolean(project.customer_id)
        const searchable = normalizeSearch([
          project.name,
          customer?.name ?? '未紐付け',
          customer?.industry ?? '',
          project.note ?? '',
          project.labels?.join(' ') ?? '',
          project.next_action_date ?? '',
          statusLabel[project.status],
          priorityLabel[project.priority],
          sourceLabel[source],
          owner?.name ?? '',
          String(project.amount),
        ].join(' '))

        const matchesSearch = !query || searchable.includes(query)
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter
        const matchesSource = sourceFilter === 'all' || source === sourceFilter
        const matchesLink =
          linkFilter === 'all' ||
          (linkFilter === 'linked' && isLinked) ||
          (linkFilter === 'unlinked' && !isLinked)
        return matchesSearch && matchesStatus && matchesSource && matchesLink
      })
      .sort((a, b) => {
        const sourceA = a.source ?? 'manual'
        const sourceB = b.source ?? 'manual'
        const customerA = a.customer_id ? customers.find((item) => item.id === a.customer_id)?.name : '未紐付け'
        const customerB = b.customer_id ? customers.find((item) => item.id === b.customer_id)?.name : '未紐付け'
        const values: Record<SortKey, [string | number | undefined, string | number | undefined]> = {
          updated_at: [a.updated_at, b.updated_at],
          name: [a.name, b.name],
          customer: [customerA, customerB],
          labels: [a.labels?.join(' ') ?? '', b.labels?.join(' ') ?? ''],
          status: [statusLabel[a.status], statusLabel[b.status]],
          priority: [a.priority, b.priority],
          amount: [a.amount, b.amount],
          next_action_date: [a.next_action_date, b.next_action_date],
          source: [sourceLabel[sourceA], sourceLabel[sourceB]],
        }
        const result = compareValue(...values[sortKey])
        return sortDirection === 'asc' ? result : -result
      })

    return sorted
  }, [customers, linkFilter, profiles, projects, search, sortDirection, sortKey, sourceFilter, statusFilter])

  const unlinkedProjects = projects.filter((project) => project.customer_id === null)
  const summary = {
    total: projects.length,
    linked: projects.length - unlinkedProjects.length,
    unlinked: unlinkedProjects.length,
    recordingUnlinked: unlinkedProjects.filter((project) => (project.source ?? 'manual') === 'recording').length,
  }
  const ganttStart = '2026-05-01'
  const ganttDays = Array.from({ length: 31 }, (_, index) => addDays(ganttStart, index))
  const ganttStartTime = new Date(`${ganttStart}T00:00:00`).getTime()

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDirection(key === 'name' ? 'asc' : 'desc')
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) {
      updateProject(String(active.id), { status: over.id as ProjectStatus })
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = form.name.trim()
    if (!trimmedName || !currentUser) return

    addProject({
      customer_id: form.customer_id || null,
      name: trimmedName,
      status: form.status,
      priority: form.priority,
      amount: Number(form.amount) || 0,
      user_id: currentUser.id,
      close_date: form.close_date || undefined,
      source: 'manual',
      note: form.note.trim() || undefined,
    })

    setForm({ name: '', customer_id: '', status: 'lead', priority: 2, amount: '', close_date: '', note: '' })
    setIsFormOpen(false)
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-background">
        <div className="bg-card border-b border-border px-4 md:px-6 py-4 shrink-0 shadow-sm z-10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">案件一覧</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">企業ごとの案件と、録音から生まれた未紐付け案件をまとめて管理します</p>
            </div>
            <div className="grid grid-cols-2 sm:flex gap-3">
              {[
                ['全案件', summary.total],
                ['企業紐付け', summary.linked],
                ['未紐付け', summary.unlinked],
                ['録音未紐付け', summary.recordingUnlinked],
              ].map(([label, value]) => (
                <div key={label as string} className="w-32">
                  <StatCard label={label as string} value={value as number} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="企業名・案件名・ラベル・メモ・担当者であいまい検索"
                  className="h-9 w-full sm:w-80 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              <select
                value={linkFilter}
                onChange={(event) => setLinkFilter(event.target.value as LinkFilter)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              >
                <option value="all">すべての紐付け状態</option>
                <option value="linked">企業紐付け済み</option>
                <option value="unlinked">未紐付けのみ</option>
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              >
                <option value="all">すべてのステータス</option>
                <option value="lead">リード</option>
                <option value="proposing">提案中</option>
                <option value="negotiating">交渉中</option>
                <option value="closed">成約</option>
              </select>
              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value as SourceFilter)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              >
                <option value="all">すべての登録元</option>
                <option value="recording">音声録音</option>
                <option value="manual">手動登録</option>
              </select>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1 border border-border/50">
                <ViewButton active={viewMode === 'table'} label="SFA表示" icon="☷" onClick={() => setViewMode('table')} />
                <ViewButton active={viewMode === 'cards'} label="カード" icon="▦" onClick={() => setViewMode('cards')} />
                <ViewButton active={viewMode === 'kanban'} label="かんばん" icon="▤" onClick={() => setViewMode('kanban')} />
                <ViewButton active={viewMode === 'gantt'} label="ガント" icon="▥" onClick={() => setViewMode('gantt')} />
              </div>
              <Button
                onClick={() => setIsFormOpen((current) => !current)}
                variant="primary"
                className="h-9 px-4 gap-1.5 shadow-sm"
              >
                <span className="text-base leading-none mb-0.5">+</span>
                <span>案件を登録</span>
              </Button>
            </div>
          </div>

          {isFormOpen && (
            <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-border bg-muted/10 p-4 shadow-sm">
              <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_220px_140px_120px_140px_150px]">
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="案件名"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  required
                />
                <select
                  value={form.customer_id}
                  onChange={(event) => setForm((current) => ({ ...current, customer_id: event.target.value }))}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                >
                  <option value="">企業未紐付け</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ProjectStatus }))}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                >
                  <option value="lead">リード</option>
                  <option value="proposing">提案中</option>
                  <option value="negotiating">交渉中</option>
                  <option value="closed">成約</option>
                </select>
                <select
                  value={form.priority}
                  onChange={(event) => setForm((current) => ({ ...current, priority: Number(event.target.value) as Project['priority'] }))}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                >
                  <option value={1}>優先度 高</option>
                  <option value={2}>優先度 中</option>
                  <option value={3}>優先度 低</option>
                </select>
                <input
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  inputMode="numeric"
                  placeholder="金額"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
                <input
                  type="date"
                  value={form.close_date}
                  onChange={(event) => setForm((current) => ({ ...current, close_date: event.target.value }))}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
                <input
                  value={form.note}
                  onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                  placeholder="メモ"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="h-9 px-4">
                    キャンセル
                  </Button>
                  <Button type="submit" variant="primary" className="h-9 px-6 shadow-sm">
                    登録
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {viewMode === 'table' && (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1520px] table-fixed text-left">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <SortButton label="案件名" sortKey="name" activeKey={sortKey} direction={sortDirection} onSort={handleSort} className="w-72" />
                    <SortButton label="企業" sortKey="customer" activeKey={sortKey} direction={sortDirection} onSort={handleSort} className="w-72" />
                    <SortButton label="ラベル" sortKey="labels" activeKey={sortKey} direction={sortDirection} onSort={handleSort} className="w-44" />
                    <SortButton label="登録元" sortKey="source" activeKey={sortKey} direction={sortDirection} onSort={handleSort} className="w-32" />
                    <SortButton label="ステータス" sortKey="status" activeKey={sortKey} direction={sortDirection} onSort={handleSort} className="w-32" />
                    <SortButton label="優先度" sortKey="priority" activeKey={sortKey} direction={sortDirection} onSort={handleSort} className="w-28" />
                    <SortButton label="金額" sortKey="amount" activeKey={sortKey} direction={sortDirection} onSort={handleSort} className="w-32" />
                    <th className="w-36 px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-500">担当者</th>
                    <SortButton label="ネクストアクション日" sortKey="next_action_date" activeKey={sortKey} direction={sortDirection} onSort={handleSort} className="w-44" />
                    <SortButton label="更新日" sortKey="updated_at" activeKey={sortKey} direction={sortDirection} onSort={handleSort} className="w-36" />
                    <th className="w-80 px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-500">メモ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filteredProjects.map((project) => {
                    const source = project.source ?? 'manual'
                    const customer = project.customer_id
                      ? customers.find((item) => item.id === project.customer_id)
                      : null
                    const owner = profiles.find((profile) => profile.id === project.user_id)
                    const isUnlinked = !project.customer_id
                    return (
                      <tr key={project.id} className={`hover:bg-muted/50 transition-colors ${isUnlinked ? 'bg-destructive/5' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {isUnlinked && (
                              <span className="shrink-0 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[11px] font-medium text-destructive">
                                要紐付け
                              </span>
                            )}
                            <span className="font-bold text-foreground truncate">
                              {project.name || '録音メモ（案件名未設定）'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {customer ? (
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground/90 truncate">{customer.name}</p>
                              <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{customer.industry}</p>
                            </div>
                          ) : (
                            <div className="inline-flex flex-col gap-1">
                              <span className="inline-flex w-fit rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-bold text-destructive">
                                企業未紐付け
                              </span>
                              <span className="text-[11px] text-destructive/80 font-medium">録音後の確認待ち</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <ProjectLabels labels={project.labels} compact />
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${sourceColor[source]}`}>
                            {sourceLabel[source]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={project.status} />
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${priorityColor[project.priority]}`}>
                            {priorityLabel[project.priority]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground/90 font-medium whitespace-nowrap">{formatAmount(project.amount)}</td>
                        <td className="px-4 py-3 text-foreground/90 font-medium whitespace-nowrap">{owner?.name ?? '未担当'}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDate(project.next_action_date)}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDate(project.updated_at)}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs truncate">{project.note ?? '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filteredProjects.length === 0 && (
                <div className="py-14 text-center">
                  <p className="text-sm text-muted-foreground font-medium">条件に一致する案件がありません</p>
                </div>
              )}
            </div>
          </div>
          )}

          {viewMode === 'cards' && (
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {filteredProjects.map((project) => {
                const customer = project.customer_id
                  ? customers.find((item) => item.id === project.customer_id)
                  : null
                const owner = profiles.find((profile) => profile.id === project.user_id)

                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    customerName={customer?.name ?? '企業未紐付け'}
                    customerIndustry={customer?.industry ?? ''}
                    ownerName={owner?.name ?? '未担当'}
                  />
                )
              })}
              {filteredProjects.length === 0 && (
                <div className="col-span-full py-14 text-center">
                  <p className="text-sm text-muted-foreground font-medium">条件に一致する案件がありません</p>
                </div>
              )}
            </div>
          )}

          {viewMode === 'kanban' && (
            <DndContext onDragEnd={handleDragEnd}>
              <div className="overflow-x-auto">
                <div className="grid min-w-[900px] grid-cols-4 gap-4">
                  {projectStatuses.map((status) => (
                    <DroppableProjectColumn
                      key={status}
                      status={status}
                      projects={filteredProjects}
                      customers={customers}
                      profiles={profiles}
                    />
                  ))}
                </div>
              </div>
            </DndContext>
          )}

          {viewMode === 'gantt' && (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <div className="min-w-[1320px]">
                  <div className="grid border-b border-border bg-muted/30" style={{ gridTemplateColumns: '360px repeat(31, 38px)' }}>
                    <div className="px-4 py-3 text-sm font-bold text-foreground">案件名</div>
                    {ganttDays.map((day) => (
                      <div key={day} className="border-l border-border px-1 py-2 text-center text-xs text-muted-foreground">
                        <div>{new Date(`${day}T00:00:00`).getDate()}</div>
                        <div className="text-[10px] text-muted-foreground/60">
                          {'日月火水木金土'[new Date(`${day}T00:00:00`).getDay()]}
                        </div>
                      </div>
                    ))}
                  </div>
                  {filteredProjects.map((project, index) => {
                    const customer = project.customer_id
                      ? customers.find((item) => item.id === project.customer_id)
                      : null
                    const startDate = toDateInput(project.created_at)
                    const endDate = project.close_date ?? addDays(startDate, 14 + (index % 10))
                    const offset = Math.max(0, Math.round((new Date(`${startDate}T00:00:00`).getTime() - ganttStartTime) / 86400000))
                    const width = Math.max(1, Math.min(31 - offset, daysBetween(startDate, endDate)))

                    return (
                      <div key={project.id} className="grid min-h-16 border-b border-border/60 hover:bg-muted/30 transition-colors" style={{ gridTemplateColumns: '360px repeat(31, 38px)' }}>
                        <div className="px-4 py-3 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            {!project.customer_id && (
                              <span className="shrink-0 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[11px] font-medium text-destructive">
                                要紐付け
                              </span>
                            )}
                            <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                          </div>
                          <p className="mt-1 text-xs text-gray-400 truncate">
                            {customer?.name ?? '企業未紐付け'} / {statusLabel[project.status]} / 次回: {formatDate(project.next_action_date)}
                          </p>
                          <div className="mt-2">
                            <ProjectLabels labels={project.labels} compact />
                          </div>
                        </div>
                        <div className="relative grid" style={{ gridColumn: '2 / span 31', gridTemplateColumns: 'repeat(31, 38px)' }}>
                          {ganttDays.map((day) => (
                            <div key={day} className="border-l border-border/60" />
                          ))}
                          <div
                            className={`absolute top-4 h-8 rounded-lg px-3 text-xs font-medium flex items-center overflow-hidden ${
                              project.status === 'closed'
                                ? 'bg-green-500 text-white'
                                : project.status === 'negotiating'
                                  ? 'bg-yellow-400 text-white'
                                  : project.status === 'proposing'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-primary text-primary-foreground'
                            }`}
                            style={{ left: `${Math.min(offset, 30) * 38 + 6}px`, width: `${Math.max(1, width) * 38 - 12}px` }}
                          >
                            <span className="truncate">{project.name}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {filteredProjects.length === 0 && (
                    <div className="py-14 text-center">
                      <p className="text-sm text-muted-foreground font-medium">条件に一致する案件がありません</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
