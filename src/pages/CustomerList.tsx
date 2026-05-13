import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { useDataStore } from '../context/DataStoreContext'
import type { CustomerRank } from '../types'

const rankColor: Record<CustomerRank, string> = {
  A: 'bg-blue-100 text-blue-700',
  B: 'bg-gray-100 text-gray-600',
  C: 'bg-gray-100 text-gray-400',
}

const statusColor: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-600',
  proposing: 'bg-blue-100 text-blue-700',
  negotiating: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-green-100 text-green-700',
}
const statusLabel: Record<string, string> = {
  lead: 'リード', proposing: '提案中', negotiating: '交渉中', closed: '成約',
}

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
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-colors ${
        active ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {icon}
    </button>
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
  }, [search, rankFilter, sortKey, pinnedOnly, customers, projects, activities])

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* ページヘッダー */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 shrink-0">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">顧客一覧</h1>
              <p className="text-xs text-gray-400 mt-0.5">企業ごとの案件・活動状況を管理します</p>
            </div>
            <div className="grid grid-cols-2 sm:flex gap-2">
              {[
                ['顧客数', customers.length],
                ['ランクA', rankACount],
                ['進行中', activeCustomerCount],
                ['ピン留め', pinnedCount],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-[11px] text-gray-400">{label}</p>
                  <p className="text-lg font-bold text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* フィルターバー */}
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            {/* 検索 */}
            <div className="relative flex-1 max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="企業名・業種・ラベル・流入経路で検索"
                className="h-9 w-full pl-8 pr-3 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-blue-100 placeholder-gray-400"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {/* ランクフィルター */}
              <select
                value={rankFilter}
                onChange={(e) => setRankFilter(e.target.value as RankFilter)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none"
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
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none"
              >
                <option value="last_accessed">最終アクセス順</option>
                <option value="name">名前順</option>
                <option value="rank">ランク順</option>
              </select>

              {/* ピン留めフィルター */}
              <button
                onClick={() => setPinnedOnly((v) => !v)}
                className={`h-9 px-3 text-sm rounded-lg border transition-all ${
                  pinnedOnly
                    ? 'bg-blue-50 border-blue-200 text-blue-600 font-medium'
                    : 'border-gray-200 text-gray-600 hover:text-gray-700'
                }`}
              >
                📌 ピン留め
              </button>

              <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
                <ViewButton active={viewMode === 'table'} label="表形式" icon="☷" onClick={() => setViewMode('table')} />
                <ViewButton active={viewMode === 'cards'} label="カード" icon="▦" onClick={() => setViewMode('cards')} />
              </div>

              <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 text-sm font-medium text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="hidden sm:inline">顧客を追加</span>
              </button>
            </div>
          </div>
        </div>

        {/* 顧客リスト */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
              <p className="text-sm">条件に一致する顧客がありません</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="p-4 md:p-6">
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1180px] table-fixed text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-20 px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">ランク</th>
                        <th className="w-64 px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">顧客名</th>
                        <th className="w-40 px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">ラベル</th>
                        <th className="w-36 px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">流入経路</th>
                        <th className="w-52 px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">進行中案件</th>
                        <th className="w-28 px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">案件金額</th>
                        <th className="w-56 px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">最終活動</th>
                        <th className="w-28 px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">最終アクセス</th>
                        <th className="w-16 px-4 py-3 text-xs font-medium text-gray-500 text-right whitespace-nowrap">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
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
                            className="cursor-pointer bg-white hover:bg-gray-50"
                          >
                            <td className="px-4 py-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${rankColor[customer.rank]}`}>
                                {customer.rank}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
                                  {customer.is_pinned && (
                                    <span className="text-gray-400 text-xs shrink-0">📌</span>
                                  )}
                                </div>
                                <p className="mt-0.5 text-xs text-gray-400 truncate">{customer.industry}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600 truncate">{formatCustomerLabels(customer.labels)}</td>
                            <td className="px-4 py-3 text-gray-600 truncate">{customer.acquisition_source ?? '-'}</td>
                            <td className="px-4 py-3">
                              {activeProjects.length > 0 ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {activeProjects.slice(0, 2).map((p) => (
                                    <span key={p.id} className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusColor[p.status]}`}>
                                      {statusLabel[p.status]}
                                    </span>
                                  ))}
                                  {activeProjects.length > 2 && (
                                    <span className="text-xs text-gray-400">+{activeProjects.length - 2}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">進行中案件なし</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                              {activeProjects.length > 0 ? `${(totalAmount / 10000).toLocaleString()}万円` : '-'}
                            </td>
                            <td className="px-4 py-3">
                              {latestActivity ? (
                                <div className="min-w-0">
                                  <p className="text-xs text-gray-600 truncate">{latestActivity.title}</p>
                                  <p className="mt-0.5 text-xs text-gray-400">{formatRelative(latestActivity.created_at)}</p>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-300">活動なし</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatRelative(customer.last_accessed_at)}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-gray-300">›</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
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
                    className="w-full flex items-center gap-4 px-4 md:px-6 py-3.5 bg-white hover:bg-gray-50 transition-colors text-left"
                  >
                    {/* ランクバッジ */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${rankColor[customer.rank]}`}>
                      {customer.rank}
                    </div>

                    {/* メイン情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 truncate">{customer.name}</p>
                        {customer.is_pinned && (
                          <span className="text-gray-400 text-xs shrink-0">📌</span>
                        )}
                        <span className="text-xs text-gray-400 shrink-0">{customer.industry}</span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>
                          <span className="text-gray-400">ラベル: </span>
                          {formatCustomerLabels(customer.labels)}
                        </span>
                        <span>
                          <span className="text-gray-400">流入経路: </span>
                          {customer.acquisition_source ?? '-'}
                        </span>
                      </div>

                      {/* 進行中案件 */}
                      {activeProjects.length > 0 ? (
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {activeProjects.slice(0, 2).map((p) => (
                            <span key={p.id} className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusColor[p.status]}`}>
                              {statusLabel[p.status]}
                            </span>
                          ))}
                          {activeProjects.length > 2 && (
                            <span className="text-xs text-gray-400">+{activeProjects.length - 2}</span>
                          )}
                          <span className="text-xs text-gray-400">
                            {(totalAmount / 10000).toLocaleString()}万円
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">進行中案件なし</p>
                      )}
                    </div>

                    {/* 最終活動 */}
                    <div className="shrink-0 text-right hidden sm:block">
                      {latestActivity ? (
                        <>
                          <p className="text-xs text-gray-500 truncate max-w-40">{latestActivity.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatRelative(latestActivity.created_at)}</p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-300">活動なし</p>
                      )}
                    </div>

                    {/* シェブロン */}
                    <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
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
