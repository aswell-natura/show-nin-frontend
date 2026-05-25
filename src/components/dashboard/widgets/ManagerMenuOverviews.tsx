import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useDataStore } from '../../../context/DataStoreContext'
import { StandardWidget } from '../shared/StandardWidget'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

function formatAmount(amount: number) {
  return `${(amount / 10000).toLocaleString()}万円`
}

export function MemberSummaryWidget() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { profiles, projects, tasks } = useDataStore()
  const members = profiles.filter((profile) => profile.manager_id === currentUser?.id)

  return (
    <StandardWidget
      title="メンバー"
      description="担当者ごとの案件・タスク状況"
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate('/members')} className="font-bold text-muted-foreground hover:text-primary transition-colors">
          詳細
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      }
      items={members}
      keyExtractor={(m) => m.id}
      renderItem={(member) => {
        const activeProjects = projects.filter((project) => project.user_id === member.id && project.status !== 'closed')
        const openTasks = tasks.filter((task) => task.user_id === member.id && !task.is_completed)
        const amount = activeProjects.reduce((sum, project) => sum + project.amount, 0)

        return (
          <div className="px-4 py-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold uppercase">
                {member.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate">{member.name}</p>
                <p className="text-[10px] font-bold text-muted-foreground truncate uppercase tracking-tight">進行中 {activeProjects.length}件 / 未完了 {openTasks.length}件</p>
              </div>
              <span className="text-[10px] font-bold text-foreground bg-muted px-2 py-1 rounded">{formatAmount(amount)}</span>
            </div>
          </div>
        )
      }}
    />
  )
}

export function BudgetSummaryWidget() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { profiles, projects, targets } = useDataStore()
  const members = profiles.filter((profile) => profile.manager_id === currentUser?.id)
  const teamProjects = projects.filter((project) => members.some((member) => member.id === project.user_id))
  const target = targets.find((item) => item.type === 'team' && item.manager_id === currentUser?.id && item.target_month === '2026-05-01')
  const targetAmount = target?.amount ?? 0
  const closed = teamProjects.filter((project) => project.status === 'closed').reduce((sum, project) => sum + project.amount, 0)
  const pipeline = teamProjects.filter((project) => project.status !== 'closed').reduce((sum, project) => sum + project.amount, 0)
  const projected = closed + pipeline
  const progress = targetAmount ? Math.round((projected / targetAmount) * 100) : 0

  return (
    <StandardWidget
      title="予算編成"
      description="メンバー配分と見込み差分"
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate('/budget')} className="font-bold text-muted-foreground hover:text-primary transition-colors">
          詳細
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      }
      items={[]}
      keyExtractor={() => ''}
      renderItem={() => null}
    >
      <div className="p-4 border-b border-border bg-muted/5">
        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
          <span>見込み達成状況</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      </div>
    </StandardWidget>
  )
}

export function ReviewSummaryWidget() {
  const navigate = useNavigate()
  const { profiles, customers, activities } = useDataStore()
  const members = profiles.filter((profile) => profile.manager_id === profiles.find(p => p.id === 'user-001')?.manager_id) // simplified for example
  const reviewActivities = activities
    .filter((activity) => members.some((member) => member.id === activity.user_id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <StandardWidget
      title="レビュー"
      description="議事録・活動報告の確認"
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate('/reviews')} className="font-bold text-muted-foreground hover:text-primary transition-colors">
          詳細
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      }
      items={reviewActivities}
      keyExtractor={(a) => a.id}
      maxItems={10}
      onSeeMore={() => navigate('/reviews')}
      renderItem={(activity) => {
        const customer = customers.find((item) => item.id === activity.customer_id)
        const owner = profiles.find((profile) => profile.id === activity.user_id)
        return (
          <div className="px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-[10px] font-bold text-yellow-700 uppercase tracking-tight">
                未確認
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{owner?.name ?? '未担当'}</span>
            </div>
            <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{activity.title}</p>
            <p className="mt-0.5 text-[10px] font-bold text-muted-foreground truncate uppercase tracking-tight">{customer?.name ?? '企業未設定'}</p>
          </div>
        )
      }}
    />
  )
}

export function RiskSummaryWidget() {
  const navigate = useNavigate()
  const { profiles, customers, projects, activities } = useDataStore()
  const members = profiles.filter((profile) => profile.manager_id === profiles.find(p => p.id === 'user-001')?.manager_id)
  const referenceTime = new Date('2026-05-09T00:00:00').getTime()
  const risks = projects
    .filter((project) => members.some((member) => member.id === project.user_id))
    .map((project) => {
      const latestActivity = activities
        .filter((activity) => activity.project_id === project.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      const staleDays = latestActivity ? Math.floor((referenceTime - new Date(latestActivity.created_at).getTime()) / 86400000) : 999
      const customer = project.customer_id ? customers.find((item) => item.id === project.customer_id) : null
      return {
        project,
        customer,
        isUnlinked: project.customer_id === null,
        isStale: project.status !== 'closed' && staleDays >= 3,
        staleDays,
      }
    })
    .filter((risk) => risk.isUnlinked || risk.isStale)

  return (
    <StandardWidget
      title="リスク"
      description="放置・未紐付け案件"
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate('/risks')} className="font-bold text-muted-foreground hover:text-primary transition-colors">
          詳細
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      }
      items={risks}
      keyExtractor={(r) => r.project.id}
      maxItems={10}
      onSeeMore={() => navigate('/risks')}
      emptyMessage="リスク案件はありません"
      renderItem={(risk) => (
        <div className="px-4 py-3 hover:bg-red-50/10 transition-colors cursor-pointer group">
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {risk.isUnlinked && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 uppercase">未紐付け</span>}
            {risk.isStale && <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-bold text-yellow-700 uppercase">{risk.staleDays}日活動なし</span>}
          </div>
          <p className="text-sm font-bold text-foreground truncate group-hover:text-red-600 transition-colors">{risk.project.name}</p>
          <p className="mt-0.5 text-[10px] font-bold text-muted-foreground truncate uppercase tracking-tight">{risk.customer?.name ?? '企業未設定'}</p>
        </div>
      )}
    />
  )
}

export function ReportSummaryWidget() {
  const navigate = useNavigate()
  const { activities, customers, projects } = useDataStore()
  const reports = [...activities].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <StandardWidget
      title="レポート"
      description="活動レポートと議事録"
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports/rep-001')} className="font-bold text-muted-foreground hover:text-primary transition-colors">
          詳細
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      }
      items={reports}
      keyExtractor={(r) => r.id}
      maxItems={10}
      onSeeMore={() => navigate('/reports/rep-001')}
      renderItem={(activity) => {
        const customer = customers.find((item) => item.id === activity.customer_id)
        const project = projects.find((item) => item.id === activity.project_id)
        return (
          <div className="px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer group">
            <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{activity.title}</p>
            <p className="mt-0.5 text-[10px] font-bold text-muted-foreground truncate uppercase tracking-tight">{customer?.name ?? '企業未設定'} / {project?.name ?? '案件未設定'}</p>
          </div>
        )
      }}
    />
  )
}
