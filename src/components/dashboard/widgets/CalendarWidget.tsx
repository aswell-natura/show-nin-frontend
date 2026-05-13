import { useState } from 'react'

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
  const today = new Date()
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
  const [detailDate, setDetailDate] = useState<string | null>(null)

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
  const monthLabel = `${viewYear}年${viewMonth + 1}月`

  const currentMonthPrefix = `${viewYear}-${pad(viewMonth + 1)}`
  const currentMonthEvents = events
    .filter(e => e.date.startsWith(currentMonthPrefix))
    .sort((a, b) => a.date.localeCompare(b.date))

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
    setDetailDate(null)
    setShowAddForm(false)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
    setDetailDate(null)
    setShowAddForm(false)
  }

  function eventsOnDay(day: number) {
    return events.filter(e => e.date === makeKey(viewYear, viewMonth, day))
  }

  function handleDayClick(day: number) {
    const key = makeKey(viewYear, viewMonth, day)
    if (detailDate === key) {
      setDetailDate(null)
    } else {
      setDetailDate(key)
      setSelectedDate(key)
      setShowAddForm(false)
      setNewTitle('')
      setNewColor('bg-blue-500')
    }
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

  const detailDayEvents = detailDate
    ? events.filter(e => e.date === detailDate)
    : []

  const detailDayLabel = detailDate
    ? detailDate.replace(/(\d+)-(\d+)-(\d+)/, '$1年$2月$3日')
    : ''

  return (
    <div className="h-full flex flex-col bg-white">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <p className="text-sm font-semibold text-gray-900">スケジュール</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[7rem] text-center">{monthLabel}</span>
          <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* カレンダー本体 */}
        <div className="flex-1 flex flex-col p-4 min-w-0">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 mb-1">
            {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
              <div key={d} className={`text-center text-xs font-semibold py-1.5 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>{d}</div>
            ))}
          </div>

          {/* グリッド */}
          <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden flex-1">
            {cells.map((day, idx) => {
              const dayOfWeek = idx % 7
              const dayEvents = day ? eventsOnDay(day) : []
              const key = day ? makeKey(viewYear, viewMonth, day) : null
              const isSelected = key !== null && detailDate === key
              return (
                <div
                  key={idx}
                  onClick={() => day && handleDayClick(day)}
                  className={`bg-white flex flex-col min-h-[52px] p-0.5 transition-colors
                    ${day ? 'cursor-pointer hover:bg-blue-50' : ''}
                    ${isSelected ? 'bg-blue-50 ring-2 ring-inset ring-blue-300' : ''}
                  `}
                >
                  {day && (
                    <>
                      <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-0.5 mx-auto
                        ${isToday(day) ? 'bg-blue-600 text-white font-bold' : dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : 'text-gray-700'}
                      `}>{day}</span>
                      <div className="flex flex-col gap-px overflow-hidden">
                        {dayEvents.slice(0, 2).map(ev => (
                          <div key={ev.id} className={`${ev.color} text-white text-[9px] font-medium px-1 py-px rounded truncate leading-snug`}>
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[9px] text-gray-400 px-1 leading-none">+{dayEvents.length - 2}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 右サイドパネル：日付詳細 or 月間リスト */}
        <div className="w-52 border-l border-gray-100 flex flex-col overflow-hidden shrink-0">
          {detailDate ? (
            /* 日付詳細 */
            <div className="flex flex-col h-full">
              <div className="px-3 py-3 border-b border-gray-100 shrink-0 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-800">{detailDayLabel}</p>
                <button onClick={() => setDetailDate(null)} className="text-gray-300 hover:text-gray-500">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
                {detailDayEvents.length === 0 && !showAddForm && (
                  <p className="text-xs text-gray-400 text-center py-3">予定はありません</p>
                )}
                {detailDayEvents.map(ev => (
                  <div key={ev.id} className="flex items-start gap-2 group">
                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${ev.color}`} />
                    <p className="text-xs text-gray-700 flex-1 leading-snug">{ev.title}</p>
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 shrink-0"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {showAddForm && (
                  <div className="flex flex-col gap-2 pt-1">
                    <input
                      autoFocus
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                      placeholder="タイトルを入力"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddEvent()}
                    />
                    <div className="flex items-center gap-1 flex-wrap">
                      {EVENT_COLORS.map(c => (
                        <button
                          key={c.value}
                          onClick={() => setNewColor(c.value)}
                          title={c.label}
                          className={`w-4 h-4 rounded-full ${c.value} transition-transform ${newColor === c.value ? 'scale-125 ring-2 ring-offset-1 ring-blue-400' : 'opacity-60 hover:opacity-100'}`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={handleAddEvent}
                        disabled={!newTitle.trim()}
                        className="flex-1 py-1 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40"
                      >
                        追加
                      </button>
                      <button
                        onClick={() => setShowAddForm(false)}
                        className="px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {!showAddForm && (
                <div className="px-3 py-3 border-t border-gray-100 shrink-0">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                    予定を追加
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* 月間予定リスト */
            <div className="flex flex-col h-full">
              <div className="px-3 py-3 border-b border-gray-100 shrink-0">
                <p className="text-xs font-semibold text-gray-500">{viewMonth + 1}月の予定</p>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
                {currentMonthEvents.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">予定はありません</p>
                ) : (
                  currentMonthEvents.map(ev => (
                    <div key={ev.id} className="flex items-start gap-2 group">
                      <div className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${ev.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 truncate leading-snug">{ev.title}</p>
                        <p className="text-[10px] text-gray-400 leading-none mt-0.5">
                          {ev.date.replace(/\d+-(\d+)-(\d+)/, '$1/$2')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 shrink-0"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
