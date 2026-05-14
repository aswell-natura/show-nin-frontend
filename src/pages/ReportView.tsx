import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { useDataStore } from '../context/DataStoreContext'
import { StatusBadge } from '../components/dashboard/shared/StatusBadge'
import { Button } from '@/components/ui/button'

const hearingTemplate = [
  { category: '現状確認', items: ['現在の課題・痛み', '現状のシステム・プロセス', '課題が発生した背景・時期'] },
  { category: '要件定義', items: ['必要な機能・要件', '非機能要件（性能・セキュリティ）', '連携が必要な既存システム'] },
  { category: '意思決定', items: ['予算感・上限', '意思決定のプロセス・期限', '競合他社の検討状況'] },
  { category: 'ネクストアクション', items: ['次回MTGの目的', '先方の準備事項', 'こちらの宿題・持ち帰り事項'] },
]

export default function ReportView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { activities: allActivities, customers, projects: allProjects } = useDataStore()

  const activity = allActivities.find((a) => a.id === id)
  const customer = activity ? customers.find((c) => c.id === activity.customer_id) : null
  const project = activity?.project_id ? allProjects.find((p) => p.id === activity.project_id) : null

  const [editContent, setEditContent] = useState(
    activity
      ? `## AI要約\n\n${activity.content_json.summary}\n\n---\n\n## 議事録\n\n${activity.content_json.transcript ?? '（文字起こしデータなし）'}`
      : ''
  )
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(
    activity?.content_json.checklist?.reduce(
      (acc, item) => ({ ...acc, [item.label]: item.checked }),
      {} as Record<string, boolean>
    ) ?? {}
  )

  function toggleItem(label: string) {
    setCheckedItems((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  function handleOpenNewWindow() {
    window.open(window.location.href, '_blank', 'width=1100,height=800')
  }

  if (!activity) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full text-muted-foreground bg-background">
          レポートが見つかりません
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-background">
        {/* レポートヘッダー */}
        <div className="bg-card border-b border-border px-4 md:px-6 py-3 flex items-center gap-3 shrink-0 shadow-sm z-10">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground p-2 -ml-2 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-foreground truncate">{activity.title}</h1>
              {customer && (
                <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">— {customer.name}</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {new Date(activity.created_at).toLocaleDateString('ja-JP', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {activity.audio_url && (
              <Button variant="secondary" size="sm" className="hidden sm:flex gap-1.5 h-8">
                🎙 音声を再生
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenNewWindow}
              title="別ウィンドウで開く"
              className="gap-1.5 h-8"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="hidden sm:inline">別ウィンドウ</span>
            </Button>
            <Button variant="primary" size="sm" className="h-8 px-4 font-semibold">
              保存
            </Button>
          </div>
        </div>

        {/* 2カラムコンテンツ：モバイルで縦積み / デスクトップで横並び */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
          {/* エディタ（モバイル: 固定高さ / デスクトップ: 2/3） */}
          <div className="flex flex-col h-[55vh] lg:h-auto lg:flex-[2] overflow-hidden border-b lg:border-b-0 lg:border-r border-border bg-background">
            {/* AI要約バナー */}
            <div className="bg-primary/5 border-b border-primary/20 px-5 py-3.5 shrink-0">
              <div className="flex items-start gap-3">
                <span className="text-primary text-lg shrink-0 mt-0.5">✨</span>
                <div>
                  <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1">AI要約</p>
                  <p className="text-sm text-foreground/90 leading-relaxed font-medium">{activity.content_json.summary}</p>
                </div>
              </div>
            </div>

            {/* 案件情報 */}
            {project && (
              <div className="bg-muted/10 border-b border-border px-5 py-3 flex items-center gap-3 shrink-0">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">関連案件:</span>
                <span className="text-sm font-bold text-foreground">{project.name}</span>
                <StatusBadge status={project.status} />
              </div>
            )}

            {/* テキストエディタ */}
            <textarea
              className="flex-1 resize-none p-5 text-sm text-foreground leading-relaxed outline-none font-mono bg-background placeholder:text-muted-foreground/50"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="議事録・メモを入力してください..."
            />
          </div>

          {/* ヒアリングテンプレート（モバイル: 下に展開 / デスクトップ: 1/3） */}
          <div className="lg:flex-[1] lg:overflow-y-auto px-4 md:px-6 py-5 bg-muted/10 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">ヒアリング項目</p>
              <div className="text-xs font-medium text-muted-foreground bg-card px-2 py-1 rounded-md border border-border shadow-sm">
                <span className="text-foreground">{Object.values(checkedItems).filter(Boolean).length}</span>
                <span className="mx-1">/</span>
                <span>{Object.keys(checkedItems).length}</span> 確認済み
              </div>
            </div>

            {activity.content_json.checklist && activity.content_json.checklist.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold text-foreground mb-3 pl-1">今回の商談</p>
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  {activity.content_json.checklist.map((item, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer border-b border-border last:border-0 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checkedItems[item.label] ?? item.checked}
                        onChange={() => toggleItem(item.label)}
                        className="accent-primary w-4 h-4 shrink-0 rounded border-input"
                      />
                      <span className={`text-sm font-medium ${checkedItems[item.label] ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {hearingTemplate.map((section) => (
              <div key={section.category} className="mb-6">
                <p className="text-xs font-bold text-foreground mb-3 pl-1">{section.category}</p>
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  {section.items.map((item, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer border-b border-border last:border-0 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checkedItems[item] ?? false}
                        onChange={() => toggleItem(item)}
                        className="accent-primary w-4 h-4 shrink-0 rounded border-input"
                      />
                      <span className={`text-sm font-medium ${checkedItems[item] ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
