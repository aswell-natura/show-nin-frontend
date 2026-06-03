import AppLayout from '../../components/layout/AppLayout'
import { useAuth } from '../../context/AuthContext'
import { useDataStore } from '../../context/DataStoreContext'

function formatAmount(amount: number) {
  return `${(amount / 10000).toLocaleString()}万円`
}

export default function ManagerMembers() {
  const { currentUser } = useAuth()
  const { profiles, customers, projects, activities, tasks } = useDataStore()
  const members = profiles.filter((profile) => profile.manager_id === currentUser?.id)

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 shrink-0">
          <h1 className="text-lg font-bold text-gray-900">メンバー</h1>
          <p className="mt-0.5 text-xs text-gray-400">プレイヤーごとの案件・活動・タスク状況を横断確認します</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {members.map((member) => {
              const memberProjects = projects.filter((project) => project.user_id === member.id)
              const activeProjects = memberProjects.filter((project) => project.status !== 'closed')
              const memberCustomers = customers.filter((customer) =>
                memberProjects.some((project) => project.customer_id === customer.id),
              )
              const memberActivities = activities.filter((activity) => activity.user_id === member.id)
              const openTasks = tasks.filter((task) => task.user_id === member.id && !task.is_completed)
              const pipelineAmount = activeProjects.reduce((sum, project) => sum + project.amount, 0)

              return (
                <article key={member.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                      {member.avatar}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-gray-900 truncate">{member.name}</h2>
                      <p className="text-xs text-gray-400 truncate">{member.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {[
                      ['担当顧客', `${memberCustomers.length}件`],
                      ['進行中案件', `${activeProjects.length}件`],
                      ['見込み額', formatAmount(pipelineAmount)],
                      ['未完了タスク', `${openTasks.length}件`],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-[11px] text-gray-400">{label}</p>
                        <p className="mt-0.5 text-sm font-bold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400">直近活動</p>
                    <p className="mt-1 text-sm text-gray-700 line-clamp-2">
                      {memberActivities[0]?.title ?? '活動なし'}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
