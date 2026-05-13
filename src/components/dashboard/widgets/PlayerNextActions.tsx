import { useAuth } from '../../../context/AuthContext'
import { useDataStore } from '../../../context/DataStoreContext'

const todayEvents = [
  { time: '10:00', label: 'アルファテック 最終確認MTG', color: 'bg-blue-500' },
  { time: '13:30', label: '日本製造 技術検証レビュー', color: 'bg-gray-400' },
  { time: '15:00', label: 'チームミーティング', color: 'bg-green-500' },
]

export default function PlayerNextActions() {
  const { currentUser } = useAuth()
  const { tasks, customers } = useDataStore()

  const myTasks = tasks
    .filter((t) => t.user_id === currentUser!.id && !t.is_completed)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

  return (
    <div className="h-full overflow-y-auto px-4 py-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Next Action</p>
      <div className="flex flex-col gap-2">
        {myTasks.map((task) => {
          const customer = customers.find((c) => c.id === task.customer_id)
          const isOverdue = new Date(task.due_date) < new Date()
          const isToday = task.due_date === new Date().toISOString().slice(0, 10)
          return (
            <div key={task.id} className="p-3 bg-white rounded-xl border border-gray-200">
              <div className="flex items-start gap-2">
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                  isOverdue ? 'bg-red-500' : isToday ? 'bg-yellow-400' : 'bg-gray-300'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 truncate">{customer?.name}</p>
                  <p className="text-sm text-gray-800 mt-0.5 leading-snug">{task.title}</p>
                  <p className={`text-xs mt-1 font-medium ${
                    isOverdue ? 'text-red-500' : isToday ? 'text-yellow-600' : 'text-gray-400'
                  }`}>
                    {isOverdue ? '期限切れ · ' : isToday ? '今日 · ' : ''}{task.due_date}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 mt-6">今日の予定</p>
      <div className="flex flex-col gap-2">
        {todayEvents.map((ev, i) => (
          <div key={i} className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-gray-200">
            <div className={`w-1.5 self-stretch rounded-full shrink-0 ${ev.color}`} />
            <div>
              <p className="text-xs text-gray-400">{ev.time}</p>
              <p className="text-sm text-gray-800">{ev.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
