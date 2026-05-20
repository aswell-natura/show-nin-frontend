import { useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useDataStore } from '../../context/DataStoreContext'
import { mockAudioMinutes } from '../../data/mock'

const documentTemplates = ['契約書', '見積書', '提案書', '発注書']

interface GeneratedDocument {
  id: string
  templateTitle: string
  generatedDate: string
}

function renderMarkdown(text: string): ReactNode[] {
  const lines = text.split('\n')
  const nodes: ReactNode[] = []

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

  lines.forEach((line, i) => {
    if (line.startsWith('### ')) {
      nodes.push(<h3 key={i} className="mt-4 mb-1.5 text-sm font-bold text-gray-900">{line.slice(4)}</h3>)
    } else if (line.startsWith('## ')) {
      nodes.push(<h2 key={i} className="mt-5 mb-2 border-b border-gray-100 pb-1 text-base font-bold text-gray-900">{line.slice(3)}</h2>)
    } else if (line.startsWith('# ')) {
      nodes.push(<h1 key={i} className="mt-2 mb-3 text-lg font-bold text-gray-900">{line.slice(2)}</h1>)
    } else if (line.startsWith('- ') || line.startsWith('・ ')) {
      nodes.push(
        <div key={i} className="flex gap-2 text-sm leading-relaxed text-gray-700">
          <span className="mt-0.5 shrink-0 text-gray-400">・</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>,
      )
    } else if (line.trim() === '') {
      nodes.push(<div key={i} className="h-2" />)
    } else {
      nodes.push(<p key={i} className="text-sm leading-relaxed text-gray-700">{renderInline(line)}</p>)
    }
  })

  return nodes
}

function formatDateTime(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}:${ss}`
}

function formatTime(date: Date) {
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${hh}:${mi}:${ss}`
}

function formatDateLabel(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}/${mm}/${dd}`
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const ss = String(totalSeconds % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

function EntityPill({
  icon,
  label,
  value,
  warning = false,
}: {
  icon: ReactNode
  label: string
  value: string
  warning?: boolean
}) {
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${warning ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
      <span className={warning ? 'text-amber-400' : 'text-gray-400'}>{icon}</span>
      <div>
        <p className={`text-xs ${warning ? 'text-amber-500' : 'text-gray-400'}`}>{label}</p>
        <p className={`text-sm font-medium ${warning ? 'text-amber-700' : 'text-gray-800'}`}>{value}</p>
      </div>
    </div>
  )
}

function DocumentIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

export default function AudioMinuteDetail() {
  const { id } = useParams<{ id: string }>()
  const { customers, projects, profiles } = useDataStore()
  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const [editingTranscript, setEditingTranscript] = useState(false)
  const [transcriptText, setTranscriptText] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState(documentTemplates[0])
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([])

  const minute = mockAudioMinutes.find(m => m.id === id)

  if (!minute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-400">議事録が見つかりません</p>
      </div>
    )
  }

  const customer = minute.customer_id ? customers.find(c => c.id === minute.customer_id) : null
  const project = minute.project_id ? projects.find(p => p.id === minute.project_id) : null
  const owner = profiles.find(p => p.id === minute.user_id)
  const displayTranscript = transcriptText ?? minute.transcript
  const recordingStartDate = new Date(`${minute.recording_date}T${minute.start_time}:00`)
  const recordingEndDate = new Date(`${minute.recording_date}T${minute.end_time}:00`)
  const recordingDuration = formatDuration(recordingEndDate.getTime() - recordingStartDate.getTime())
  const doneCount = minute.checklist.filter(c => c.checked).length

  const handleGenerateDocument = () => {
    const now = new Date()
    setGeneratedDocuments(current => [
      {
        id: `${Date.now()}`,
        templateTitle: selectedTemplate,
        generatedDate: formatDateLabel(now),
      },
      ...current,
    ])
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <h1 className="max-w-[70%] truncate text-base font-bold text-gray-900">議事録詳細</h1>
        <button
          onClick={() => window.close()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="閉じる"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-6 py-6">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
          <span>
            <span className="text-xs font-medium text-gray-400">録音時刻: </span>
            {formatDateTime(recordingStartDate)} ～ {formatTime(recordingEndDate)}
          </span>
          <span>
            <span className="text-xs font-medium text-gray-400">録音時間: </span>
            {recordingDuration}
          </span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <EntityPill
              icon={
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              label="企業"
              value={customer?.name ?? '未紐づけ'}
              warning={!customer}
            />
            <EntityPill
              icon={
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                </svg>
              }
              label="案件"
              value={project?.name ?? '未紐づけ'}
              warning={!project}
            />
            {owner && (
              <EntityPill
                icon={
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path d="M20 21a8 8 0 10-16 0" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                }
                label="担当"
                value={owner.name}
              />
            )}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <select
              value={selectedTemplate}
              onChange={event => setSelectedTemplate(event.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-100"
            >
              {documentTemplates.map(template => (
                <option key={template} value={template}>{template}</option>
              ))}
            </select>
            <button
              onClick={handleGenerateDocument}
              className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              ドキュメント生成
            </button>
          </div>
        </div>

        {minute.checklist.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            {generatedDocuments.length > 0 && (
              <div className="mb-5 border-b border-gray-100 pb-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">生成ドキュメント</span>
                  <span className="text-xs text-gray-400">{generatedDocuments.length}件</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {generatedDocuments.map(document => (
                    <div key={document.id} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                      <span className="text-gray-400"><DocumentIcon /></span>
                      <div>
                        <p className="max-w-xs truncate text-sm font-medium text-gray-800">
                          {document.templateTitle} {document.generatedDate}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${item.checked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {item.checked ? (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-500"><DocumentIcon /></span>
              <span className="text-sm font-semibold text-gray-900">議事録</span>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(minute.summary).catch(() => {})}
              className="flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-gray-700"
            >
              コピー
            </button>
          </div>
          <div className="space-y-0.5 px-5 py-4">
            {renderMarkdown(minute.summary)}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <button
              onClick={() => setTranscriptOpen(v => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-900 transition-colors hover:text-blue-600"
            >
              <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
                <path d="M19 10a7 7 0 0 1-14 0M12 19v4M8 23h8" />
              </svg>
              文字起こし
              <svg className={`h-4 w-4 transition-transform ${transcriptOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                  className="flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-gray-700"
                >
                  編集
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(displayTranscript ?? '').catch(() => {})}
                  className="flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-gray-700"
                >
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
                      className="h-48 w-full resize-y rounded-lg border border-gray-200 p-3 font-mono text-sm leading-relaxed text-gray-700 outline-none focus:ring-2 focus:ring-blue-100"
                      value={displayTranscript}
                      onChange={e => setTranscriptText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setTranscriptText(null); setEditingTranscript(false) }}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        リセット
                      </button>
                      <button
                        onClick={() => setEditingTranscript(false)}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{displayTranscript}</p>
                )
              ) : (
                <p className="py-6 text-center text-sm text-gray-400">文字起こしデータがありません</p>
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
