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

  return (
    <StandardWidget
      title="タイムライン"
      description="自身の活動とピン留め顧客"
      items={myActivities}
      keyExtractor={(a) => a.id}
      maxItems={10}
      renderItem={(activity) => {
        const customer = customers.find((c) => c.id === activity.customer_id)
        return (
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
        )
      }}
    >
      {pinnedCustomers.length > 0 && (
        <div className="p-4 border-b border-border bg-muted/10">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">ピン留め</p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {pinnedCustomers.map((c) => {
              const proj = projects.find(
                (p) => p.customer_id === c.id && p.user_id === currentUser!.id
              )
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/customers/${c.id}`)}
                  className="shrink-0 w-44 border border-border/50 rounded-xl p-2.5 bg-card hover:bg-accent/50 hover:shadow-sm transition-all text-left snap-start"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <RankBadge rank={c.rank} />
                    <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                  </div>
                  {proj && (
                    <div className="flex flex-col items-start gap-1 pt-1.5 border-t border-border/40">
                      <p className="text-[10px] font-bold text-muted-foreground truncate w-full uppercase tracking-tight">{proj.name}</p>
                      <StatusBadge status={proj.status} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </StandardWidget>
  )
}
