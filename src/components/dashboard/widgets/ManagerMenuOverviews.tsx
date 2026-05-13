import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useDataStore } from '../../../context/DataStoreContext'

function formatAmount(amount: number) {
  return `${(amount / 10000).toLocaleString()}万円`
}

function WidgetShell({
  title,
  description,
  path,
  children,
}: {
  title: string
  description: string
  path: string
  children: React.ReactNode
}) {
  const navigate = useNavigate()

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 truncate">{title}</h2>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{description}</p>
        </div>
        <button
          onClick={() => navigate(path)}
          className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shrink-0 transition-colors"
        >
          開く
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
    </div>
  )
}

export function MemberSummaryWidget() {
  const { currentUser } = useAuth()
  const { profiles, projects, tasks } = useDataStore()
  const members = profiles.filter((profile) => profile.manager_id === currentUser?.id)

  return (
    <WidgetShell title="メンバー" description="担当者ごとの案件・タスク状況" path="/members">
      <div className="divide-y divide-gray-100">
        {members.map((member) => {
          const activeProjects = projects.filter((project) => project.user_id === member.id && project.status !== 'closed')
          const openTasks = tasks.filter((task) => task.user_id === member.id && !task.is_completed)
          const amount = activeProjects.reduce((sum, project) => sum + project.amount, 0)

          return (
            <div key={member.id} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                  {member.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                  <p className="text-xs text-gray-400 truncate">進行中 {activeProjects.length}件 / 未完了 {openTasks.length}件</p>
                </div>
                <span className="text-xs font-medium text-gray-700">{formatAmount(amount)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </WidgetShell>
  )
}

export function BudgetSummaryWidget() {
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
  const allocated = members.reduce((sum, member) => {
    const memberTarget = targets.find((item) => item.type === 'individual' && item.user_id === member.id && item.target_month === '2026-05-01')
    return sum + (memberTarget?.amount ?? 0)
  }, 0)

  return (
    <WidgetShell title="予算編成" description="メンバー配分と見込み差分" path="/budget">
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <p className="text-[11px] text-gray-400">チーム目標</p>
            <p className="text-sm font-bold text-gray-900">{formatAmount(targetAmount)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <p className="text-[11px] text-gray-400">配分済み</p>
            <p className="text-sm font-bold text-gray-900">{formatAmount(allocated)}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
          <span>見込み達成</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      </div>
    </WidgetShell>
  )
}

export function ReviewSummaryWidget() {
  const { currentUser } = useAuth()
  const { profiles, customers, activities } = useDataStore()
  const members = profiles.filter((profile) => profile.manager_id === currentUser?.id)
  const reviewActivities = activities
    .filter((activity) => members.some((member) => member.id === activity.user_id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <WidgetShell title="レビュー" description="議事録・活動報告の確認" path="/reviews">
      <div className="divide-y divide-gray-100">
        {reviewActivities.slice(0, 6).map((activity, index) => {
          const customer = customers.find((item) => item.id === activity.customer_id)
          const owner = profiles.find((profile) => profile.id === activity.user_id)
          return (
            <div key={activity.id} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${index < 3 ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                  {index < 3 ? '確認待ち' : '確認済み'}
                </span>
                <span className="text-xs text-gray-400 truncate">{owner?.name ?? '未担当'}</span>
              </div>
              <p className="mt-2 text-sm font-medium text-gray-900 truncate">{activity.title}</p>
              <p className="mt-0.5 text-xs text-gray-400 truncate">{customer?.name ?? '企業未設定'}</p>
            </div>
          )
        })}
      </div>
    </WidgetShell>
  )
}

export function RiskSummaryWidget() {
  const { currentUser } = useAuth()
  const { profiles, customers, projects, activities } = useDataStore()
  const members = profiles.filter((profile) => profile.manager_id === currentUser?.id)
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
    <WidgetShell title="リスク" description="放置・未紐付け案件" path="/risks">
      <div className="divide-y divide-gray-100">
        {risks.slice(0, 8).map((risk) => (
          <div key={risk.project.id} className="px-4 py-3">
            <div className="flex flex-wrap gap-1.5">
              {risk.isUnlinked && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">未紐付け</span>}
              {risk.isStale && <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">{risk.staleDays}日活動なし</span>}
            </div>
            <p className="mt-2 text-sm font-medium text-gray-900 truncate">{risk.project.name}</p>
            <p className="mt-0.5 text-xs text-gray-400 truncate">{risk.customer?.name ?? '企業未設定'}</p>
          </div>
        ))}
        {risks.length === 0 && <p className="py-8 text-center text-sm text-gray-400">リスクなし</p>}
      </div>
    </WidgetShell>
  )
}

export function ReportSummaryWidget() {
  const { activities, customers, projects } = useDataStore()
  const reports = [...activities].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <WidgetShell title="レポート" description="活動レポートと議事録" path="/reports/rep-001">
      <div className="divide-y divide-gray-100">
        {reports.slice(0, 6).map((activity) => {
          const customer = customers.find((item) => item.id === activity.customer_id)
          const project = projects.find((item) => item.id === activity.project_id)
          return (
            <div key={activity.id} className="px-4 py-3">
              <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
              <p className="mt-0.5 text-xs text-gray-400 truncate">{customer?.name ?? '企業未設定'} / {project?.name ?? '案件未設定'}</p>
            </div>
          )
        })}
      </div>
    </WidgetShell>
  )
}
