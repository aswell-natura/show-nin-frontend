import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useDataStore } from '../../../context/DataStoreContext'

export default function ManagerAtRisk() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { profiles, projects, activities, customers } = useDataStore()

  const myTeam = profiles.filter((p) => p.manager_id === currentUser!.id)
  const allProjects = projects.filter((p) => myTeam.some((m) => m.id === p.user_id))

  const staleProjects = allProjects.filter((p) => {
    if (p.status === 'closed') return false
    const lastActivity = activities
      .filter((a) => a.project_id === p.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    if (!lastActivity) return true
    const daysSince = (Date.now() - new Date(lastActivity.created_at).getTime()) / 1000 / 60 / 60 / 24
    return daysSince >= 3
  })

  return (
    <div className="h-full overflow-y-auto px-4 md:px-5 py-5">
      <div className="flex items-center gap-2 mb-4">
        <p className="text-sm font-semibold text-gray-900">要チェック案件</p>
        {staleProjects.length > 0 && (
          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">
            {staleProjects.length}件
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {staleProjects.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">要フォロー案件はありません</p>
        ) : (
          staleProjects.map((p) => {
            const customer = customers.find((c) => c.id === p.customer_id)
            const owner = myTeam.find((m) => m.id === p.user_id)
            return (
              <button
                key={p.id}
                onClick={() => navigate(`/customers/${p.customer_id}`)}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 transition-colors text-left"
              >
                <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{customer?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{p.name}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{owner?.name.split(' ')[0]}</span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
