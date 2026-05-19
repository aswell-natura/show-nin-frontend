import { useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useDataStore } from '../../context/DataStoreContext'
import { mockAudioMinutes } from '../../data/mock'

// ─── シンプルなMarkdownレンダラー ─────────────────────────────────────────────

function renderMarkdown(text: string): ReactNode[] {
  const lines = text.split('\n')
  const nodes: ReactNode[] = []
  let i = 0

  function renderInline(line: string): ReactNode {
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    return (
      <>
        {parts.map((part, idx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={idx}>{part.slice(2, -2)}</strong>
          }
          return part
        })}
      </>
    )
  }

  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('### ')) {
      nodes.push(<h3 key={i} className="text-sm font-bold text-gray-900 mt-4 mb-1.5">{line.slice(4)}</h3>)
    } else if (line.startsWith('## ')) {
      nodes.push(<h2 key={i} className="text-base font-bold text-gray-900 mt-5 mb-2 border-b border-gray-100 pb-1">{line.slice(3)}</h2>)
    } else if (line.startsWith('# ')) {
      nodes.push(<h1 key={i} className="text-lg font-bold text-gray-900 mt-2 mb-3">{line.slice(2)}</h1>)
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      nodes.push(
        <div key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
          <span className="text-gray-400 shrink-0 mt-0.5">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      )
    } else if (line.trim() === '') {
      nodes.push(<div key={i} className="h-2" />)
    } else {
      nodes.push(<p key={i} className="text-sm text-gray-700 leading-relaxed">{renderInline(line)}</p>)
    }
    i++
  }
  return nodes
}

// ─── メインコンポーネント ─────────────────────────────────────────────────────

export default function AudioMinuteDetail() {
  const { id } = useParams<{ id: string }>()
  const { customers, projects, profiles } = useDataStore()
  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const [editingTranscript, setEditingTranscript] = useState(false)
  const [transcriptText, setTranscriptText] = useState<string | null>(null)

  const minute = mockAudioMinutes.find(m => m.id === id)

  if (!minute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-400">議事録が見つかりません</p>
      </div>
    )
  }

  const customer = minute.customer_id ? customers.find(c => c.id === minute.customer_id) : null
  const project = minute.project_id ? projects.find(p => p.id === minute.project_id) : null
  const owner = profiles.find(p => p.id === minute.user_id)
  const displayTranscript = transcriptText ?? minute.transcript

  const generatedAt = new Date(minute.created_at).toLocaleString('ja-JP', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const recordingStart = `${minute.recording_date.replace(/-/g, '/')} ${minute.start_time}`

  const doneCount = minute.checklist.filter(c => c.checked).length

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-base font-bold text-gray-900 truncate max-w-[70%]">{minute.title}</h1>
        <button
          onClick={() => window.close()}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0"
          title="閉じる"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">

        {/* メタ情報 */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
          <span>
            <span className="font-medium text-gray-400 text-xs">議事録生成: </span>
            {generatedAt}
          </span>
          <span>
            <span className="font-medium text-gray-400 text-xs">録音開始: </span>
            {recordingStart}
          </span>
          <span>
            <span className="font-medium text-gray-400 text-xs">録音終了: </span>
            {minute.recording_date.replace(/-/g, '/')} {minute.end_time}
          </span>
          {owner && (
            <span>
              <span className="font-medium text-gray-400 text-xs">担当: </span>
              {owner.name}
            </span>
          )}
        </div>

        {/* 紐付け情報 */}
        <div className="flex flex-wrap gap-3">
          {customer ? (
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div>
                <p className="text-xs text-gray-400">企業</p>
                <p className="text-sm font-medium text-gray-800">{customer.name}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div>
                <p className="text-xs text-amber-500">企業</p>
                <p className="text-sm font-medium text-amber-700">未確認（要紐付け）</p>
              </div>
            </div>
          )}
          {project ? (
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
              <div>
                <p className="text-xs text-gray-400">案件</p>
                <p className="text-sm font-medium text-gray-800">{project.name}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
              <div>
                <p className="text-xs text-amber-500">案件</p>
                <p className="text-sm font-medium text-amber-700">未設定</p>
              </div>
            </div>
          )}
        </div>

        {/* 音声プレーヤー */}
        {minute.audio_url && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                </svg>
                音声
              </div>
              <span className="text-xs text-gray-400">
                {minute.start_time} 〜 {minute.end_time}
              </span>
            </div>
            <audio
              controls
              className="w-full h-10 rounded-lg"
              src={minute.audio_url}
              onError={e => { (e.currentTarget as HTMLAudioElement).style.display = 'none' }}
            />
          </div>
        )}

        {/* チェックリスト */}
        {minute.checklist.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                <span className="text-sm font-semibold text-gray-900">チェックリスト</span>
              </div>
              <span className="text-xs text-gray-500">{doneCount}/{minute.checklist.length} 完了</span>
            </div>
            <div className="space-y-2">
              {minute.checklist.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.checked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {item.checked ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    )}
                  </span>
                  <span className={`text-sm ${item.checked ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 議事録 */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span className="text-sm font-semibold text-gray-900">議事録</span>
            </div>
            <button
              onClick={() => {
                const text = minute.summary
                navigator.clipboard.writeText(text).catch(() => {})
              }}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              コピー
            </button>
          </div>
          <div className="px-5 py-4 space-y-0.5">
            {renderMarkdown(minute.summary)}
          </div>
        </div>

        {/* 文字起こし */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <button
              onClick={() => setTranscriptOpen(v => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
                <path d="M19 10a7 7 0 0 1-14 0M12 19v4M8 23h8" />
              </svg>
              文字起こし
              <svg className={`w-4 h-4 transition-transform ${transcriptOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {displayTranscript && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!transcriptOpen) setTranscriptOpen(true)
                    setEditingTranscript(v => !v)
                  }}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  編集
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(displayTranscript ?? '').catch(() => {})}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  コピー
                </button>
              </div>
            )}
          </div>

          {transcriptOpen && (
            <div className="px-5 py-4">
              {displayTranscript ? (
                editingTranscript ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      autoFocus
                      className="w-full h-48 text-sm text-gray-700 leading-relaxed border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-100 resize-y font-mono"
                      value={displayTranscript}
                      onChange={e => setTranscriptText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setTranscriptText(null); setEditingTranscript(false) }}
                        className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        リセット
                      </button>
                      <button
                        onClick={() => setEditingTranscript(false)}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{displayTranscript}</p>
                )
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">文字起こしデータがありません</p>
              )}
            </div>
          )}

          {!transcriptOpen && !displayTranscript && (
            <div className="px-5 py-3">
              <p className="text-xs text-gray-400">クリックして展開</p>
            </div>
          )}
        </div>

        <div className="h-8" />
      </div>
    </div>
  )
}
