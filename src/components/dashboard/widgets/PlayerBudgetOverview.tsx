import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useDataStore } from '../../../context/DataStoreContext'
import { StandardWidget } from '../shared/StandardWidget'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

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
    <StandardWidget
      title="予算・実績"
      description="配分予算と現在見込み"
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate('/my-budget')} className="font-bold text-muted-foreground hover:text-primary transition-colors">
          詳細
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      }
      items={myProjects}
      keyExtractor={(p) => p.id}
      maxItems={5}
      onSeeMore={() => navigate('/my-budget')}
      renderItem={(project) => (
        <button
          onClick={() => navigate('/my-budget')}
          className="w-full px-4 py-3 text-left hover:bg-muted transition-colors group"
        >
          <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{project.name}</p>
          <p className="mt-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{formatAmount(project.amount)}</p>
        </button>
      )}
    >
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-tight">
          <span>進捗状況</span>
          <span>{projectedProgress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(projectedProgress, 100)}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
          <span>{formatAmount(projectedAmount)} 見込み</span>
          <span>目標 {formatAmount(targetAmount)}</span>
        </div>
      </div>
    </StandardWidget>
  )
}
