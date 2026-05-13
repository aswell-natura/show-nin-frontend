import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { useDataStore } from '../context/DataStoreContext'
import ActivityTypeIcon from '../components/dashboard/widgets/ActivityTypeIcon'

const statusLabel: Record<string, string> = {
  lead: 'リード', proposing: '提案中', negotiating: '交渉中', closed: '成約',
}
const statusColor: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-600',
  proposing: 'bg-blue-100 text-blue-700',
  negotiating: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-green-100 text-green-700',
}

type Tab = 'profile' | 'activities' | 'tasks'

const tabs: { id: Tab; label: string }[] = [
  { id: 'profile',    label: '企業概要' },
  { id: 'activities', label: '活動履歴' },
  { id: 'tasks',      label: '案件・タスク' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { customers, projects: allProjects, activities: allActivities, tasks: allTasks, profiles } = useDataStore()
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('activities')

  const customer = customers.find((c) => c.id === id)
  if (!customer) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full text-gray-400">
          顧客が見つかりません
        </div>
      </AppLayout>
    )
  }

  const projects = allProjects.filter((p) => p.customer_id === id)
  const activities = allActivities
    .filter((a) => a.customer_id === id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const tasks = allTasks.filter((t) => t.customer_id === id && !t.is_completed)
  const owner = profiles.find((p) => p.id === customer.created_by)

  // ─── 各カラムのコンテンツ ────────────────────────────────────────────────

  const ProfileContent = (
    <div className="px-4 py-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">企業概要</p>
      <dl className="flex flex-col gap-3 text-sm">
        {customer.employee_count && (
          <div>
            <dt className="text-xs text-gray-400">従業員数</dt>
            <dd className="text-gray-800 font-medium">{customer.employee_count.toLocaleString()}名</dd>
          </div>
        )}
        {customer.address && (
          <div>
            <dt className="text-xs text-gray-400">所在地</dt>
            <dd className="text-gray-800 text-xs leading-relaxed">{customer.address}</dd>
          </div>
        )}
        {customer.phone && (
          <div>
            <dt className="text-xs text-gray-400">電話番号</dt>
            <dd className="text-gray-800">{customer.phone}</dd>
          </div>
        )}
        {customer.website && (
          <div>
            <dt className="text-xs text-gray-400">Webサイト</dt>
            <dd className="text-blue-600 text-xs break-all">{customer.website}</dd>
          </div>
        )}
      </dl>

      {customer.note && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">メモ</p>
          <p className="text-xs text-gray-600 leading-relaxed">{customer.note}</p>
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">名刺情報</p>
        <div className="flex flex-col gap-2">
          {[
            { name: '山田 智', dept: 'DX推進室 室長', email: 'yamada@example.com' },
            { name: '佐々木 誠', dept: '情報システム部', email: 'sasaki@example.com' },
          ].map((card, i) => (
            <div key={i} className="p-2.5 bg-gray-50 rounded-lg text-xs">
              <p className="font-semibold text-gray-800">{card.name}</p>
              <p className="text-gray-500">{card.dept}</p>
              <p className="text-blue-500 mt-0.5">{card.email}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const ActivitiesContent = (
    <div className="px-4 md:px-5 py-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">活動履歴</p>
      <div className="flex flex-col gap-2.5">
        {activities.map((act) => {
          const isSelected = act.id === selectedActivityId
          return (
            <button
              key={act.id}
              onClick={() => setSelectedActivityId(isSelected ? null : act.id)}
              className={`
                w-full text-left p-3.5 rounded-xl border transition-all duration-150
                ${isSelected
                  ? 'border-blue-300 bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:shadow-sm hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <ActivityTypeIcon type={act.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 justify-between">
                    <p className="text-sm font-semibold text-gray-900 flex-1">{act.title}</p>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">{formatDate(act.created_at)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{act.content_json.summary}</p>
                  {act.audio_url && (
                    <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-blue-600">
                      🎙 音声あり
                    </span>
                  )}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      {act.content_json.transcript && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">文字起こし（抜粋）</p>
                          <p className="text-xs text-gray-600 leading-relaxed bg-white rounded-lg p-3 border border-gray-100 max-h-32 overflow-y-auto whitespace-pre-line">
                            {act.content_json.transcript}
                          </p>
                        </div>
                      )}
                      {act.content_json.checklist && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1.5">ヒアリング項目</p>
                          <div className="flex flex-col gap-1">
                            {act.content_json.checklist.map((item, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <span className={item.checked ? 'text-green-500' : 'text-gray-300'}>
                                  {item.checked ? '✓' : '○'}
                                </span>
                                <span className={item.checked ? 'text-gray-700' : 'text-gray-400'}>
                                  {item.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/reports/${act.id}`) }}
                        className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        レポートを開く →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )

  const TasksContent = (
    <div className="px-4 py-5 bg-white">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">進行中の案件</p>
      <div className="flex flex-col gap-2 mb-6">
        {projects.filter((p) => p.status !== 'closed').map((proj) => (
          <div key={proj.id} className="p-3 rounded-xl border border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-1">{proj.name}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[proj.status]}`}>
                {statusLabel[proj.status]}
              </span>
              <span className="text-xs text-gray-400">
                {(proj.amount / 10000).toLocaleString()}万円
              </span>
            </div>
            {proj.close_date && (
              <p className="text-xs text-gray-400 mt-1">予定: {proj.close_date}</p>
            )}
          </div>
        ))}
        {projects.filter((p) => p.status !== 'closed').length === 0 && (
          <p className="text-xs text-gray-400">進行中の案件はありません</p>
        )}
      </div>

      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">未完了タスク</p>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => {
          const isOverdue = new Date(task.due_date) < new Date()
          return (
            <div key={task.id} className="p-3 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-800">{task.title}</p>
              <p className={`text-xs mt-1 font-medium ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                {isOverdue ? '⚠ ' : ''}{task.due_date}
              </p>
            </div>
          )
        })}
        {tasks.length === 0 && (
          <p className="text-xs text-gray-400">未完了タスクはありません</p>
        )}
      </div>
    </div>
  )

  return (
    <AppLayout>
      <div className="h-full flex flex-col">

        {/* 顧客ヘッダー */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="mt-0.5 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg md:text-xl font-bold text-gray-900">{customer.name}</h1>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ${
                    customer.rank === 'A' ? 'bg-blue-100 text-blue-700' :
                    customer.rank === 'B' ? 'bg-gray-100 text-gray-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>ランク {customer.rank}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 hidden sm:inline">
                    {customer.industry}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                  {owner && <span>担当: {owner.name}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* モバイルタブバー */}
        <div className="md:hidden flex border-b border-gray-200 bg-white shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* モバイル：タブに対応した単一カラム */}
        <div className="md:hidden flex-1 overflow-y-auto bg-white">
          {activeTab === 'profile'    && ProfileContent}
          {activeTab === 'activities' && ActivitiesContent}
          {activeTab === 'tasks'      && TasksContent}
        </div>

        {/* デスクトップ：3カラムレイアウト */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          <div className="w-64 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
            {ProfileContent}
          </div>
          <div className="flex-1 overflow-y-auto border-r border-gray-200">
            {ActivitiesContent}
          </div>
          <div className="w-64 shrink-0 overflow-y-auto">
            {TasksContent}
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
