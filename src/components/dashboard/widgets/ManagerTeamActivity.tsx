import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useDataStore } from '../../../context/DataStoreContext'
import ActivityTypeIcon from './ActivityTypeIcon'
import { WidgetCard } from '../shared/WidgetCard'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

const referenceTime = new Date('2026-05-09T00:00:00').getTime()

function formatDate(iso: string) {
  const d = new Date(iso)
  const diff = Math.floor((referenceTime - d.getTime()) / 1000 / 60)
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
    <WidgetCard
      title="メンバー別活動状況"
      description="チームメンバーの最新活動と目標達成率"
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate('/members')} className="font-bold text-muted-foreground hover:text-primary transition-colors">
          詳細
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      }
    >
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
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
            <div key={member.id} className="border border-border/60 rounded-xl p-3 md:p-4 bg-muted/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {member.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">達成率</p>
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
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border/40 hover:bg-muted transition-colors text-left w-full group"
                    >
                      <ActivityTypeIcon type={act.type} />
                      <p className="text-xs text-foreground/80 flex-1 truncate group-hover:text-primary transition-colors">
                        <span className="font-semibold text-foreground">{cust?.name}</span> · {act.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(act.created_at)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </WidgetCard>
  )
}
