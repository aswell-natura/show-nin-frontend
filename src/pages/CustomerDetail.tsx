import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { useDataStore } from '../context/DataStoreContext'
import ActivityTypeIcon from '../components/dashboard/widgets/ActivityTypeIcon'
import { RankBadge, StatusBadge } from '../components/dashboard/shared/StatusBadge'
import { Button } from '@/components/ui/button'

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
        <div className="flex items-center justify-center h-full text-muted-foreground bg-background">
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
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">企業概要</p>
      <dl className="flex flex-col gap-4 text-sm">
        {customer.employee_count && (
          <div>
            <dt className="text-xs text-muted-foreground mb-0.5">従業員数</dt>
            <dd className="text-foreground font-medium">{customer.employee_count.toLocaleString()}名</dd>
          </div>
        )}
        {customer.address && (
          <div>
            <dt className="text-xs text-muted-foreground mb-0.5">所在地</dt>
            <dd className="text-foreground text-xs leading-relaxed">{customer.address}</dd>
          </div>
        )}
        {customer.phone && (
          <div>
            <dt className="text-xs text-muted-foreground mb-0.5">電話番号</dt>
            <dd className="text-foreground font-medium">{customer.phone}</dd>
          </div>
        )}
        {customer.website && (
          <div>
            <dt className="text-xs text-muted-foreground mb-0.5">Webサイト</dt>
            <dd className="text-primary text-xs break-all hover:underline cursor-pointer">{customer.website}</dd>
          </div>
        )}
      </dl>

      {customer.note && (
        <div className="mt-6 pt-5 border-t border-border/50">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">メモ</p>
          <p className="text-xs text-foreground/80 leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/50">{customer.note}</p>
        </div>
      )}

      <div className="mt-6 pt-5 border-t border-border/50">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">名刺情報</p>
        <div className="flex flex-col gap-2.5">
          {[
            { name: '山田 智', dept: 'DX推進室 室長', email: 'yamada@example.com' },
            { name: '佐々木 誠', dept: '情報システム部', email: 'sasaki@example.com' },
          ].map((card, i) => (
            <div key={i} className="p-3 bg-muted/30 border border-border/50 rounded-lg text-xs hover:bg-muted/50 transition-colors cursor-pointer">
              <p className="font-semibold text-foreground">{card.name}</p>
              <p className="text-muted-foreground mt-0.5">{card.dept}</p>
              <p className="text-primary mt-1">{card.email}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const ActivitiesContent = (
    <div className="px-4 md:px-5 py-5">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">活動履歴</p>
      <div className="flex flex-col gap-3">
        {activities.map((act) => {
          const isSelected = act.id === selectedActivityId
          return (
            <button
              key={act.id}
              onClick={() => setSelectedActivityId(isSelected ? null : act.id)}
              className={`
                w-full text-left p-4 rounded-xl border transition-all duration-200
                ${isSelected
                  ? 'border-primary/40 bg-primary/5 shadow-md scale-[1.01]'
                  : 'border-border bg-card hover:shadow-sm hover:border-primary/20 hover:bg-accent/5'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
                  <ActivityTypeIcon type={act.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 justify-between mb-1">
                    <p className="text-sm font-semibold text-foreground flex-1 leading-tight">{act.title}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2 mt-0.5">{formatDate(act.created_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{act.content_json.summary}</p>
                  {act.audio_url && (
                    <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                      🎙 音声あり
                    </span>
                  )}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-border/60">
                      {act.content_json.transcript && (
                        <div className="mb-4">
                          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">文字起こし（抜粋）</p>
                          <p className="text-xs text-foreground/80 leading-relaxed bg-background rounded-lg p-3.5 border border-border/50 max-h-40 overflow-y-auto whitespace-pre-line shadow-inner">
                            {act.content_json.transcript}
                          </p>
                        </div>
                      )}
                      {act.content_json.checklist && (
                        <div>
                          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">ヒアリング項目</p>
                          <div className="flex flex-col gap-1.5">
                            {act.content_json.checklist.map((item, i) => (
                              <div key={i} className="flex items-center gap-2.5 text-xs bg-background/50 p-2 rounded-md border border-border/30">
                                <span className={`flex items-center justify-center w-4 h-4 rounded-full border ${item.checked ? 'bg-green-500 border-green-500 text-white' : 'border-muted-foreground/30 text-transparent'}`}>
                                  {item.checked ? <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : ''}
                                </span>
                                <span className={item.checked ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                                  {item.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); navigate(`/reports/${act.id}`) }}
                        className="mt-4 text-xs text-primary hover:text-primary hover:bg-primary/10 -ml-2"
                      >
                        レポートを開く →
                      </Button>
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
    <div className="px-4 py-5 bg-background">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">進行中の案件</p>
      <div className="flex flex-col gap-2.5 mb-8">
        {projects.filter((p) => p.status !== 'closed').map((proj) => (
          <div key={proj.id} className="p-3.5 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <p className="text-sm font-semibold text-foreground mb-2 truncate">{proj.name}</p>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <StatusBadge status={proj.status} />
              <span className="text-xs font-medium text-foreground/80">
                {(proj.amount / 10000).toLocaleString()}万円
              </span>
            </div>
            {proj.close_date && (
              <div className="mt-3 pt-2 border-t border-border/50 flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground">完了予定</span>
                <span className="font-medium text-foreground">{proj.close_date}</span>
              </div>
            )}
          </div>
        ))}
        {projects.filter((p) => p.status !== 'closed').length === 0 && (
          <div className="p-4 border border-dashed border-border rounded-xl text-center">
             <p className="text-xs text-muted-foreground">進行中の案件はありません</p>
          </div>
        )}
      </div>

      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">未完了タスク</p>
      <div className="flex flex-col gap-2.5">
        {tasks.map((task) => {
          const isOverdue = new Date(task.due_date) < new Date()
          return (
            <div key={task.id} className={`p-3.5 rounded-xl border shadow-sm flex flex-col gap-2 cursor-pointer transition-colors hover:bg-muted/30 ${isOverdue ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card'}`}>
              <div className="flex items-start gap-2">
                <div className={`mt-0.5 w-3 h-3 rounded-sm border ${isOverdue ? 'border-destructive' : 'border-muted-foreground/50'} shrink-0`} />
                <p className="text-sm text-foreground/90 leading-snug">{task.title}</p>
              </div>
              <div className="flex items-center gap-1.5 ml-5">
                {isOverdue && <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-bold">期限切れ</span>}
                <p className={`text-[11px] font-medium ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {task.due_date}
                </p>
              </div>
            </div>
          )
        })}
        {tasks.length === 0 && (
          <div className="p-4 border border-dashed border-border rounded-xl text-center">
            <p className="text-xs text-muted-foreground">未完了タスクはありません</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-background">

        {/* 顧客ヘッダー */}
        <div className="bg-card border-b border-border px-4 md:px-6 py-4 md:py-5 shrink-0 shadow-sm z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground h-8 w-8"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              <div className="min-w-0 pt-0.5">
                <div className="flex items-center gap-3 flex-wrap mb-1.5">
                  <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight">{customer.name}</h1>
                  <RankBadge rank={customer.rank} size="lg" />
                  <span className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground font-medium hidden sm:inline">
                    {customer.industry}
                  </span>
                  {customer.is_pinned && (
                    <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-md font-medium shrink-0 flex items-center gap-1">
                      📌 ピン留め済み
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  {owner && <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> 担当: <span className="font-medium text-foreground/80">{owner.name}</span></span>}
                  <span className="hidden sm:inline text-border">|</span>
                  <span>最終アクセス: {formatDate(customer.last_accessed_at)}</span>
                </div>
              </div>
            </div>
            
            <div className="shrink-0 hidden md:flex gap-2">
              <Button variant="secondary" size="sm">
                編集
              </Button>
              <Button variant="primary" size="sm">
                活動を記録
              </Button>
            </div>
          </div>
        </div>

        {/* モバイルタブバー */}
        <div className="md:hidden flex border-b border-border bg-card shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm transition-all relative ${
                activeTab === tab.id
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* モバイル：タブに対応した単一カラム */}
        <div className="md:hidden flex-1 overflow-y-auto bg-background/50">
          {activeTab === 'profile'    && ProfileContent}
          {activeTab === 'activities' && ActivitiesContent}
          {activeTab === 'tasks'      && TasksContent}
        </div>

        {/* デスクトップ：3カラムレイアウト */}
        <div className="hidden md:flex flex-1 overflow-hidden bg-muted/10">
          <div className="w-72 shrink-0 border-r border-border bg-background overflow-y-auto shadow-[1px_0_10px_rgba(0,0,0,0.02)] z-10">
            {ProfileContent}
          </div>
          <div className="flex-1 overflow-y-auto border-r border-border bg-background">
            {ActivitiesContent}
          </div>
          <div className="w-80 shrink-0 overflow-y-auto bg-muted/5">
            {TasksContent}
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
