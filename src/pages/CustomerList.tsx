import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { useDataStore } from '../context/DataStoreContext'
import type { CustomerRank } from '../types'
import { StatCard } from '../components/dashboard/shared/StatCard'
import { RankBadge, StatusBadge } from '../components/dashboard/shared/StatusBadge'
import { Button } from '@/components/ui/button'

function formatRelative(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000 / 60 / 60 / 24)
  if (diff === 0) return '今日'
  if (diff === 1) return '昨日'
  if (diff < 7) return `${diff}日前`
  return new Date(iso).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

type SortKey = 'last_accessed' | 'name' | 'rank'
type RankFilter = 'all' | CustomerRank
type ViewMode = 'table' | 'cards'

function formatCustomerLabels(labels?: string[]) {
  return labels?.length ? labels.join('、') : '-'
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
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
      title={label}
      className={`w-9 h-9 p-0 rounded-md transition-colors ${
        active ? 'bg-foreground text-background hover:bg-foreground/90' : 'text-muted-foreground hover:bg-muted'
      }`}
    >
      {icon}
    </Button>
  )
}

export default function CustomerList() {
  const navigate = useNavigate()
  const { customers, projects, activities } = useDataStore()
  const [search, setSearch] = useState('')
  const [rankFilter, setRankFilter] = useState<RankFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('last_accessed')
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  const rankACount = customers.filter((c) => c.rank === 'A').length
  const activeCustomerCount = customers.filter((c) =>
    projects.some((p) => p.customer_id === c.id && p.status !== 'closed'),
  ).length
  const pinnedCount = customers.filter((c) => c.is_pinned).length

  const filtered = useMemo(() => {
    let list = [...customers]

    if (search.trim()) {
      const q = search.trim()
      list = list.filter(
        (c) =>
          c.name.includes(q) ||
          c.industry.includes(q) ||
          (c.labels?.join('、') ?? '').includes(q) ||
          (c.acquisition_source ?? '').includes(q)
      )
    }
    if (rankFilter !== 'all') {
      list = list.filter((c) => c.rank === rankFilter)
    }
    if (pinnedOnly) {
      list = list.filter((c) => c.is_pinned)
    }

    list.sort((a, b) => {
      if (sortKey === 'last_accessed') {
        return new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime()
      }
      if (sortKey === 'name') return a.name.localeCompare(b.name, 'ja')
      if (sortKey === 'rank') return a.rank.localeCompare(b.rank)
      return 0
    })

    return list
  }, [search, rankFilter, sortKey, pinnedOnly, customers])

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-background">
        {/* ページヘッダー */}
        <div className="bg-card border-b border-border px-4 md:px-6 py-4 shrink-0 shadow-sm z-10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">顧客一覧</h1>
              <p className="text-xs text-muted-foreground mt-0.5">企業ごとの案件・活動状況を管理します</p>
            </div>
            <div className="grid grid-cols-2 sm:flex gap-2">
              {[
                { label: '顧客数', value: customers.length },
                { label: 'ランクA', value: rankACount, labelClass: 'text-blue-600', valueClass: 'text-blue-700' },
                { label: '進行中', value: activeCustomerCount },
                { label: 'ピン留め', value: pinnedCount },
              ].map((stat) => (
                <StatCard 
                  key={stat.label} 
                  label={stat.label} 
                  value={stat.value} 
                  labelClassName={stat.labelClass} 
                  valueClassName={stat.valueClass}
                  className="bg-muted/30 shadow-none border-border/50"
                />
              ))}
            </div>
          </div>

          {/* フィルターバー */}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            {/* 検索 */}
            <div className="relative flex-1 max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="企業名・業種・ラベル・流入経路で検索"
                className="h-9 w-full pl-8 pr-3 text-sm rounded-md border border-input bg-background text-foreground outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground transition-all shadow-sm"
              />
            </div>

            <div className="flex gap-2 flex-wrap items-center">
              {/* ランクフィルター */}
              <select
                value={rankFilter}
                onChange={(e) => setRankFilter(e.target.value as RankFilter)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring focus:border-transparent shadow-sm cursor-pointer"
              >
                <option value="all">すべてのランク</option>
                <option value="A">ランクA</option>
                <option value="B">ランクB</option>
                <option value="C">ランクC</option>
              </select>

              {/* ソート */}
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring focus:border-transparent shadow-sm cursor-pointer"
              >
                <option value="last_accessed">最終アクセス順</option>
                <option value="name">名前順</option>
                <option value="rank">ランク順</option>
              </select>

              {/* ピン留めフィルター */}
              <Button
                variant={pinnedOnly ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPinnedOnly((v) => !v)}
                className={`h-9 border shadow-sm ${pinnedOnly ? 'border-primary/50 text-primary bg-primary/5' : 'text-muted-foreground'}`}
              >
                📌 ピン留め
              </Button>

              <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                <ViewButton active={viewMode === 'table'} label="表形式" icon="☷" onClick={() => setViewMode('table')} />
                <ViewButton active={viewMode === 'cards'} label="カード" icon="▦" onClick={() => setViewMode('cards')} />
              </div>

              <Button variant="primary" className="h-9 gap-1.5 ml-auto sm:ml-0 shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="hidden sm:inline">顧客を追加</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 顧客リスト */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/10">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2 bg-card rounded-lg border border-border">
              <svg className="w-8 h-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
              <p className="text-sm">条件に一致する顧客がありません</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] table-fixed text-left">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="w-20 px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap uppercase tracking-wider">ランク</th>
                      <th className="w-64 px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap uppercase tracking-wider">顧客名</th>
                      <th className="w-40 px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap uppercase tracking-wider">ラベル</th>
                      <th className="w-36 px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap uppercase tracking-wider">流入経路</th>
                      <th className="w-52 px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap uppercase tracking-wider">進行中案件</th>
                      <th className="w-28 px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap uppercase tracking-wider">案件金額</th>
                      <th className="w-56 px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap uppercase tracking-wider">最終活動</th>
                      <th className="w-28 px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap uppercase tracking-wider">最終アクセス</th>
                      <th className="w-16 px-4 py-3 text-xs font-medium text-muted-foreground text-right whitespace-nowrap uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {filtered.map((customer) => {
                      const activeProjects = projects.filter(
                        (p) => p.customer_id === customer.id && p.status !== 'closed'
                      )
                      const latestActivity = activities
                        .filter((a) => a.customer_id === customer.id)
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                      const totalAmount = activeProjects.reduce((s, p) => s + p.amount, 0)

                      return (
                        <tr
                          key={customer.id}
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          className="cursor-pointer bg-card hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <RankBadge rank={customer.rank} size="lg" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 min-w-0 mb-0.5">
                                <p className="font-semibold text-foreground truncate">{customer.name}</p>
                                {customer.is_pinned && (
                                  <span className="text-muted-foreground text-xs shrink-0 bg-muted px-1 rounded-sm">📌</span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{customer.industry}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground truncate">{formatCustomerLabels(customer.labels)}</td>
                          <td className="px-4 py-3 text-muted-foreground truncate">{customer.acquisition_source ?? '-'}</td>
                          <td className="px-4 py-3">
                            {activeProjects.length > 0 ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {activeProjects.slice(0, 2).map((p) => (
                                  <StatusBadge key={p.id} status={p.status} />
                                ))}
                                {activeProjects.length > 2 && (
                                  <span className="text-[11px] text-muted-foreground">+{activeProjects.length - 2}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground/70">進行中案件なし</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap font-medium">
                            {activeProjects.length > 0 ? `${(totalAmount / 10000).toLocaleString()}万円` : '-'}
                          </td>
                          <td className="px-4 py-3">
                            {latestActivity ? (
                              <div className="min-w-0">
                                <p className="text-xs text-foreground/80 truncate">{latestActivity.title}</p>
                                <p className="mt-1 text-[11px] text-muted-foreground">{formatRelative(latestActivity.created_at)}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground/70">活動なし</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{formatRelative(customer.last_accessed_at)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-muted-foreground/50 group-hover:text-foreground">›</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((customer) => {
                const activeProjects = projects.filter(
                  (p) => p.customer_id === customer.id && p.status !== 'closed'
                )
                const latestActivity = activities
                  .filter((a) => a.customer_id === customer.id)
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                const totalAmount = activeProjects.reduce((s, p) => s + p.amount, 0)

                return (
                  <button
                    key={customer.id}
                    onClick={() => navigate(`/customers/${customer.id}`)}
                    className="w-full flex flex-col gap-3 p-4 bg-card border border-border rounded-xl hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3 w-full">
                      <RankBadge rank={customer.rank} size="lg" className="shrink-0" />
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-bold text-foreground truncate">{customer.name}</p>
                          {customer.is_pinned && (
                            <span className="text-muted-foreground text-xs shrink-0 bg-muted px-1.5 py-0.5 rounded-md">📌</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{customer.industry}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 w-full text-xs text-muted-foreground pt-2 border-t border-border/50">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">ラベル</span>
                        <span className="truncate text-foreground/80">{formatCustomerLabels(customer.labels)}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">流入経路</span>
                        <span className="truncate text-foreground/80">{customer.acquisition_source ?? '-'}</span>
                      </div>
                    </div>

                    <div className="w-full pt-2 border-t border-border/50">
                      {activeProjects.length > 0 ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {activeProjects.slice(0, 2).map((p) => (
                              <StatusBadge key={p.id} status={p.status} />
                            ))}
                            {activeProjects.length > 2 && (
                              <span className="text-[11px] text-muted-foreground">+{activeProjects.length - 2}</span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-foreground/90 shrink-0">
                            {(totalAmount / 10000).toLocaleString()}万円
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground/70">進行中案件なし</p>
                      )}
                    </div>

                    <div className="w-full pt-2 border-t border-border/50 flex items-end justify-between">
                      <div className="min-w-0 flex-1 pr-4">
                        {latestActivity ? (
                          <>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">最終活動</p>
                            <p className="text-xs text-foreground/80 truncate">{latestActivity.title}</p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground/70 mt-3">活動なし</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] text-muted-foreground">{formatRelative(customer.last_accessed_at)}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
