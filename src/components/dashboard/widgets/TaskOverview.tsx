import { useNavigate } from 'react-router-dom'
import { useDataStore } from '../../../context/DataStoreContext'
import { StandardWidget } from '../shared/StandardWidget'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

export default function TaskOverview() {
  const navigate = useNavigate()
  const { tasks, customers } = useDataStore()
  const referenceDate = '2026-05-09'
  const openTasks = tasks.filter((task) => !task.is_completed)
  const overdue = openTasks.filter((task) => task.due_date < referenceDate)

  return (
    <StandardWidget
      title="タスク"
      description="AI抽出タスクの確認"
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')} className="font-bold text-muted-foreground hover:text-primary transition-colors">
          詳細
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      }
      stats={[
        { label: '未完了', value: openTasks.length, unit: '件' },
        { label: '期限超過', value: overdue.length, unit: '件', valueClassName: 'text-red-600 dark:text-red-400', className: 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' },
        { label: '総数', value: tasks.length, unit: '件' },
      ]}
      items={openTasks}
      keyExtractor={(t) => t.id}
      maxItems={10}
      onSeeMore={() => navigate('/tasks')}
      emptyMessage="全てのタスクが完了しました"
      renderItem={(task) => {
        const customer = customers.find((item) => item.id === task.customer_id)
        const isOverdue = task.due_date < referenceDate

        return (
          <button
            onClick={() => navigate('/tasks')}
            className="w-full text-left px-4 py-3 hover:bg-muted transition-colors group"
          >
            <p className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{task.title}</p>
            <div className="mt-1 flex items-center justify-between gap-2 text-[10px] font-bold">
              <span className="text-muted-foreground truncate uppercase tracking-tight">{customer?.name ?? '企業未設定'}</span>
              <span className={isOverdue ? 'text-red-500' : 'text-muted-foreground'}>
                {isOverdue ? '期限切れ: ' : '期限: '}{task.due_date}
              </span>
            </div>
          </button>
        )
      }}
    />
  )
}
