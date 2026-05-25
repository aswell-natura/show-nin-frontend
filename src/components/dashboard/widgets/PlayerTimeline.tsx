import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useDataStore } from '../../../context/DataStoreContext'
import ActivityTypeIcon from './ActivityTypeIcon'
import { StandardWidget } from '../shared/StandardWidget'
import { StatusBadge, RankBadge } from '../shared/StatusBadge'

const referenceTime = new Date('2026-05-09T00:00:00').getTime()

function formatDate(iso: string) {
  const d = new Date(iso)
  const diff = Math.floor((referenceTime - d.getTime()) / 1000 / 60)
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

  const timelineItems = [
    ...pinnedCustomers.map((customer) => ({ kind: 'pinned' as const, customer })),
    ...myActivities.slice(0, 10).map((activity) => ({ kind: 'activity' as const, activity })),
  ]

  return (
    <StandardWidget
      title="タイムライン"
      description="自身の活動とピン留め顧客"
      items={timelineItems}
      keyExtractor={(item) => `${item.kind}-${item.kind === 'pinned' ? item.customer.id : item.activity.id}`}
      maxItems={0}
      renderItem={(item) => {
        if (item.kind === 'pinned') {
          const c = item.customer
          const proj = projects.find(
            (p) => p.customer_id === c.id && p.user_id === currentUser!.id
          )

          return (
            <div>
              {c.id === pinnedCustomers[0]?.id && (
                <p className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/10">ピン留め</p>
              )}
              <button
                onClick={() => navigate(`/customers/${c.id}`)}
                className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <RankBadge rank={c.rank} size="lg" className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{c.name}</p>
                    <p className="mt-0.5 text-[10px] font-bold text-muted-foreground truncate uppercase tracking-tight">
                      {proj?.name ?? '案件なし'}
                    </p>
                  </div>
                  {proj && <StatusBadge status={proj.status} />}
                </div>
              </button>
            </div>
          )
        }

        const activity = item.activity
        const customer = customers.find((c) => c.id === activity.customer_id)
        return (
          <div>
            {pinnedCustomers.length > 0 && activity.id === myActivities[0]?.id && (
              <p className="px-4 py-2 border-t border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/10">活動</p>
            )}
            <button
              onClick={() => navigate(`/customers/${activity.customer_id}`)}
              className="flex items-start gap-3 p-3 hover:bg-accent/50 transition-all text-left w-full group"
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <ActivityTypeIcon type={activity.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{customer?.name}</p>
                  {customer && <RankBadge rank={customer.rank} />}
                </div>
                <p className="text-xs font-bold text-foreground/90 truncate">{activity.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{activity.content_json.summary}</p>
              </div>
              <div className="shrink-0 text-[10px] font-bold text-muted-foreground pt-0.5">{formatDate(activity.created_at)}</div>
            </button>
          </div>
        )
      }}
    />
  )
}
