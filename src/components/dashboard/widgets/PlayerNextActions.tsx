import { useAuth } from '../../../context/AuthContext'
import { useDataStore } from '../../../context/DataStoreContext'
import { WidgetCard } from '../shared/WidgetCard'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

import { ChevronRight } from 'lucide-react'

const todayEvents = [
  { time: '10:00', label: 'アルファテック 最終確認MTG', color: 'bg-blue-500' },
  { time: '13:30', label: '日本製造 技術検証レビュー', color: 'bg-muted-foreground/30' },
  { time: '15:00', label: 'チームミーティング', color: 'bg-green-500' },
]

export default function PlayerNextActions() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { tasks, customers } = useDataStore()

  const myTasks = tasks
    .filter((t) => t.user_id === currentUser!.id && !t.is_completed)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

  const referenceDate = new Date('2026-05-09').toISOString().slice(0, 10)

  return (
    <WidgetCard
      title="ネクストアクション"
      description="優先度の高いタスクと今日の予定"
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')} className="font-bold text-muted-foreground hover:text-primary transition-colors">
          詳細
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      }
    >
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-8 scrollbar-thin">
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">直近のタスク</p>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{myTasks.length}件</span>
          </div>
          <div className="flex flex-col gap-2">
            {myTasks.slice(0, 5).map((task) => {
              const customer = customers.find((c) => c.id === task.customer_id)
              const isOverdue = task.due_date < referenceDate
              const isToday = task.due_date === referenceDate
              return (
                <div key={task.id} className="p-3 bg-muted/10 rounded-xl border border-border/40 hover:bg-muted/20 transition-colors group cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "mt-1.5 w-2 h-2 rounded-full shrink-0 shadow-sm transition-transform group-hover:scale-125",
                      isOverdue ? 'bg-red-500 shadow-red-200' : isToday ? 'bg-yellow-400 shadow-yellow-100' : 'bg-muted-foreground/30'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-muted-foreground truncate uppercase tracking-tight">{customer?.name || '顧客未指定'}</p>
                      <p className="text-sm font-bold text-foreground mt-0.5 leading-snug group-hover:text-primary transition-colors">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded",
                          isOverdue ? 'bg-red-50 text-red-600' : isToday ? 'bg-yellow-50 text-yellow-700' : 'bg-muted text-muted-foreground'
                        )}>
                          {isOverdue ? '期限切れ' : isToday ? '今日' : '予定'}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">{task.due_date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">今日の予定</p>
          </div>
          <div className="flex flex-col gap-2">
            {todayEvents.map((ev, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-background rounded-xl border border-border/40 hover:bg-muted/5 transition-colors">
                <div className={cn("w-1 h-8 rounded-full shrink-0", ev.color)} />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground tracking-widest">{ev.time}</p>
                  <p className="text-sm font-bold text-foreground mt-0.5 truncate">{ev.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </WidgetCard>
  )
}
