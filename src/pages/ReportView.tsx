import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { useDataStore } from '../context/DataStoreContext'

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
        <div className="flex items-center justify-center h-full text-gray-400">
          レポートが見つかりません
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* レポートヘッダー */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-semibold text-gray-900 truncate">{activity.title}</h1>
              {customer && (
                <span className="text-xs text-gray-400 shrink-0">— {customer.name}</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(activity.created_at).toLocaleDateString('ja-JP', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {activity.audio_url && (
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors">
                🎙 音声を再生
              </button>
            )}
            <button
              onClick={handleOpenNewWindow}
              title="別ウィンドウで開く"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              別ウィンドウ
            </button>
            <button className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
              保存
            </button>
          </div>
        </div>

        {/* 2カラムコンテンツ：モバイルで縦積み / デスクトップで横並び */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
          {/* エディタ（モバイル: 固定高さ / デスクトップ: 2/3） */}
          <div className="flex flex-col h-[55vh] lg:h-auto lg:flex-[2] overflow-hidden border-b lg:border-b-0 lg:border-r border-gray-200">
            {/* AI要約バナー */}
            <div className="bg-blue-50 border-b border-blue-100 px-5 py-3 shrink-0">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 text-base shrink-0">✨</span>
                <div>
                  <p className="text-xs font-semibold text-blue-700 mb-0.5">AI要約</p>
                  <p className="text-sm text-blue-800 leading-relaxed">{activity.content_json.summary}</p>
                </div>
              </div>
            </div>

            {/* 案件情報 */}
            {project && (
              <div className="bg-white border-b border-gray-100 px-5 py-2.5 flex items-center gap-3 shrink-0">
                <span className="text-xs text-gray-400">関連案件:</span>
                <span className="text-xs font-medium text-gray-700">{project.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  project.status === 'negotiating' ? 'bg-yellow-100 text-yellow-700' :
                  project.status === 'proposing' ? 'bg-blue-100 text-blue-700' :
                  project.status === 'closed' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {({ lead: 'リード', proposing: '提案中', negotiating: '交渉中', closed: '成約' })[project.status]}
                </span>
              </div>
            )}

            {/* テキストエディタ */}
            <textarea
              className="flex-1 resize-none p-5 text-sm text-gray-800 leading-relaxed outline-none font-mono bg-white"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="議事録・メモを入力してください..."
            />
          </div>

          {/* ヒアリングテンプレート（モバイル: 下に展開 / デスクトップ: 1/3） */}
          <div className="lg:flex-[1] lg:overflow-y-auto px-4 py-5 bg-gray-50 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">ヒアリング項目</p>
              <span className="text-xs text-gray-400">
                {Object.values(checkedItems).filter(Boolean).length} / {Object.keys(checkedItems).length} 確認済み
              </span>
            </div>

            {activity.content_json.checklist && activity.content_json.checklist.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 mb-2">今回の商談</p>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {activity.content_json.checklist.map((item, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={checkedItems[item.label] ?? item.checked}
                        onChange={() => toggleItem(item.label)}
                        className="accent-blue-600 w-3.5 h-3.5 shrink-0"
                      />
                      <span className={`text-sm ${checkedItems[item.label] ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {hearingTemplate.map((section) => (
              <div key={section.category} className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">{section.category}</p>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {section.items.map((item, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={checkedItems[item] ?? false}
                        onChange={() => toggleItem(item)}
                        className="accent-blue-600 w-3.5 h-3.5 shrink-0"
                      />
                      <span className={`text-sm ${checkedItems[item] ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
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
