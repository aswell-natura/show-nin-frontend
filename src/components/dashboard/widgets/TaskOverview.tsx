import { useNavigate } from 'react-router-dom'
import { useDataStore } from '../../../context/DataStoreContext'

export default function TaskOverview() {
  const navigate = useNavigate()
  const { tasks, customers } = useDataStore()
  const openTasks = tasks.filter((task) => !task.is_completed)
  const overdue = openTasks.filter((task) => task.due_date < '2026-05-09')

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">タスク</h2>
          <p className="text-xs text-gray-400 mt-0.5">AI抽出タスクの確認</p>
        </div>
        <button
          onClick={() => navigate('/tasks')}
          className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
        >
          開く
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 p-4 border-b border-gray-100">
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-[11px] text-gray-400">未完了</p>
          <p className="text-lg font-bold text-gray-900">{openTasks.length}</p>
        </div>
        <div className="rounded-lg bg-red-50 px-3 py-2">
          <p className="text-[11px] text-red-400">期限超過</p>
          <p className="text-lg font-bold text-red-700">{overdue.length}</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-[11px] text-gray-400">総数</p>
          <p className="text-lg font-bold text-gray-900">{tasks.length}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {openTasks.slice(0, 5).map((task) => {
          const customer = customers.find((item) => item.id === task.customer_id)
          return (
            <button
              key={task.id}
              onClick={() => navigate('/tasks')}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900 line-clamp-1">{task.title}</p>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                <span className="text-gray-400 truncate">{customer?.name ?? '未設定'}</span>
                <span className={task.due_date < '2026-05-09' ? 'text-red-500' : 'text-gray-400'}>
                  {task.due_date}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
