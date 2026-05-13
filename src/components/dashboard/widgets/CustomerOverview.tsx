import { useNavigate } from 'react-router-dom'
import { useDataStore } from '../../../context/DataStoreContext'
import type { CustomerRank } from '../../../types'

const rankColor: Record<CustomerRank, string> = {
  A: 'bg-blue-100 text-blue-700',
  B: 'bg-gray-100 text-gray-600',
  C: 'bg-gray-100 text-gray-400',
}

const referenceTime = new Date('2026-05-09T00:00:00').getTime()

function formatRelative(iso: string) {
  const diff = Math.floor((referenceTime - new Date(iso).getTime()) / 1000 / 60 / 60 / 24)
  if (diff === 0) return '今日'
  if (diff === 1) return '昨日'
  if (diff < 7) return `${diff}日前`
  return new Date(iso).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })
}

export default function CustomerOverview() {
  const navigate = useNavigate()
  const { customers, projects, activities } = useDataStore()
  const sortedCustomers = [...customers].sort(
    (a, b) => new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime(),
  )
  const pinnedCount = customers.filter((customer) => customer.is_pinned).length
  const rankACount = customers.filter((customer) => customer.rank === 'A').length
  const activeCustomerCount = customers.filter((customer) =>
    projects.some((project) => project.customer_id === customer.id && project.status !== 'closed'),
  ).length

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">顧客一覧</h2>
          <p className="text-xs text-gray-400 mt-0.5">企業別の案件・活動状況</p>
        </div>
        <button
          onClick={() => navigate('/customers')}
          className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
        >
          開く
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 p-4 border-b border-gray-100">
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-[11px] text-gray-400">顧客数</p>
          <p className="text-lg font-bold text-gray-900">{customers.length}</p>
        </div>
        <div className="rounded-lg bg-blue-50 px-3 py-2">
          <p className="text-[11px] text-blue-600">ランクA</p>
          <p className="text-lg font-bold text-blue-700">{rankACount}</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-[11px] text-gray-400">進行中</p>
          <p className="text-lg font-bold text-gray-900">{activeCustomerCount}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 text-xs text-gray-400">
        <span>ピン留め {pinnedCount}件</span>
        <span>・</span>
        <span>最終アクセス順</span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {sortedCustomers.slice(0, 12).map((customer) => {
          const activeProjects = projects.filter(
            (project) => project.customer_id === customer.id && project.status !== 'closed',
          )
          const latestActivity = activities
            .filter((activity) => activity.customer_id === customer.id)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

          return (
            <button
              key={customer.id}
              onClick={() => navigate(`/customers/${customer.id}`)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${rankColor[customer.rank]}`}>
                    {customer.rank}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{customer.name}</p>
                      {customer.is_pinned && <span className="text-xs text-gray-400 shrink-0">ピン</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400 truncate">{customer.industry}</p>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-gray-400">{formatRelative(customer.last_accessed_at)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                <span className="text-gray-500 truncate">
                  {latestActivity ? latestActivity.title : '活動なし'}
                </span>
                <span className="text-gray-400 shrink-0">
                  {activeProjects.length > 0 ? `進行中 ${activeProjects.length}件` : '案件なし'}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
