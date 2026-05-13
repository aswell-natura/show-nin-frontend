import { useAuth } from '../../../context/AuthContext'
import { useDataStore } from '../../../context/DataStoreContext'

function formatAmount(n: number) {
  return (n / 10000).toLocaleString('ja-JP') + '万円'
}

const stages = [
  { key: 'lead',        label: 'リード',  color: 'bg-gray-300' },
  { key: 'proposing',   label: '提案中',  color: 'bg-blue-400' },
  { key: 'negotiating', label: '交渉中',  color: 'bg-yellow-400' },
  { key: 'closed',      label: '成約',   color: 'bg-green-500' },
]

export default function ManagerTeamPipeline() {
  const { currentUser } = useAuth()
  const { profiles, projects, targets } = useDataStore()

  const myTeam = profiles.filter((p) => p.manager_id === currentUser!.id)
  const allProjects = projects.filter((p) => myTeam.some((m) => m.id === p.user_id))
  const target = targets.find(
    (t) => t.type === 'team' && t.manager_id === currentUser!.id && t.target_month === '2026-05-01'
  )

  const counts = {
    lead: allProjects.filter((p) => p.status === 'lead').length,
    proposing: allProjects.filter((p) => p.status === 'proposing').length,
    negotiating: allProjects.filter((p) => p.status === 'negotiating').length,
    closed: allProjects.filter((p) => p.status === 'closed').length,
  }
  const maxCount = Math.max(...Object.values(counts), 1)

  return (
    <div className="h-full overflow-y-auto px-4 md:px-5 py-5">
      <p className="text-sm font-semibold text-gray-900 mb-4">チームパイプライン</p>
      <div className="flex flex-col gap-3">
        {stages.map((stage) => {
          const count = counts[stage.key as keyof typeof counts]
          const pct = Math.round((count / maxCount) * 100)
          return (
            <div key={stage.key} className="flex items-center gap-3">
              <p className="text-xs text-gray-500 w-14 shrink-0">{stage.label}</p>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className={`h-5 rounded-full ${stage.color} transition-all duration-500 flex items-center justify-end pr-2`}
                  style={{ width: `${Math.max(pct, 8)}%` }}
                >
                  <span className="text-xs text-white font-bold">{count}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {target && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">チーム目標 {formatAmount(target.amount)}</p>
        </div>
      )}
    </div>
  )
}
