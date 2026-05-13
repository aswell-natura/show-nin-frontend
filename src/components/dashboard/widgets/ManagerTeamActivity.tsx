import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useDataStore } from '../../../context/DataStoreContext'
import ActivityTypeIcon from './ActivityTypeIcon'

function formatDate(iso: string) {
  const d = new Date(iso)
  const diff = Math.floor((Date.now() - d.getTime()) / 1000 / 60)
  if (diff < 60) return `${diff}分前`
  if (diff < 60 * 24) return `${Math.floor(diff / 60)}時間前`
  return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

export default function ManagerTeamActivity() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { profiles, projects, activities, customers, targets } = useDataStore()

  const myTeam = profiles.filter((p) => p.manager_id === currentUser!.id)

  return (
    <div className="h-full overflow-y-auto px-4 md:px-5 py-5">
      <p className="text-sm font-semibold text-gray-900 mb-4">メンバー別活動状況</p>
      <div className="flex flex-col gap-3">
        {myTeam.map((member) => {
          const memberActivities = activities
            .filter((a) => a.user_id === member.id)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3)

          const memberTarget = targets.find(
            (t) => t.type === 'individual' && t.user_id === member.id && t.target_month === '2026-05-01'
          )
          const closedAmount = projects
            .filter((p) => p.user_id === member.id && p.status === 'closed')
            .reduce((sum, p) => sum + p.amount, 0)
          const achieveRate = memberTarget
            ? Math.round((closedAmount / memberTarget.amount) * 100)
            : 0

          return (
            <div key={member.id} className="border border-gray-100 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                  {member.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-400 truncate">{member.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">達成率</p>
                  <p className={`text-sm font-bold ${
                    achieveRate >= 100 ? 'text-green-600' : achieveRate >= 70 ? 'text-blue-600' : 'text-yellow-600'
                  }`}>{achieveRate}%</p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {memberActivities.map((act) => {
                  const cust = customers.find((c) => c.id === act.customer_id)
                  return (
                    <button
                      key={act.id}
                      onClick={() => navigate(`/reports/${act.id}`)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left w-full"
                    >
                      <ActivityTypeIcon type={act.type} />
                      <p className="text-xs text-gray-700 flex-1 truncate">
                        <span className="font-medium">{cust?.name}</span> · {act.title}
                      </p>
                      <span className="text-xs text-gray-400 shrink-0">{formatDate(act.created_at)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
