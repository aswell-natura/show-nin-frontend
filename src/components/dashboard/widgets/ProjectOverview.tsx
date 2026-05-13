import { useNavigate } from 'react-router-dom'
import { useDataStore } from '../../../context/DataStoreContext'
import type { ProjectStatus } from '../../../types'

const statusLabel: Record<ProjectStatus, string> = {
  lead: 'リード',
  proposing: '提案中',
  negotiating: '交渉中',
  closed: '成約',
}

const statusColor: Record<ProjectStatus, string> = {
  lead: 'bg-gray-100 text-gray-600',
  proposing: 'bg-blue-100 text-blue-700',
  negotiating: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-green-100 text-green-700',
}

function formatAmount(amount: number) {
  if (!amount) return '未設定'
  return `${(amount / 10000).toLocaleString()}万円`
}

function formatDate(value?: string) {
  if (!value) return '-'
  return new Date(`${value}T00:00:00`).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })
}

export default function ProjectOverview() {
  const navigate = useNavigate()
  const { projects, customers } = useDataStore()
  const sortedProjects = [...projects].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )
  const unlinkedCount = projects.filter((project) => project.customer_id === null).length
  const activeCount = projects.filter((project) => project.status !== 'closed').length

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">案件一覧</h2>
          <p className="text-xs text-gray-400 mt-0.5">企業紐付けと未紐付け案件</p>
        </div>
        <button
          onClick={() => navigate('/projects')}
          className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
        >
          開く
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 p-4 border-b border-gray-100">
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-[11px] text-gray-400">全案件</p>
          <p className="text-lg font-bold text-gray-900">{projects.length}</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-[11px] text-gray-400">進行中</p>
          <p className="text-lg font-bold text-gray-900">{activeCount}</p>
        </div>
        <div className="rounded-lg bg-red-50 px-3 py-2">
          <p className="text-[11px] text-red-500">未紐付け</p>
          <p className="text-lg font-bold text-red-700">{unlinkedCount}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {sortedProjects.slice(0, 12).map((project) => {
          const customer = project.customer_id
            ? customers.find((item) => item.id === project.customer_id)
            : null
          const isUnlinked = !project.customer_id

          return (
            <button
              key={project.id}
              onClick={() => navigate('/projects')}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${isUnlinked ? 'bg-red-50/35' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    {isUnlinked && (
                      <span className="shrink-0 rounded-md bg-red-100 px-1.5 py-0.5 text-[11px] font-medium text-red-700">
                        要紐付け
                      </span>
                    )}
                    <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                  </div>
                  <p className={`mt-1 text-xs truncate ${isUnlinked ? 'text-red-500' : 'text-gray-400'}`}>
                    {customer ? customer.name : '企業未紐付け'}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[project.status]}`}>
                  {statusLabel[project.status]}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-400">
                <span>{formatAmount(project.amount)}</span>
                <span>{formatDate(project.close_date)}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
