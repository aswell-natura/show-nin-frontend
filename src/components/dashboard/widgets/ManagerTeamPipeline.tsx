import { useAuth } from '../../../context/AuthContext'
import { useDataStore } from '../../../context/DataStoreContext'
import { WidgetCard } from '../shared/WidgetCard'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

function formatAmount(n: number) {
  return (n / 10000).toLocaleString('ja-JP') + '万円'
}

const stages = [
  { key: 'lead',        label: 'リード',  color: 'bg-muted-foreground/30' },
  { key: 'proposing',   label: '提案中',  color: 'bg-blue-400' },
  { key: 'negotiating', label: '交渉中',  color: 'bg-yellow-400' },
  { key: 'closed',      label: '成約',   color: 'bg-green-500' },
]

export default function ManagerTeamPipeline() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
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
    <WidgetCard
      title="チームパイプライン"
      description="チーム全体の案件フェーズ分布"
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="font-bold text-muted-foreground hover:text-primary transition-colors">
          詳細
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      }
    >
      <div className="flex-1 flex flex-col p-5">
        <div className="flex flex-col gap-4">
          {stages.map((stage) => {
            const count = counts[stage.key as keyof typeof counts]
            const pct = Math.round((count / maxCount) * 100)
            return (
              <div key={stage.key} className="flex items-center gap-4">
                <p className="text-xs font-medium text-muted-foreground w-12 shrink-0">{stage.label}</p>
                <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full ${stage.color} transition-all duration-700 flex items-center justify-end pr-3`}
                    style={{ width: `${Math.max(pct, 12)}%` }}
                  >
                    <span className="text-[10px] text-white font-bold drop-shadow-sm">{count}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {target && (
          <div className="mt-auto pt-6">
            <div className="bg-muted/30 rounded-xl p-3 border border-border/40">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">チーム目標</p>
              <p className="text-sm font-bold text-foreground">{formatAmount(target.amount)}</p>
            </div>
          </div>
        )}
      </div>
    </WidgetCard>
  )
}
