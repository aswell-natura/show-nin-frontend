import { useMemo, useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { useDataStore } from '../../context/DataStoreContext'
import { mockAudioMinutes } from '../../data/mock'
import type { AudioMinute } from '../../types'
import { StatCard } from '../../components/dashboard/shared/StatCard'
import { Button } from '@/components/ui/button'

type SortKey = 'title' | 'customer' | 'project' | 'recording_date' | 'start_time' | 'end_time' | 'created_at'
type SortDirection = 'asc' | 'desc'
type LinkFilter = 'all' | 'linked' | 'unlinked'

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, '')
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

function compareValue(a: string | undefined, b: string | undefined) {
  return (a ?? '').localeCompare(b ?? '', 'ja')
}

function SortButton({
  label, sortKey, activeKey, direction, onSort, className = '',
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

function openDetailWindow(id: string) {
  const width = 860
  const height = 820
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2)
  const top = Math.max(0, window.screenY + 40)
  const features = [
    `width=${width}`, `height=${height}`, `left=${left}`, `top=${top}`,
    'resizable=yes', 'scrollbars=yes',
  ].join(',')
  const popup = window.open(`/minutes/${id}`, `minute_${id}`, features)
  if (popup) popup.focus()
  else window.open(`/minutes/${id}`, '_blank')
}

export default function AudioMinuteList() {
  const { customers, projects, profiles } = useDataStore()
  const [search, setSearch] = useState('')
  const [linkFilter, setLinkFilter] = useState<LinkFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('recording_date')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')

  function handleSort(key: SortKey) {
    if (sortKey === key) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return }
    setSortKey(key)
    setSortDir('desc')
  }

  const filteredMinutes = useMemo(() => {
    const query = normalizeSearch(search)
    return [...mockAudioMinutes]
      .filter((m: AudioMinute) => {
        const customer = m.customer_id ? customers.find(c => c.id === m.customer_id) : null
        const project = m.project_id ? projects.find(p => p.id === m.project_id) : null
        const owner = profiles.find(p => p.id === m.user_id)
        const isLinked = Boolean(m.customer_id)
        const searchable = normalizeSearch([
          m.title, customer?.name ?? '', project?.name ?? '',
          m.recording_date, owner?.name ?? '',
        ].join(' '))
        const matchesSearch = !query || searchable.includes(query)
        const matchesLink =
          linkFilter === 'all' ||
          (linkFilter === 'linked' && isLinked) ||
          (linkFilter === 'unlinked' && !isLinked)
        return matchesSearch && matchesLink
      })
      .sort((a, b) => {
        const custA = a.customer_id ? customers.find(c => c.id === a.customer_id)?.name : undefined
        const custB = b.customer_id ? customers.find(c => c.id === b.customer_id)?.name : undefined
        const projA = a.project_id ? projects.find(p => p.id === a.project_id)?.name : undefined
        const projB = b.project_id ? projects.find(p => p.id === b.project_id)?.name : undefined
        const vals: Record<SortKey, [string | undefined, string | undefined]> = {
          title:          [a.title, b.title],
          customer:       [custA, custB],
          project:        [projA, projB],
          recording_date: [a.recording_date, b.recording_date],
          start_time:     [a.start_time, b.start_time],
          end_time:       [a.end_time, b.end_time],
          created_at:     [a.created_at, b.created_at],
        }
        const result = compareValue(...vals[sortKey])
        return sortDir === 'asc' ? result : -result
      })
  }, [search, linkFilter, sortKey, sortDir, customers, projects, profiles])

  const linked = mockAudioMinutes.filter(m => m.customer_id !== null).length
  const unlinked = mockAudioMinutes.length - linked
  const withAudio = mockAudioMinutes.filter(m => m.audio_url !== null).length

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-background">
        {/* ページヘッダー */}
        <div className="bg-card border-b border-border px-4 md:px-6 py-4 shrink-0 shadow-sm z-10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">議事録一覧</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">録音から生成された音声議事録をまとめて管理します</p>
            </div>
            <div className="grid grid-cols-2 sm:flex gap-3">
              {[
                ['全件', mockAudioMinutes.length],
                ['企業紐付き', linked],
                ['未紐付け', unlinked],
                ['音声あり', withAudio],
              ].map(([label, value]) => (
                <div key={String(label)} className="w-28">
                  <StatCard label={String(label)} value={value as number} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="議事録名・企業名・案件名で検索"
                className="h-9 w-full sm:w-96 rounded-lg border border-border bg-card pl-8 pr-3 text-sm outline-none placeholder-gray-400 focus:ring-2 focus:border-primary focus:ring-1 focus:ring-primary transition-colors border-input"
              />
            </div>
            <select
              value={linkFilter}
              onChange={e => setLinkFilter(e.target.value as LinkFilter)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            >
              <option value="all">すべての紐付け状態</option>
              <option value="linked">企業紐付き</option>
              <option value="unlinked">未紐付けのみ</option>
            </select>
          </div>
        </div>

        {/* テーブル */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] table-fixed text-left">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <SortButton label="議事録名" sortKey="title" activeKey={sortKey} direction={sortDir} onSort={handleSort} className="w-60" />
                    <SortButton label="企業名" sortKey="customer" activeKey={sortKey} direction={sortDir} onSort={handleSort} className="w-44" />
                    <SortButton label="案件名" sortKey="project" activeKey={sortKey} direction={sortDir} onSort={handleSort} className="w-44" />
                    <SortButton label="取得日" sortKey="recording_date" activeKey={sortKey} direction={sortDir} onSort={handleSort} className="w-28" />
                    <SortButton label="開始時刻" sortKey="start_time" activeKey={sortKey} direction={sortDir} onSort={handleSort} className="w-24" />
                    <SortButton label="終了時刻" sortKey="end_time" activeKey={sortKey} direction={sortDir} onSort={handleSort} className="w-24" />
                    <th className="w-24 px-4 py-3 whitespace-nowrap text-xs font-medium text-muted-foreground">音声</th>
                    <th className="w-24 px-4 py-3 whitespace-nowrap text-xs font-medium text-muted-foreground text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filteredMinutes.map(m => {
                    const customer = m.customer_id ? customers.find(c => c.id === m.customer_id) : null
                    const project = m.project_id ? projects.find(p => p.id === m.project_id) : null
                    const isUnlinked = !m.customer_id

                    return (
                      <tr key={m.id} className={`hover:bg-muted/30 ${isUnlinked ? 'bg-destructive/5' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {isUnlinked && (
                              <span className="shrink-0 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[11px] font-medium text-destructive font-bold">
                                未紐付け
                              </span>
                            )}
                            <span className="font-bold text-foreground truncate">{m.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {customer ? (
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground/90 truncate">{customer.name}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground truncate">{customer.industry?.join("、")}</p>
                            </div>
                          ) : (
                            <span className="inline-flex rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive font-bold">
                              未確認
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {project ? (
                            <p className="text-foreground/90 truncate">{project.name}</p>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground/80 whitespace-nowrap">{formatDate(m.recording_date)}</td>
                        <td className="px-4 py-3 text-muted-foreground/80 whitespace-nowrap font-mono text-xs">{m.start_time}</td>
                        <td className="px-4 py-3 text-muted-foreground/80 whitespace-nowrap font-mono text-xs">{m.end_time}</td>
                        <td className="px-4 py-3">
                          {m.audio_url ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary font-bold">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                              </svg>
                              あり
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">なし</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openDetailWindow(m.id)}
                            className="gap-1.5 h-8 text-xs font-medium"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            表示
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filteredMinutes.length === 0 && (
                <div className="py-14 text-center">
                  <p className="text-sm text-muted-foreground">条件に一致する議事録がありません</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
