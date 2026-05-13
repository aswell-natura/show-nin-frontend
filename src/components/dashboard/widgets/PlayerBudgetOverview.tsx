import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useDataStore } from '../../../context/DataStoreContext'

function formatAmount(amount: number) {
  return `${(amount / 10000).toLocaleString()}万円`
}

export default function PlayerBudgetOverview() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { projects, targets } = useDataStore()
  const target = targets.find((item) =>
    item.type === 'individual' && item.user_id === currentUser?.id && item.target_month === '2026-05-01',
  )
  const myProjects = projects.filter((project) => project.user_id === currentUser?.id)
  const closedAmount = myProjects.filter((project) => project.status === 'closed').reduce((sum, project) => sum + project.amount, 0)
  const pipelineAmount = myProjects.filter((project) => project.status !== 'closed').reduce((sum, project) => sum + project.amount, 0)
  const targetAmount = target?.amount ?? 0
  const projectedAmount = closedAmount + pipelineAmount
  const projectedProgress = targetAmount ? Math.round((projectedAmount / targetAmount) * 100) : 0

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">予算・実績</h2>
          <p className="text-xs text-gray-400 mt-0.5">配分予算と現在見込み</p>
        </div>
        <button
          onClick={() => navigate('/my-budget')}
          className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
        >
          開く
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 p-4 border-b border-gray-100">
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-[11px] text-gray-400">配分予算</p>
          <p className="text-sm font-bold text-gray-900">{formatAmount(targetAmount)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-[11px] text-gray-400">成約実績</p>
          <p className="text-sm font-bold text-gray-900">{formatAmount(closedAmount)}</p>
        </div>
        <div className="rounded-lg bg-blue-50 px-3 py-2">
          <p className="text-[11px] text-blue-600">見込み</p>
          <p className="text-sm font-bold text-blue-700">{projectedProgress}%</p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{formatAmount(projectedAmount)}</span>
          <span>{formatAmount(targetAmount)}</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(projectedProgress, 100)}%` }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {myProjects.slice(0, 5).map((project) => (
          <button
            key={project.id}
            onClick={() => navigate('/my-budget')}
            className="w-full px-4 py-3 text-left hover:bg-gray-50"
          >
            <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
            <p className="mt-0.5 text-xs text-gray-400">{formatAmount(project.amount)}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
