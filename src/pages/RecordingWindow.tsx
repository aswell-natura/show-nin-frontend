import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useDataStore } from '../context/DataStoreContext'

type RecordingStatus = 'idle' | 'recording' | 'paused' | 'unsupported' | 'error'

interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: {
    transcript: string
  }
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number
  results: {
    length: number
    [index: number]: SpeechRecognitionResultLike
  }
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

const checklistTemplate = [
  {
    id: 'challenge',
    label: '現状課題',
    keywords: ['課題', '困って', '問題', '改善', '属人化', '効率'],
  },
  {
    id: 'budget',
    label: '予算感',
    keywords: ['予算', '金額', '費用', '価格', '万円', 'コスト'],
  },
  {
    id: 'schedule',
    label: '導入時期',
    keywords: ['時期', '来月', '今期', '来期', '導入', 'スケジュール'],
  },
  {
    id: 'decision',
    label: '決裁者',
    keywords: ['決裁', '上長', '部長', '役員', '承認', '稟議'],
  },
  {
    id: 'next',
    label: '次回アクション',
    keywords: ['次回', '資料', '送付', '確認', '日程', '打ち合わせ'],
  },
]

const taskRules = [
  {
    title: '提案資料を送付する',
    keywords: ['資料', '送付', '共有'],
    detail: '会話内で資料送付に関する言及がありました。',
  },
  {
    title: '次回打ち合わせ日程を調整する',
    keywords: ['次回', '日程', '打ち合わせ', 'ミーティング'],
    detail: '次回接点の調整が必要そうです。',
  },
  {
    title: '見積もりを作成する',
    keywords: ['見積', '金額', '費用', '予算'],
    detail: '費用や予算の確認に関連する発言がありました。',
  },
  {
    title: '決裁者と導入フローを確認する',
    keywords: ['決裁', '承認', '稟議', '上長'],
    detail: '意思決定プロセスの確認が必要そうです。',
  },
]

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function findKeywordSentence(text: string, keywords: string[]) {
  const normalized = normalizeText(text)
  if (!normalized) return ''
  const parts = normalized.split(/[。！？!?]/).map((part) => part.trim()).filter(Boolean)
  return parts.find((part) => keywords.some((keyword) => part.includes(keyword))) ?? ''
}

function Section({
  title,
  count,
  action,
  children,
}: {
  title: string
  count: number
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-bold text-gray-950 truncate">{title}</h2>
          <span className="min-w-6 h-6 px-1.5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
            {count}
          </span>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function RecordingWindow() {
  const { customers, projects } = useDataStore()
  const [status, setStatus] = useState<RecordingStatus>(() =>
    window.SpeechRecognition || window.webkitSpeechRecognition ? 'idle' : 'unsupported',
  )
  const [finalTranscript, setFinalTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [errorMessage, setErrorMessage] = useState(() =>
    window.SpeechRecognition || window.webkitSpeechRecognition
      ? ''
      : 'このブラウザは音声認識に対応していません。Chrome系ブラウザで開いてください。',
  )
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const shouldRestartRef = useRef(false)

  const selectedCustomer = customers[0]
  const selectedProject = selectedCustomer
    ? projects.find((project) => project.customer_id === selectedCustomer.id)
    : null

  const transcript = normalizeText(`${finalTranscript} ${interimTranscript}`)

  const checklistMatches = useMemo(
    () =>
      checklistTemplate.map((item) => ({
        ...item,
        match: findKeywordSentence(transcript, item.keywords),
      })),
    [transcript],
  )

  const matchedChecklist = checklistMatches.filter((item) => item.match)

  const suggestedTasks = useMemo(
    () =>
      taskRules
        .map((task) => ({
          ...task,
          source: findKeywordSentence(transcript, task.keywords),
        }))
        .filter((task) => task.source),
    [transcript],
  )

  const assistantMessages = useMemo(() => {
    if (!transcript) return []

    const messages: string[] = []
    if (findKeywordSentence(transcript, ['課題', '困って', '問題'])) {
      messages.push('課題が出ています。影響範囲と優先度をもう一段掘ると提案に繋げやすくなります。')
    }
    if (findKeywordSentence(transcript, ['予算', '金額', '費用', '価格'])) {
      messages.push('予算に触れられています。決裁可能な金額帯と比較対象を確認してください。')
    }
    if (findKeywordSentence(transcript, ['導入', '時期', '来月', '今期', '来期'])) {
      messages.push('導入時期の話題があります。逆算して次回までの宿題を明確にするとよさそうです。')
    }
    if (findKeywordSentence(transcript, ['決裁', '承認', '稟議', '上長'])) {
      messages.push('意思決定者に関する情報が出ています。決裁フローと同席者を確認しましょう。')
    }

    return messages.length > 0
      ? messages
      : ['会話を解析中です。課題、予算、導入時期、決裁者に関する発言を検知すると助言を表示します。']
  }, [transcript])

  useEffect(() => {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Recognition) {
      return
    }

    const recognition = new Recognition()
    recognition.lang = 'ja-JP'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => {
      setStatus('recording')
      setErrorMessage('')
    }

    recognition.onresult = (event) => {
      let finalText = ''
      let interimText = ''

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const text = result[0].transcript
        if (result.isFinal) {
          finalText += text
        } else {
          interimText += text
        }
      }

      if (finalText) {
        setFinalTranscript((current) => normalizeText(`${current} ${finalText}`))
      }
      setInterimTranscript(interimText)
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return
      setStatus('error')
      shouldRestartRef.current = false
      setErrorMessage(`音声認識エラー: ${event.error}`)
    }

    recognition.onend = () => {
      if (shouldRestartRef.current) {
        try {
          recognition.start()
        } catch {
          setStatus('error')
          setErrorMessage('音声認識の再開に失敗しました。少し待ってから再開してください。')
        }
        return
      }
      setStatus((current) => (current === 'recording' ? 'paused' : current))
    }

    recognitionRef.current = recognition

    return () => {
      shouldRestartRef.current = false
      recognition.abort()
      recognitionRef.current = null
    }
  }, [])

  function startRecording() {
    const recognition = recognitionRef.current
    if (!recognition) return
    shouldRestartRef.current = true
    setErrorMessage('')
    try {
      recognition.start()
    } catch {
      setStatus('error')
      shouldRestartRef.current = false
      setErrorMessage('音声認識の開始に失敗しました。少し待ってから開始を押してください。')
    }
  }

  function pauseRecording() {
    const recognition = recognitionRef.current
    if (!recognition) return
    shouldRestartRef.current = false
    recognition.stop()
    setStatus('paused')
  }

  function finishRecording() {
    const recognition = recognitionRef.current
    shouldRestartRef.current = false
    recognition?.stop()
    setStatus('idle')
    setInterimTranscript('')
    window.setTimeout(() => {
      window.close()
    }, 100)
  }

  function resetTranscript() {
    setFinalTranscript('')
    setInterimTranscript('')
  }

  const transcriptCount = finalTranscript.length + interimTranscript.length
  const canStart = status === 'idle' || status === 'paused' || status === 'error'
  const isRecording = status === 'recording'

  return (
    <div className="min-h-screen bg-gray-100 text-gray-950">
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-gray-50 flex flex-col shadow-2xl">
        <div className="h-12 px-4 bg-white border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 text-sm flex items-center justify-center">🎙</span>
            <span className="text-sm font-medium truncate">会議アシスタント</span>
          </div>
          <button
            onClick={() => window.close()}
            className="w-8 h-8 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
            title="閉じる"
          >
            ×
          </button>
        </div>

        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900">AI音声議事録</h1>
              <p className="mt-0.5 text-xs text-gray-400">
                {isRecording ? '録音中' : status === 'paused' ? '一時停止中' : status === 'error' ? '開始できませんでした' : '待機中'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" title="履歴">
                ⧉
              </button>
              <button className="w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" title="設定">
                ⚙
              </button>
            </div>
          </div>
        </header>

        <div className="px-4 py-2 bg-white border-b border-gray-200 flex items-center gap-2 overflow-hidden">
          <span className="min-w-0 max-w-[142px] px-2.5 py-1 rounded-md bg-gray-100 text-xs text-gray-600 truncate">
            🏢 {selectedCustomer?.name ?? '企業未選択'}
          </span>
          <span className="min-w-0 max-w-[142px] px-2.5 py-1 rounded-md bg-gray-100 text-xs text-gray-600 truncate">
            📁 {selectedProject?.name ?? '案件未選択'}
          </span>
          <strong className="text-sm text-gray-950 truncate">会議タイトル未設定</strong>
        </div>

        <main className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 pb-28">
          {errorMessage && (
            <div className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          <Section title="リアルタイム文字起こし" count={transcriptCount}>
            <div className="min-h-32 px-4 py-4 text-sm leading-7 text-gray-700">
              {finalTranscript || interimTranscript ? (
                <p>
                  {finalTranscript}
                  {interimTranscript && (
                    <span className="text-blue-600 bg-blue-50">{interimTranscript}</span>
                  )}
                </p>
              ) : (
                <p className="text-gray-400">
                  {status === 'unsupported'
                    ? 'Chrome系ブラウザで音声認識を利用できます。'
                    : status === 'recording'
                      ? '話し始めると文字起こしが表示されます...'
                      : '開始ボタンを押して文字起こしを開始してください。'}
                </p>
              )}
            </div>
          </Section>

          <Section
            title="AIアシスタント"
            count={assistantMessages.length}
            action={<button className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700">選択 ▼</button>}
          >
            <div className="min-h-28 px-4 py-4">
              {assistantMessages.map((message) => (
                  <div key={message} className="mb-2 last:mb-0 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm leading-6 text-gray-700">
                  {message}
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="チェック項目"
            count={matchedChecklist.length}
            action={<button className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700">選択 ▼</button>}
          >
            <div className="min-h-28 px-4 py-4 flex flex-col gap-2">
              {checklistMatches.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border px-3 py-2 ${item.match ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${item.match ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      ✓
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                  </div>
                  {item.match ? (
                    <p className="mt-1.5 text-xs leading-5 text-gray-600">{item.match}</p>
                  ) : (
                    <p className="mt-1.5 text-xs text-gray-400">関連する発言を待機中</p>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="タスク提案" count={suggestedTasks.length}>
            <div className="min-h-28 px-4 py-4 flex flex-col gap-2">
              {suggestedTasks.length > 0 ? (
                suggestedTasks.map((task) => (
                  <div key={task.title} className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
                    <p className="text-sm font-semibold text-gray-950">{task.title}</p>
                    <p className="mt-1 text-xs text-gray-600">{task.detail}</p>
                    <p className="mt-1.5 text-xs leading-5 text-orange-800">検知: {task.source}</p>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-gray-400">
                  会議の進行に合わせて自動抽出されます
                </p>
              )}
            </div>
          </Section>
        </main>

        <footer className="fixed left-1/2 bottom-0 z-10 w-full max-w-[430px] -translate-x-1/2 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={startRecording}
              disabled={status === 'unsupported' || !canStart}
              className="h-11 rounded-lg bg-gray-900 text-sm font-bold text-white disabled:bg-gray-200 disabled:text-white flex items-center justify-center gap-1.5"
            >
              開始
            </button>
            <button
              onClick={pauseRecording}
              disabled={!isRecording}
              className="h-11 rounded-lg border border-gray-300 bg-white text-sm font-bold text-gray-700 disabled:text-gray-300"
            >
              一時停止
            </button>
            <button
              onClick={resetTranscript}
              className="h-11 rounded-lg border border-gray-300 bg-white text-sm font-bold text-gray-700"
            >
              クリア
            </button>
            <button
              onClick={finishRecording}
              className="h-11 rounded-lg bg-gray-900 text-sm font-bold text-white"
            >
              終了
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
