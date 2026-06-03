import { useState } from 'react'
import { WidgetCard } from '../shared/WidgetCard'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type CalendarEvent = { id: string; date: string; title: string; color: string }

const EVENT_COLORS = [
  { label: '青', value: 'bg-blue-500' },
  { label: '緑', value: 'bg-green-500' },
  { label: '赤', value: 'bg-red-500' },
  { label: '紫', value: 'bg-purple-500' },
  { label: '橙', value: 'bg-orange-500' },
]

function pad(n: number) { return String(n).padStart(2, '0') }

function makeKey(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`
}

export default function CalendarWidget() {
  const today = new Date('2026-05-09')
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: '1', date: makeKey(today.getFullYear(), today.getMonth(), today.getDate()), title: '営業MTG', color: 'bg-blue-500' },
    { id: '2', date: makeKey(today.getFullYear(), today.getMonth(), Math.min(today.getDate() + 2, 28)), title: '顧客訪問', color: 'bg-green-500' },
    { id: '3', date: makeKey(today.getFullYear(), today.getMonth(), Math.min(today.getDate() + 5, 28)), title: '提案資料作成', color: 'bg-purple-500' },
  ])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newColor, setNewColor] = useState('bg-blue-500')
  const [showAddForm, setShowAddForm] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
  const monthLabel = `${viewYear}年${viewMonth + 1}月`

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
    setDetailOpen(false)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
    setDetailOpen(false)
  }

  function eventsOnDay(day: number) {
    return events.filter(e => e.date === makeKey(viewYear, viewMonth, day))
  }

  function handleDayClick(day: number) {
    const key = makeKey(viewYear, viewMonth, day)
    setSelectedDate(key)
    setDetailOpen(true)
    setShowAddForm(false)
    setNewTitle('')
    setNewColor('bg-blue-500')
  }

  function handleAddEvent() {
    if (!newTitle.trim() || !selectedDate) return
    setEvents(prev => [...prev, {
      id: Date.now().toString(),
      date: selectedDate,
      title: newTitle.trim(),
      color: newColor,
    }])
    setNewTitle('')
    setShowAddForm(false)
  }

  function handleDeleteEvent(id: string) {
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  function isToday(day: number) {
    return viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate()
  }

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const detailDayEvents = selectedDate
    ? events.filter(e => e.date === selectedDate)
    : []

  const detailDayLabel = selectedDate
    ? selectedDate.replace(/(\d+)-(\d+)-(\d+)/, '$1年$2月$3日')
    : ''

  return (
    <>
      <WidgetCard
        title="スケジュール"
        description="活動予定の管理と確認"
        action={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-7 w-7">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-bold text-foreground min-w-22 text-center">{monthLabel}</span>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-7 w-7">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      >
        <div className="flex-1 flex flex-col p-4 min-h-0">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 mb-2">
            {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
              <div key={d} className={cn(
                "text-center text-[10px] font-bold uppercase tracking-wider py-1",
                i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"
              )}>{d}</div>
            ))}
          </div>

          {/* グリッド */}
          <div className="grid grid-cols-7 gap-px bg-border/40 border border-border/40 rounded-xl overflow-hidden flex-1 shadow-sm">
            {cells.map((day, idx) => {
              const dayOfWeek = idx % 7
              const dayEvents = day ? eventsOnDay(day) : []
              const key = day ? makeKey(viewYear, viewMonth, day) : null
              const isSelected = key !== null && selectedDate === key && detailOpen
              
              return (
                <div
                  key={idx}
                  onClick={() => day && handleDayClick(day)}
                  className={cn(
                    "bg-card flex flex-col min-h-[48px] p-1 transition-all duration-150 relative",
                    day && "cursor-pointer hover:bg-accent/50",
                    isSelected && "bg-accent/80 z-10 shadow-inner",
                    !day && "bg-muted/5"
                  )}
                >
                  {day && (
                    <>
                      <span className={cn(
                        "text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full mb-1 mx-auto transition-transform",
                        isToday(day) ? "bg-primary text-primary-foreground scale-110 shadow-sm" : 
                        dayOfWeek === 0 ? "text-red-500" : 
                        dayOfWeek === 6 ? "text-blue-500" : "text-foreground/70"
                      )}>{day}</span>
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        {dayEvents.slice(0, 2).map(ev => (
                          <div key={ev.id} className={cn(ev.color, "text-white text-[7px] font-bold px-1 py-px rounded-sm truncate shadow-sm")}>
                            {ev.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </WidgetCard>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-[340px] sm:w-[400px] p-0 flex flex-col border-l border-border/50">
          <SheetHeader className="px-6 py-6 border-b border-border/40 bg-muted/5">
            <div className="flex items-center gap-2 text-primary mb-1">
              <CalendarIcon className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">予定詳細</span>
            </div>
            <SheetTitle className="text-xl font-bold tracking-tight">{detailDayLabel}</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              この日のスケジュールを確認・編集できます。
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
            {detailDayEvents.length === 0 && !showAddForm && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border">
                <CalendarIcon className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">予定はありません</p>
              </div>
            )}
            
            <div className="flex flex-col gap-3">
              {detailDayEvents.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 p-3 bg-muted/10 rounded-xl border border-border/40 group hover:bg-muted/20 transition-colors">
                  <div className={cn("w-3 h-3 rounded-full shrink-0 shadow-sm", ev.color)} />
                  <p className="text-sm font-semibold text-foreground flex-1">{ev.title}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteEvent(ev.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {showAddForm && (
              <div className="flex flex-col gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">新規予定の追加</p>
                  <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)} className="h-6 w-6">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <input
                  autoFocus
                  className="text-sm font-medium bg-background border border-border/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground"
                  placeholder="タイトルを入力してください..."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddEvent()}
                />
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">カラー選択</p>
                  <div className="flex items-center gap-3 px-1">
                    {EVENT_COLORS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setNewColor(c.value)}
                        title={c.label}
                        className={cn(
                          "w-6 h-6 rounded-full transition-all duration-200 shadow-sm",
                          c.value,
                          newColor === c.value ? "ring-2 ring-offset-2 ring-primary scale-110" : "opacity-40 hover:opacity-100 hover:scale-110"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  onClick={handleAddEvent}
                  disabled={!newTitle.trim()}
                  className="w-full font-bold shadow-md shadow-primary/20"
                >
                  予定を追加する
                </Button>
              </div>
            )}
          </div>

          {!showAddForm && (
            <div className="p-6 border-t border-border/40 bg-muted/5">
              <Button
                onClick={() => setShowAddForm(true)}
                className="w-full font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/10"
              >
                <Plus className="h-4 w-4" />
                予定を追加
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
