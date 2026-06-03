import AppLayout from '../../components/layout/AppLayout'
import { useAuth } from '../../context/AuthContext'
import { useDataStore } from '../../context/DataStoreContext'

const referenceTime = new Date('2026-05-09T00:00:00').getTime()

function daysSince(iso: string) {
  return Math.floor((referenceTime - new Date(iso).getTime()) / 86400000)
}

export default function ManagerRisks() {
  const { currentUser } = useAuth()
  const { profiles, customers, projects, activities, tasks } = useDataStore()
  const members = profiles.filter((profile) => profile.manager_id === currentUser?.id)
  const teamProjects = projects.filter((project) => members.some((member) => member.id === project.user_id))
  const risks = teamProjects
    .map((project) => {
      const projectActivities = activities
        .filter((activity) => activity.project_id === project.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      const latestActivity = projectActivities[0]
      const staleDays = latestActivity ? daysSince(latestActivity.created_at) : 999
      const customer = project.customer_id ? customers.find((item) => item.id === project.customer_id) : null
      const owner = profiles.find((profile) => profile.id === project.user_id)
      const isUnlinked = project.customer_id === null
      const isStale = project.status !== 'closed' && staleDays >= 3
      const hasOverdueTask = tasks.some((task) => task.user_id === project.user_id && task.customer_id === project.customer_id && !task.is_completed && task.due_date < '2026-05-09')

      return {
        project,
        customer,
        owner,
        staleDays,
        isUnlinked,
        isStale,
        hasOverdueTask,
      }
    })
    .filter((risk) => risk.isUnlinked || risk.isStale || risk.hasOverdueTask)

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 shrink-0">
          <h1 className="text-lg font-bold text-gray-900">リスク</h1>
          <p className="mt-0.5 text-xs text-gray-400">放置案件、期限超過、未紐付け案件を優先確認します</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid gap-3 md:grid-cols-3 mb-4">
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs text-gray-400">検知数</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{risks.length}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs text-gray-400">放置案件</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{risks.filter((risk) => risk.isStale).length}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs text-gray-400">未紐付け</p>
              <p className="mt-1 text-lg font-bold text-red-700">{risks.filter((risk) => risk.isUnlinked).length}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="divide-y divide-gray-100">
              {risks.map((risk) => (
                <article key={risk.project.id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-1.5">
                        {risk.isUnlinked && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">企業未紐付け</span>}
                        {risk.isStale && <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">{risk.staleDays}日活動なし</span>}
                        {risk.hasOverdueTask && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">期限超過タスク</span>}
                      </div>
                      <h2 className="mt-2 text-sm font-semibold text-gray-900">{risk.project.name}</h2>
                      <p className="mt-1 text-xs text-gray-400">{risk.customer?.name ?? '企業未設定'} / {risk.owner?.name ?? '未担当'}</p>
                    </div>
                    <button className="h-8 rounded-lg border border-gray-200 px-3 text-xs text-gray-600 hover:bg-gray-50">
                      対応確認
                    </button>
                  </div>
                </article>
              ))}
              {risks.length === 0 && (
                <p className="py-12 text-center text-sm text-gray-400">検知中のリスクはありません</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
