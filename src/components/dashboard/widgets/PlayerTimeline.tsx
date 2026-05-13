import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useDataStore } from '../../../context/DataStoreContext'
import ActivityTypeIcon from './ActivityTypeIcon'

const statusLabel: Record<string, string> = {
  lead: 'リード', proposing: '提案中', negotiating: '交渉中', closed: '成約',
}
const statusColor: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-600',
  proposing: 'bg-blue-100 text-blue-700',
  negotiating: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-green-100 text-green-700',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const diff = Math.floor((Date.now() - d.getTime()) / 1000 / 60)
  if (diff < 60) return `${diff}分前`
  if (diff < 60 * 24) return `${Math.floor(diff / 60)}時間前`
  return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

export default function PlayerTimeline() {
  const { currentUser } = useAuth()
  const { activities, customers, projects } = useDataStore()
  const navigate = useNavigate()

  const myActivities = activities
    .filter((a) => a.user_id === currentUser!.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const pinnedCustomers = customers.filter(
    (c) => c.is_pinned && c.created_by === currentUser!.id
  )

  return (
    <div className="h-full overflow-y-auto px-4 md:px-6 py-5">
      {pinnedCustomers.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">ピン留め</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {pinnedCustomers.map((c) => {
              const proj = projects.find(
                (p) => p.customer_id === c.id && p.user_id === currentUser!.id
              )
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/customers/${c.id}`)}
                  className="shrink-0 w-48 border border-gray-200 rounded-xl p-3 bg-white hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      c.rank === 'A' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>{c.rank}</span>
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                  </div>
                  {proj && (
                    <>
                      <p className="text-xs text-gray-500 truncate">{proj.name}</p>
                      <span className={`mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[proj.status]}`}>
                        {statusLabel[proj.status]}
                      </span>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">最近の活動</p>
      <div className="flex flex-col gap-2">
        {myActivities.map((activity) => {
          const customer = customers.find((c) => c.id === activity.customer_id)
          const project = projects.find((p) => p.id === activity.project_id)
          return (
            <button
              key={activity.id}
              onClick={() => navigate(`/customers/${activity.customer_id}`)}
              className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:shadow-sm hover:border-gray-300 transition-all text-left w-full"
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <ActivityTypeIcon type={activity.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-gray-900 truncate">{customer?.name}</p>
                  {customer && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                      customer.rank === 'A' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>{customer.rank}</span>
                  )}
                </div>
                <p className="text-sm text-gray-700 truncate">{activity.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{activity.content_json.summary}</p>
                {project && (
                  <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[project.status]}`}>
                    {project.name}
                  </span>
                )}
              </div>
              <div className="shrink-0 text-xs text-gray-400 pt-0.5">{formatDate(activity.created_at)}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
