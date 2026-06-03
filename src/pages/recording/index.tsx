import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Building2,
  Check,
  ClipboardCheck,
  FolderKanban,
  ListTodo,
  Mic,
  Pause,
  RotateCcw,
  Settings2,
  Sparkles,
  Square,
  X,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '../../components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { useDataStore } from '../../context/DataStoreContext'

type RecordingStatus = 'idle' | 'recording' | 'paused' | 'unsupported' | 'error'
type AssistantMode = 'sales-coach' | 'summary' | 'next-actions'
type ChecklistView = 'all' | 'hearing' | 'follow-up'

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
  start: (audioTrack?: MediaStreamTrack) => void
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
  icon,
  action,
  children,
}: {
  title: string
  count: number
  icon: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <div className="flex h-12 items-center justify-between border-b border-border/70 bg-muted/45 px-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-muted-foreground">{icon}</span>
          <h2 className="truncate text-sm font-bold text-foreground">{title}</h2>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[11px] font-bold text-primary">
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
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('sales-coach')
  const [checklistView, setChecklistView] = useState<ChecklistView>('all')
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState('default')
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [microphoneMessage, setMicrophoneMessage] = useState('')
  const [isLoadingMicrophones, setIsLoadingMicrophones] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const shouldRestartRef = useRef(false)
  const selectedMicrophoneStreamRef = useRef<MediaStream | null>(null)

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

  const visibleChecklist = checklistMatches.filter((item) => {
    if (checklistView === 'hearing') return item.id !== 'next'
    if (checklistView === 'follow-up') return item.id === 'next'
    return true
  })

  const matchedChecklist = visibleChecklist.filter((item) => item.match)

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

    if (assistantMode === 'summary') {
      const matchedTopics = checklistMatches.filter((item) => item.match).map((item) => item.label)
      return matchedTopics.length > 0
        ? [`検知した論点: ${matchedTopics.join('、')}。発言を確認して議事録へ整理してください。`]
        : ['会話の論点を検知すると、ここに要約候補を表示します。']
    }

    if (assistantMode === 'next-actions') {
      return suggestedTasks.length > 0
        ? suggestedTasks.map((task) => `候補タスク: ${task.title}`)
        : ['次回アクションにつながる発言を検知すると、候補を表示します。']
    }

    const messages: string[] = []
    if (findKeywordSentence(transcript, ['課題', '困って', '問題'])) {
      messages.push('課題が出ています。影響範囲と確度をもう一段掘ると提案に繋げやすくなります。')
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
  }, [assistantMode, checklistMatches, suggestedTasks, transcript])

  function releaseSelectedMicrophone() {
    selectedMicrophoneStreamRef.current?.getTracks().forEach((track) => track.stop())
    selectedMicrophoneStreamRef.current = null
  }

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
      releaseSelectedMicrophone()
      setErrorMessage(`音声認識エラー: ${event.error}`)
    }

    recognition.onend = () => {
      if (shouldRestartRef.current) {
        try {
          recognition.start(selectedMicrophoneStreamRef.current?.getAudioTracks()[0])
        } catch {
          setStatus('error')
          releaseSelectedMicrophone()
          setErrorMessage('音声認識の再開に失敗しました。少し待ってから再開してください。')
        }
        return
      }
      releaseSelectedMicrophone()
      setStatus((current) => (current === 'recording' ? 'paused' : current))
    }

    recognitionRef.current = recognition

    return () => {
      shouldRestartRef.current = false
      recognition.abort()
      releaseSelectedMicrophone()
      recognitionRef.current = null
    }
  }, [])

  async function loadMicrophones() {
    if (!navigator.mediaDevices?.getUserMedia || !navigator.mediaDevices.enumerateDevices) {
      setMicrophoneMessage('このブラウザではマイクの選択を利用できません。')
      return
    }

    setIsLoadingMicrophones(true)
    setMicrophoneMessage('')
    let permissionStream: MediaStream | null = null
    try {
      permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const devices = (await navigator.mediaDevices.enumerateDevices())
        .filter((device) => device.kind === 'audioinput' && device.deviceId !== 'default')
      setAudioDevices(devices)
      if (devices.length === 0) {
        setMicrophoneMessage('利用可能なマイクが見つかりませんでした。')
      }
      if (selectedMicrophoneId !== 'default' && !devices.some((device) => device.deviceId === selectedMicrophoneId)) {
        setSelectedMicrophoneId('default')
      }
    } catch {
      setMicrophoneMessage('マイクの利用が許可されていません。ブラウザの権限設定を確認してください。')
    } finally {
      permissionStream?.getTracks().forEach((track) => track.stop())
      setIsLoadingMicrophones(false)
    }
  }

  async function startRecording() {
    const recognition = recognitionRef.current
    if (!recognition) return
    shouldRestartRef.current = true
    setErrorMessage('')
    try {
      if (selectedMicrophoneId !== 'default' && navigator.mediaDevices?.getUserMedia) {
        releaseSelectedMicrophone()
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: selectedMicrophoneId } },
        })
        selectedMicrophoneStreamRef.current = stream
        recognition.start(stream.getAudioTracks()[0])
      } else {
        recognition.start()
      }
    } catch {
      setStatus('error')
      shouldRestartRef.current = false
      releaseSelectedMicrophone()
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
    releaseSelectedMicrophone()
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
  const statusPresentation = {
    idle: { label: '待機中', className: 'border-border bg-secondary text-muted-foreground' },
    recording: { label: '録音中', className: 'border-destructive/20 bg-destructive/10 text-destructive' },
    paused: { label: '一時停止中', className: 'border-primary/20 bg-primary/10 text-primary' },
    unsupported: { label: '非対応', className: 'border-destructive/20 bg-destructive/10 text-destructive' },
    error: { label: 'エラー', className: 'border-destructive/20 bg-destructive/10 text-destructive' },
  }[status]

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-background shadow-lg">
        <header className="sticky top-0 z-10 border-b border-border/70 bg-background/95 px-4 pb-3 pt-3 backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Mic className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold tracking-tight">AI音声議事録</h1>
                <p className="truncate text-[11px] font-medium text-muted-foreground">会議タイトル未設定</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span aria-live="polite" className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-bold ${statusPresentation.className}`}>
                {isRecording && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />}
                {statusPresentation.label}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="録音設定">
                    <Settings2 />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" sideOffset={8} className="w-[min(350px,calc(100vw-24px))] gap-4 p-4">
                  <PopoverHeader>
                    <PopoverTitle className="text-sm font-bold">録音設定</PopoverTitle>
                    <PopoverDescription className="text-xs">文字起こし方式と入力マイクを設定します。</PopoverDescription>
                  </PopoverHeader>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-muted-foreground">文字認識サービス</label>
                    <Select value="web-speech">
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="web-speech">Web Speech API</SelectItem>
                        <SelectItem value="cloud-stt" disabled>外部 STT API (未接続)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] leading-4 text-muted-foreground">
                      Google Cloud や Azure などの外部サービスは API 接続後に選択できます。
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-border/70 pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] font-bold text-muted-foreground">入力マイク</label>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLoadingMicrophones || isRecording}
                        onClick={loadMicrophones}
                        className="h-7 px-2 text-[11px]"
                      >
                        {isLoadingMicrophones ? '取得中...' : 'マイクを検出'}
                      </Button>
                    </div>
                    <Select
                      value={selectedMicrophoneId}
                      onValueChange={setSelectedMicrophoneId}
                      disabled={isRecording}
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="default">ブラウザの既定マイク</SelectItem>
                        {audioDevices.map((device, index) => (
                          <SelectItem key={device.deviceId} value={device.deviceId}>
                            {device.label || `マイク ${index + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {microphoneMessage && (
                      <p className="text-[11px] leading-4 text-destructive">{microphoneMessage}</p>
                    )}
                    <p className="text-[11px] leading-4 text-muted-foreground">
                      指定マイク入力は `SpeechRecognition.start(audioTrack)` 対応ブラウザで利用できます。録音中は変更できません。
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="icon" onClick={() => window.close()} aria-label="閉じる">
                <X />
              </Button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border/70 bg-muted/45 px-2.5 py-2">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-xs font-medium">{selectedCustomer?.name ?? '企業未選択'}</span>
            </div>
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border/70 bg-muted/45 px-2.5 py-2">
              <FolderKanban className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-xs font-medium">{selectedProject?.name ?? '案件未選択'}</span>
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-3 overflow-y-auto p-3 pb-24">
          {errorMessage && (
            <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium leading-5 text-destructive">
              {errorMessage}
            </div>
          )}

          <Section title="リアルタイム文字起こし" count={transcriptCount} icon={<Mic className="h-4 w-4" />}>
            <div aria-live="polite" className="min-h-44 px-4 py-4 text-[15px] font-medium leading-7 text-foreground">
              {finalTranscript || interimTranscript ? (
                <p>
                  {finalTranscript}
                  {interimTranscript && (
                    <span className="rounded bg-primary/10 px-0.5 text-primary">{interimTranscript}</span>
                  )}
                </p>
              ) : (
                <div className="flex min-h-36 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                  <Mic className="h-5 w-5 opacity-60" />
                  <p className="max-w-[270px] text-sm font-medium leading-6">
                    {status === 'unsupported'
                      ? 'Chrome系ブラウザで音声認識を利用できます。'
                      : status === 'recording'
                        ? '話し始めると文字起こしが表示されます...'
                        : '開始ボタンを押して文字起こしを開始してください。'}
                  </p>
                </div>
              )}
            </div>
          </Section>

          <Section
            title="AIアシスタント"
            count={assistantMessages.length}
            icon={<Sparkles className="h-4 w-4" />}
            action={
              <Select value={assistantMode} onValueChange={(value) => setAssistantMode(value as AssistantMode)}>
                <SelectTrigger size="sm" aria-label="AIアシスタントの表示モード" className="max-w-[125px] bg-background text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="sales-coach">営業コーチ</SelectItem>
                  <SelectItem value="summary">論点要約</SelectItem>
                  <SelectItem value="next-actions">次アクション</SelectItem>
                </SelectContent>
              </Select>
            }
          >
            <div className="space-y-2 p-3">
              {assistantMessages.map((message) => (
                <div key={message} className="rounded-lg border border-border/70 bg-muted/35 px-3 py-2.5 text-sm font-medium leading-6 text-foreground">
                  {message}
                </div>
              ))}
              {assistantMessages.length === 0 && (
                <p className="px-1 py-3 text-center text-xs font-medium text-muted-foreground">発言を検知すると助言を表示します</p>
              )}
            </div>
          </Section>

          <Section
            title="チェック項目"
            count={matchedChecklist.length}
            icon={<ClipboardCheck className="h-4 w-4" />}
            action={
              <Select value={checklistView} onValueChange={(value) => setChecklistView(value as ChecklistView)}>
                <SelectTrigger size="sm" aria-label="チェック項目の表示範囲" className="max-w-[125px] bg-background text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="hearing">ヒアリング</SelectItem>
                  <SelectItem value="follow-up">次回対応</SelectItem>
                </SelectContent>
              </Select>
            }
          >
            <div className="flex flex-col divide-y divide-border/60 px-3 py-1">
              {visibleChecklist.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-2.5 py-2.5"
                >
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${item.match ? 'bg-primary text-primary-foreground' : 'border border-border bg-muted'}`}>
                    {item.match && <Check className="h-3 w-3" />}
                  </span>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-foreground">
                      {item.label}
                    </span>
                    <p className={`mt-0.5 truncate text-xs ${item.match ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                      {item.match || '関連する発言を待機中'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="タスク提案" count={suggestedTasks.length} icon={<ListTodo className="h-4 w-4" />}>
            <div className="flex min-h-24 flex-col gap-2 p-3">
              {suggestedTasks.length > 0 ? (
                suggestedTasks.map((task) => (
                  <div key={task.title} className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2.5">
                    <p className="text-sm font-semibold text-foreground">{task.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{task.detail}</p>
                    <p className="mt-1.5 text-xs font-medium leading-5 text-primary">検知: {task.source}</p>
                  </div>
                ))
              ) : (
                <p className="m-auto text-center text-xs font-medium text-muted-foreground">
                  会議の進行に合わせて自動抽出されます
                </p>
              )}
            </div>
          </Section>
        </main>

        <footer className="fixed bottom-0 left-1/2 z-10 w-full max-w-[430px] -translate-x-1/2 border-t border-border/70 bg-background/95 px-3 py-3 backdrop-blur-md">
          <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr] gap-2">
            <Button
              onClick={startRecording}
              disabled={status === 'unsupported' || !canStart}
              className="h-11 rounded-lg font-bold"
            >
              <Mic />
              開始
            </Button>
            <Button
              variant="secondary"
              onClick={pauseRecording}
              disabled={!isRecording}
              className="h-11 rounded-lg px-2 font-bold"
            >
              <Pause />
              一時停止
            </Button>
            <Button
              variant="destructive"
              onClick={resetTranscript}
              className="h-11 rounded-lg px-2 font-bold"
            >
              <RotateCcw />
              クリア
            </Button>
            <Button
              variant="secondary"
              onClick={finishRecording}
              className="h-11 rounded-lg px-2 font-bold"
            >
              <Square />
              終了
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}
