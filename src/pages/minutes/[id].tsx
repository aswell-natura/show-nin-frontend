import { useMemo, useState, useRef, useEffect, type FormEvent, type ReactNode } from 'react'
import CustomerDialogForm from '@/components/customers/CustomerDialogForm'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { useGlobalDialog } from '@/context/GlobalDialogContext'
import { useNavigate, useParams } from 'react-router-dom'
import { useDataStore } from '../../context/DataStoreContext'
import { mockAudioMinutes } from '../../data/mock'
import { Play, Pause, Volume2, VolumeX, Copy, Check } from 'lucide-react'

const documentTemplates = [
  { title: '商談議事録テンプレート', description: '商談内容から金額や条件を整理して作成' },
  { title: '業務委託契約書テンプレート', description: '請求先と明細をもとに作成' },
  { title: '標準見積書テンプレート', description: '合意事項や契約条件を文書化' },
]

interface GeneratedDocument {
  id: string
  templateTitle: string
  generatedDate: string
}

function buildGeneratedDocumentBody(document: GeneratedDocument, minuteTitle: string, summary: string) {
  return [
    `${document.templateTitle}`,
    '',
    `作成日: ${document.generatedDate}`,
    `関連議事録: ${minuteTitle || '議事録詳細'}`,
    '',
    '概要',
    summary,
    '',
    '備考',
    'このドキュメントは議事録の内容をもとに生成されています。',
  ].join('\n')
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
      nodes.push(<h3 key={i} className="mt-4 mb-1.5 text-sm font-bold text-foreground">{line.slice(4)}</h3>)
    } else if (line.startsWith('## ')) {
      nodes.push(<h2 key={i} className="mt-5 mb-2 border-b border-border/50 pb-1 text-base font-bold text-foreground">{line.slice(3)}</h2>)
    } else if (line.startsWith('# ')) {
      nodes.push(<h1 key={i} className="mt-2 mb-3 text-lg font-bold text-foreground">{line.slice(2)}</h1>)
    } else if (line.startsWith('- ') || line.startsWith('・ ')) {
      nodes.push(
        <div key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/90">
          <span className="mt-0.5 shrink-0 text-muted-foreground/60">・</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>,
      )
    } else if (line.trim() === '') {
      nodes.push(<div key={i} className="h-2" />)
    } else {
      nodes.push(<p key={i} className="text-sm leading-relaxed text-foreground/90">{renderInline(line)}</p>)
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
  className = '',
}: {
  icon: ReactNode
  label: string
  value: string
  warning?: boolean
  className?: string
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
        warning
          ? 'border-destructive/20 bg-destructive/5 text-destructive dark:bg-destructive/10'
          : 'border-border bg-card text-foreground'
      } ${className}`}
    >
      <span className={warning ? 'text-destructive' : 'text-muted-foreground'}>{icon}</span>
      <div className="min-w-0">
        <p className={`text-xs ${warning ? 'text-destructive/80' : 'text-muted-foreground'}`}>{label}</p>
        <p className={`truncate text-sm font-semibold ${warning ? 'text-destructive' : 'text-foreground'}`}>{value}</p>
      </div>
    </div>
  )
}

interface MinuteEditValues {
  title: string
  customer_id: string
  project_id: string | null
  user_id: string
}

function MinuteEditForm({
  formId,
  initialValues,
  onSubmit,
}: {
  formId: string
  initialValues: MinuteEditValues
  onSubmit: (values: MinuteEditValues) => void
}) {
  const { customers, projects, profiles, addCustomer, addProject, addProfile } = useDataStore()
  const { openDialog, closeDialog } = useGlobalDialog()
  const [values, setValues] = useState<MinuteEditValues>(initialValues)

  const updateValue = <K extends keyof MinuteEditValues>(key: K, value: MinuteEditValues[K]) => {
    setValues(current => ({ ...current, [key]: value }))
  }

  const customerOptions = useMemo(
    () =>
      customers
        .map(customer => ({ label: customer.name, value: customer.id }))
        .sort((a, b) => a.label.localeCompare(b.label, 'ja')),
    [customers],
  )

  const projectOptions = useMemo(() => {
    const visibleProjects = values.customer_id
      ? projects.filter(project => project.customer_id === values.customer_id)
      : projects

    return visibleProjects
      .map(project => ({ label: project.name, value: project.id }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ja'))
  }, [projects, values.customer_id])

  const ownerOptions = useMemo(
    () =>
      profiles
        .map(profile => ({ label: profile.name, value: profile.id }))
        .sort((a, b) => a.label.localeCompare(b.label, 'ja')),
    [profiles],
  )

  const handleCreateCustomerQuick = (name: string) => {
    const newCustomer = addCustomer({
      name,
      industry: ['未設定'],
      rank: 'B',
      status: 'lead',
      is_pinned: false,
      created_by: values.user_id || 'user-001',
    })
    updateValue('customer_id', newCustomer.id)
    updateValue('project_id', null)
  }

  const handleCreateCustomerDetail = (name: string) => {
    const nestedFormId = 'add-customer-from-minute-form'
    openDialog({
      mode: 'add',
      eyebrow: '顧客',
      breadcrumbs: ['新規作成'],
      title: '顧客を追加',
      hideHeaderTitle: true,
      size: 'xl',
      content: (
        <CustomerDialogForm
          formId={nestedFormId}
          submitLabel="顧客を追加"
          initialValues={{ name }}
          onSubmit={(customerValues) => {
            const newCustomer = addCustomer({
              ...customerValues,
              created_by: values.user_id || 'user-001',
            })
            updateValue('customer_id', newCustomer.id)
            updateValue('project_id', null)
            closeDialog()
          }}
        />
      ),
      footer: (
        <>
          <Button type="button" variant="secondary" onClick={closeDialog}>
            キャンセル
          </Button>
          <Button type="submit" form={nestedFormId} variant="primary">
            顧客を追加
          </Button>
        </>
      ),
    })
  }

  const handleCreateProjectQuick = (name: string) => {
    const newProject = addProject({
      name,
      customer_id: values.customer_id || null,
      status: 'lead',
      priority: 2,
      amount: 0,
      user_id: values.user_id || 'user-001',
      source: 'manual',
    })
    updateValue('project_id', newProject.id)
  }

  const handleCreateOwnerQuick = (name: string) => {
    const initials = name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

    const newProfile = addProfile({
      name,
      email: `${crypto.randomUUID().slice(0, 8)}@example.com`,
      avatar: initials || name.slice(0, 2),
      role: 'player',
      manager_id: null,
    })
    updateValue('user_id', newProfile.id)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      ...values,
      title: values.title.trim() || '議事録詳細',
      customer_id: values.customer_id || '',
      project_id: values.project_id || null,
      user_id: values.user_id || profiles[0]?.id || 'user-001',
    })
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="minute-title" className="text-xs font-bold text-muted-foreground">
          議事録名
        </label>
        <input
          id="minute-title"
          type="text"
          value={values.title}
          onChange={event => updateValue('title', event.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
          placeholder="議事録名を入力"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground">企業</label>
          <Combobox
            options={customerOptions}
            value={values.customer_id}
            onValueChange={(value) => {
              updateValue('customer_id', value)
              const nextProject = projects.find(project => project.customer_id === value)
              updateValue('project_id', nextProject?.id ?? null)
            }}
            onCreateOptionQuick={handleCreateCustomerQuick}
            onCreateOptionDetail={handleCreateCustomerDetail}
            placeholder="企業名で検索..."
            className="h-11 rounded-xl border border-border bg-background text-foreground text-sm font-medium shadow-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground">案件</label>
          <Combobox
            options={[{ label: '未設定', value: '' }, ...projectOptions]}
            value={values.project_id ?? ''}
            onValueChange={(value) => {
              updateValue('project_id', value || null)
              const selectedProject = projects.find(project => project.id === value)
              if (selectedProject?.customer_id) {
                updateValue('customer_id', selectedProject.customer_id)
              }
            }}
            onCreateOptionQuick={handleCreateProjectQuick}
            placeholder="案件名で検索..."
            className="h-11 rounded-xl border border-border bg-background text-foreground text-sm font-medium shadow-sm"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-bold text-muted-foreground">担当者</label>
          <Combobox
            options={ownerOptions}
            value={values.user_id}
            onValueChange={(value) => updateValue('user_id', value)}
            onCreateOptionQuick={handleCreateOwnerQuick}
            placeholder="担当者名で検索..."
            className="h-11 rounded-xl border border-border bg-background text-foreground text-sm font-medium shadow-sm"
          />
        </div>
      </div>
    </form>
  )
}

function DocumentGenerationForm({
  formId,
  onSubmit,
}: {
  formId: string
  onSubmit: (templateTitle: string) => void
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(documentTemplates[0].title)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(selectedTemplate)
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {documentTemplates.map(template => {
          const selected = selectedTemplate === template.title

          return (
            <button
              key={template.title}
              type="button"
              onClick={() => setSelectedTemplate(template.title)}
              className={`rounded-xl border p-4 text-left transition-all ${
                selected
                  ? 'border-primary bg-primary/5 text-primary shadow-sm ring-2 ring-primary/20'
                  : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                <span className={selected ? 'text-primary' : 'text-muted-foreground'}>
                  <DocumentIcon />
                </span>
                {template.title}
              </span>
              <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">
                {template.description}
              </span>
            </button>
          )
        })}
      </div>
    </form>
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

function CustomAudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlayback = () => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      void audio.play()
      setIsPlaying(true)
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }

  const handleSeek = (value: string) => {
    const audio = audioRef.current
    if (!audio) return
    const nextTime = Number(value)
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  const handleVolumeChange = (value: string) => {
    const audio = audioRef.current
    if (!audio) return
    const nextVolume = Number(value)
    audio.volume = nextVolume
    audio.muted = nextVolume === 0
    setVolume(nextVolume)
    setIsMuted(nextVolume === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    const nextMuted = !isMuted
    audio.muted = nextMuted
    setIsMuted(nextMuted)
  }

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="primary"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full"
          onClick={togglePlayback}
          aria-label={isPlaying ? "一時停止" : "再生"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <div className="min-w-0 flex-1">
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={(event) => handleSeek(event.target.value)}
            className="w-full accent-primary"
            aria-label="再生位置"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:w-36">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={toggleMute}
            aria-label={isMuted ? "ミュート解除" : "ミュート"}
          >
            {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(event) => handleVolumeChange(event.target.value)}
            className="min-w-0 flex-1 accent-primary"
            aria-label="音量"
          />
        </div>
      </div>
    </div>
  )
}

export default function AudioMinuteDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { customers, projects, profiles, activities } = useDataStore()
  const { openDialog, closeDialog } = useGlobalDialog()
  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const [editingTranscript, setEditingTranscript] = useState(false)
  const [transcriptText, setTranscriptText] = useState<string | null>(null)
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([])
  const [minuteEdits, setMinuteEdits] = useState<Partial<MinuteEditValues>>({})
  const [isCopied, setIsCopied] = useState(false)
  const [isTranscriptCopied, setIsTranscriptCopied] = useState(false)

  const rawMinute = mockAudioMinutes.find(m => m.id === id)
  const rawActivity = !rawMinute ? activities.find(a => a.id === id) : null

  const minute = rawMinute || (rawActivity ? {
    id: rawActivity.id,
    title: rawActivity.title,
    customer_id: rawActivity.customer_id || null,
    project_id: rawActivity.project_id || null,
    user_id: rawActivity.user_id,
    recording_date: rawActivity.created_at ? rawActivity.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
    start_time: rawActivity.created_at ? rawActivity.created_at.slice(11, 16) : "10:00",
    end_time: rawActivity.created_at ? new Date(new Date(rawActivity.created_at).getTime() + 60 * 60 * 1000).toISOString().slice(11, 16) : "11:00",
    audio_url: rawActivity.audio_url || null,
    summary: rawActivity.content_json?.summary || "",
    transcript: rawActivity.content_json?.transcript || null,
    checklist: rawActivity.content_json?.checklist || [],
    created_at: rawActivity.created_at || new Date().toISOString(),
  } : null)

  if (!minute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">議事録が見つかりません</p>
      </div>
    )
  }

  const effectiveTitle = minuteEdits.title ?? minute.title
  const effectiveCustomerId =
    minuteEdits.customer_id !== undefined ? minuteEdits.customer_id : minute.customer_id
  const effectiveProjectId =
    minuteEdits.project_id !== undefined ? minuteEdits.project_id : minute.project_id
  const effectiveUserId = minuteEdits.user_id ?? minute.user_id
  const customer = effectiveCustomerId ? customers.find(c => c.id === effectiveCustomerId) : null
  const project = effectiveProjectId ? projects.find(p => p.id === effectiveProjectId) : null
  const owner = profiles.find(p => p.id === effectiveUserId)
  const displayTranscript = transcriptText ?? minute.transcript
  const recordingStartDate = new Date(`${minute.recording_date}T${minute.start_time}:00`)
  const recordingEndDate = new Date(`${minute.recording_date}T${minute.end_time}:00`)
  const recordingDuration = formatDuration(recordingEndDate.getTime() - recordingStartDate.getTime())
  const doneCount = minute.checklist.filter(c => c.checked).length

  const handleGenerateDocument = (templateTitle: string) => {
    const now = new Date()
    setGeneratedDocuments(current => [
      {
        id: `${Date.now()}`,
        templateTitle,
        generatedDate: formatDateLabel(now),
      },
      ...current,
    ])
  }

  const handleOpenDocumentDialog = () => {
    const formId = 'generate-document-form'
    openDialog({
      mode: 'add',
      eyebrow: 'ドキュメント',
      breadcrumbs: ['生成'],
      title: 'ドキュメント生成',
      description: '生成するドキュメントの種類を選択してください。',
      size: 'lg',
      content: (
        <DocumentGenerationForm
          formId={formId}
          onSubmit={(templateTitle) => {
            handleGenerateDocument(templateTitle)
            closeDialog()
          }}
        />
      ),
      footer: (
        <>
          <Button type="button" variant="secondary" onClick={closeDialog}>
            キャンセル
          </Button>
          <Button type="submit" form={formId} variant="primary">
            ドキュメント生成
          </Button>
        </>
      ),
    })
  }

  const handleOpenGeneratedDocument = (document: GeneratedDocument) => {
    const documentBody = buildGeneratedDocumentBody(document, effectiveTitle, minute.summary)

    openDialog({
      mode: 'edit',
      eyebrow: document.templateTitle,
      breadcrumbs: ['プレビュー'],
      title: `${document.templateTitle} ${document.generatedDate}`,
      hideHeaderTitle: true,
      size: 'xl',
      content: (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground">生成ドキュメント</p>
              <h2 className="mt-1 text-xl font-bold text-foreground">
                {document.templateTitle} {document.generatedDate}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => window.print()}>
                印刷
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => window.print()}>
                PDF
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  const editPath = `/minutes/${minute.id}/documents/${document.id}/edit?type=${encodeURIComponent(document.templateTitle)}&date=${encodeURIComponent(document.generatedDate)}`
                  closeDialog()
                  if (window.opener && !window.opener.closed) {
                    try {
                      window.opener.history.pushState(null, '', editPath)
                      window.opener.dispatchEvent(new PopStateEvent('popstate'))
                      window.opener.focus()
                    } catch {
                      window.opener.location.href = `${window.location.origin}${editPath}`
                      window.opener.focus()
                    }
                  } else {
                    navigate(editPath)
                  }
                }}
              >
                編集
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card px-6 py-5 shadow-none">
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-foreground/90">
              {documentBody}
            </pre>
          </div>
        </div>
      ),
      footer: (
        <Button type="button" variant="secondary" onClick={closeDialog}>
          閉じる
        </Button>
      ),
    })
  }

  const handleOpenEditDialog = () => {
    const formId = 'edit-minute-form'
    openDialog({
      mode: 'edit',
      eyebrow: '議事録',
      breadcrumbs: ['編集'],
      title: '議事録を編集',
      hideHeaderTitle: true,
      size: 'lg',
      content: (
        <MinuteEditForm
          formId={formId}
          initialValues={{
            title: effectiveTitle,
            customer_id: effectiveCustomerId ?? '',
            project_id: effectiveProjectId ?? null,
            user_id: effectiveUserId,
          }}
          onSubmit={(values) => {
            setMinuteEdits(values)
            closeDialog()
          }}
        />
      ),
      footer: (
        <>
          <Button type="button" variant="secondary" onClick={closeDialog}>
            キャンセル
          </Button>
          <Button type="submit" form={formId} variant="primary">
            保存
          </Button>
        </>
      ),
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-md px-6 py-4">
        <h1 className="max-w-[70%] truncate text-lg md:text-xl font-bold tracking-tight text-foreground">
          {effectiveTitle || '議事録詳細'}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.close()}
          className="text-muted-foreground hover:bg-secondary hover:text-foreground rounded-lg"
          title="閉じる"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-6 py-6">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground items-center">
          <span>
            <span className="text-xs font-bold text-muted-foreground/75">録音時刻: </span>
            {formatDateTime(recordingStartDate)} ～ {formatTime(recordingEndDate)}
          </span>
          <span>
            <span className="text-xs font-bold text-muted-foreground/75">録音時間: </span>
            {recordingDuration}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleOpenEditDialog}
            className="ml-auto hidden sm:inline-flex"
          >
            編集
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm text-foreground/90 sm:hidden bg-card border border-border rounded-xl p-3">
            <p>
              <span className="font-bold text-muted-foreground">企業：</span>
              <span className={`font-semibold ${!customer ? 'text-destructive' : ''}`}>
                {customer?.name ?? '未紐づけ'}
              </span>
            </p>
            <p>
              <span className="font-bold text-muted-foreground">案件：</span>
              <span className={`font-semibold ${!project ? 'text-destructive' : ''}`}>
                {project?.name ?? '未紐づけ'}
              </span>
            </p>
            <p>
              <span className="font-bold text-muted-foreground">担当：</span>
              <span className="font-semibold">{owner?.name ?? '未担当'}</span>
            </p>
          </div>

          <div className="hidden flex-wrap gap-3 sm:flex">
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

          <div className="flex items-center gap-2 sm:hidden">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={handleOpenEditDialog}
            >
              編集
            </Button>
            <Button
              type="button"
              variant="primary"
              className="flex-1 font-semibold"
              onClick={handleOpenDocumentDialog}
            >
              ドキュメント生成
            </Button>
          </div>

          <div className="ml-auto hidden shrink-0 items-center gap-2 sm:flex">
            <Button
              variant="primary"
              onClick={handleOpenDocumentDialog}
              className="font-semibold"
            >
              ドキュメント生成
            </Button>
          </div>
        </div>

        {minute.audio_url && (
          <CustomAudioPlayer src={minute.audio_url} />
        )}

        {(minute.checklist.length > 0 || generatedDocuments.length > 0) && (
          <div className="rounded-xl border border-border bg-card p-5">
            {generatedDocuments.length > 0 && (
              <div className="mb-5 border-b border-border/50 pb-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">生成ドキュメント</span>
                  <span className="text-xs text-muted-foreground">{generatedDocuments.length}件</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {generatedDocuments.map(document => (
                    <button
                      key={document.id}
                      type="button"
                      onClick={() => handleOpenGeneratedDocument(document)}
                      className="group flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-left transition-all hover:border-primary/50 hover:bg-primary/5 text-foreground"
                    >
                      <span className="text-muted-foreground group-hover:text-primary transition-colors">
                        <DocumentIcon />
                      </span>
                      <div>
                        <p className="max-w-xs truncate text-sm font-medium">
                          {document.templateTitle} {document.generatedDate}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {minute.checklist.length > 0 && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                    </svg>
                    <span className="text-sm font-bold text-foreground">チェックリスト</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{doneCount}/{minute.checklist.length} 完了</span>
                </div>
                <div className="space-y-2">
                  {minute.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-0.5">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all ${
                        item.checked 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'border border-muted-foreground/30 text-transparent hover:border-primary/50'
                      }`}>
                        {item.checked && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className={`text-sm ${item.checked ? 'text-muted-foreground line-through' : 'text-foreground/90'}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="text-primary"><DocumentIcon /></span>
              <span className="text-sm font-bold text-foreground">議事録</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(minute.summary).catch(() => {})
                setIsCopied(true)
                setTimeout(() => setIsCopied(false), 2000)
              }}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent"
            >
              {isCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  コピーしました
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  コピー
                </>
              )}
            </Button>
          </div>
          <div className="space-y-3 px-5 py-4">
            {renderMarkdown(minute.summary)}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
            <button
              onClick={() => setTranscriptOpen(v => !v)}
              className="flex items-center gap-2 text-sm font-bold text-foreground transition-colors hover:text-primary"
            >
              <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
                <path d="M19 10a7 7 0 0 1-14 0M12 19v4M8 23h8" />
              </svg>
              文字起こし
              <svg className={`h-4 w-4 text-muted-foreground transition-transform ${transcriptOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {displayTranscript && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!transcriptOpen) setTranscriptOpen(true)
                    setEditingTranscript(v => !v)
                  }}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent"
                >
                  編集
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(displayTranscript ?? '').catch(() => {})
                    setIsTranscriptCopied(true)
                    setTimeout(() => setIsTranscriptCopied(false), 2000)
                  }}
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent"
                >
                  {isTranscriptCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      コピーしました
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      コピー
                    </>
                  )}
                </Button>
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
                      className="h-48 w-full resize-y rounded-lg border border-border bg-background p-3 font-sans text-sm leading-relaxed text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
                      value={displayTranscript}
                      onChange={e => setTranscriptText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => { setTranscriptText(null); setEditingTranscript(false) }}
                      >
                        リセット
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setEditingTranscript(false)}
                      >
                        保存
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{displayTranscript}</p>
                )
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">文字起こしデータがありません</p>
              )}
            </div>
          )}

          {!transcriptOpen && !displayTranscript && (
            <div className="px-5 py-3">
              <p className="text-xs text-muted-foreground">クリックして展開</p>
            </div>
          )}
        </div>

        <div className="h-8" />
      </div>
    </div>
  )
}
