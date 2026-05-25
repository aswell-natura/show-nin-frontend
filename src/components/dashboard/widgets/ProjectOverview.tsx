import { useNavigate } from 'react-router-dom'
import { useDataStore } from '../../../context/DataStoreContext'
import type { ProjectStatus } from '../../../types'
import { StandardWidget } from '../shared/StandardWidget'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

const statusLabel: Record<ProjectStatus, string> = {
  lead: 'リード',
  proposing: '提案中',
  negotiating: '交渉中',
  closed: '成約',
}

const statusColor: Record<ProjectStatus, string> = {
  lead: 'bg-muted text-muted-foreground',
  proposing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  negotiating: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  closed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

function formatAmount(amount: number) {
  if (!amount) return '未設定'
  return `${(amount / 10000).toLocaleString()}万円`
}

function formatDate(value?: string) {
  if (!value) return '-'
  return new Date(`${value}T00:00:00`).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })
}

export default function ProjectOverview() {
  const navigate = useNavigate()
  const { projects, customers } = useDataStore()
  const sortedProjects = [...projects].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )

  return (
    <StandardWidget
      title="案件一覧"
      description="企業紐付けと進行中案件の確認"
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="font-bold text-muted-foreground hover:text-primary transition-colors">
          詳細
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      }
      items={sortedProjects}
      keyExtractor={(p) => p.id}
      maxItems={12}
      onSeeMore={() => navigate('/projects')}
      renderItem={(project) => {
        const customer = project.customer_id
          ? customers.find((item) => item.id === project.customer_id)
          : null
        const isUnlinked = !project.customer_id

        return (
          <button
            onClick={() => navigate('/projects')}
            className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors group ${isUnlinked ? 'bg-red-50/10' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  {isUnlinked && (
                    <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 uppercase">
                      要紐付け
                    </span>
                  )}
                  <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{project.name}</p>
                </div>
                <p className={`mt-1 text-xs truncate font-medium ${isUnlinked ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {customer ? customer.name : '企業未紐付け'}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor[project.status]}`}>
                {statusLabel[project.status]}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-medium text-muted-foreground">
              <span>{formatAmount(project.amount)}</span>
              <span>完了予定: {formatDate(project.close_date)}</span>
            </div>
          </button>
        )
      }}
    />
  )
}
