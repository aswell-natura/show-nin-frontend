import AppLayout from '../components/layout/AppLayout'
import { useAuth } from '../context/AuthContext'
import { useDataStore } from '../context/DataStoreContext'

export default function ManagerReviews() {
  const { currentUser } = useAuth()
  const { profiles, customers, projects, activities } = useDataStore()
  const members = profiles.filter((profile) => profile.manager_id === currentUser?.id)
  const reviewActivities = activities
    .filter((activity) => members.some((member) => member.id === activity.user_id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 shrink-0">
          <h1 className="text-lg font-bold text-gray-900">レビュー</h1>
          <p className="mt-0.5 text-xs text-gray-400">議事録・活動報告を確認し、メンバーへフィードバックします</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">未確認レビュー候補</h2>
              <span className="text-xs text-gray-400">{reviewActivities.length}件</span>
            </div>
            <div className="divide-y divide-gray-100">
              {reviewActivities.map((activity, index) => {
                const member = profiles.find((profile) => profile.id === activity.user_id)
                const customer = customers.find((item) => item.id === activity.customer_id)
                const project = projects.find((item) => item.id === activity.project_id)

                return (
                  <article key={activity.id} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${index < 3 ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                            {index < 3 ? '確認待ち' : '確認済み'}
                          </span>
                          <span className="text-xs text-gray-400">{member?.name ?? '未担当'}</span>
                        </div>
                        <h2 className="mt-2 text-sm font-semibold text-gray-900">{activity.title}</h2>
                        <p className="mt-1 text-xs text-gray-400">{customer?.name ?? '企業未設定'} / {project?.name ?? '案件未設定'}</p>
                        <p className="mt-2 text-sm leading-6 text-gray-600 line-clamp-2">{activity.content_json.summary}</p>
                      </div>
                      <button className="shrink-0 h-8 rounded-lg border border-gray-200 px-3 text-xs text-gray-600 hover:bg-gray-50">
                        コメント
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
