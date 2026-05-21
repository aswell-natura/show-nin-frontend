import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Check,
  ChevronLeft,
  Download,
  Pencil,
  Printer,
} from 'lucide-react'

import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'

const previewScale = 0.72

function todayLabel() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}/${mm}/${dd}`
}

function FieldLabel({
  children,
  required = false,
}: {
  children: string
  required?: boolean
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  )
}

export default function MinuteDocumentEdit() {
  const { id, documentId } = useParams<{ id: string; documentId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const documentType = searchParams.get('type') || '生成ドキュメント'
  const generatedDate = searchParams.get('date') || todayLabel()

  const initialFields = useMemo(
    () => ({
      customerName: `会議 ${generatedDate} 議事録レポート`,
      projectName: '商人\nその他複数名',
      meetingName: `会議 ${generatedDate} 議事録レポート`,
      meetingDate: '',
      location: 'オンライン',
      topic: 'SHOW-NIN開発に関連する打ち合わせ',
      issue: '録音・記録内容をもとに、議事録として確認しやすい状態へ整理します。',
      nextAction: '関係者へ内容を共有し、必要に応じてドキュメントを更新します。',
    }),
    [generatedDate],
  )

  const [fields, setFields] = useState(initialFields)

  const updateField = (key: keyof typeof fields, value: string) => {
    setFields(current => ({ ...current, [key]: value }))
  }

  return (
    <AppLayout>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 px-6 py-5 text-slate-950">
        <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 transition hover:bg-white hover:shadow-sm"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {documentType} - {generatedDate}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <Button type="button" variant="primary" className="h-10 gap-2">
              <Check className="h-4 w-4" />
              更新
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => window.print()}
              className="h-10 gap-2 bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              PDF出力
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.print()}
              className="h-10 gap-2 bg-slate-600 text-white hover:bg-slate-700"
            >
              <Printer className="h-4 w-4" />
              印刷
            </Button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(25rem,0.95fr)]">
          <section className="min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="h-full overflow-auto bg-slate-100 p-4">
              <div
                className="origin-top-left rounded-sm bg-white shadow-sm"
                style={{
                  width: `${100 / previewScale}%`,
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top left',
                }}
              >
                <article className="min-h-[1120px] w-[794px] border border-slate-200 bg-white text-slate-950">
                  <header className="bg-teal-700 px-10 py-8 text-center">
                    <h3 className="text-3xl font-bold tracking-[0.18em] text-white">
                      議 事 録
                    </h3>
                  </header>

                  <div className="grid grid-cols-[9rem_1fr] border-b border-slate-200">
                    <div className="bg-teal-100 px-7 py-5 text-base font-medium">
                      商人<br />その他複数名
                    </div>
                    <button
                      type="button"
                      onClick={() => updateField('projectName', fields.projectName)}
                      className="px-7 py-5 text-left text-lg transition hover:bg-blue-50"
                    >
                      {fields.projectName}
                    </button>
                  </div>

                  <div className="grid grid-cols-[9rem_1fr] border-b border-slate-200">
                    <div className="bg-teal-100 px-7 py-4 text-base font-medium">件名</div>
                    <button
                      type="button"
                      onClick={() => updateField('topic', fields.topic)}
                      className="px-7 py-4 text-left text-lg transition hover:bg-blue-50"
                    >
                      {fields.topic}
                    </button>
                  </div>

                  <div className="h-24 border-b border-slate-200" />

                  <div className="border-b border-slate-200 px-7 py-5 text-lg">
                    {fields.customerName}
                  </div>

                  <section className="border-b border-slate-200 px-7 py-8">
                    <h4 className="mb-5 inline-flex rounded bg-teal-700 px-2 py-1 text-lg font-bold text-white">
                      ミーティング内容・現状の課題
                    </h4>
                    <p className="whitespace-pre-wrap text-base leading-8">{fields.issue}</p>
                  </section>

                  <section className="border-b border-slate-200 px-7 py-8">
                    <h4 className="mb-5 inline-flex rounded bg-teal-700 px-2 py-1 text-lg font-bold text-white">
                      次のアクション
                    </h4>
                    <p className="whitespace-pre-wrap text-base leading-8">{fields.nextAction}</p>
                  </section>

                  <footer className="px-7 py-8 text-sm leading-7 text-slate-500">
                    関連議事録ID: {id ?? '-'} / ドキュメントID: {documentId ?? '-'}
                  </footer>
                </article>
              </div>
            </div>
          </section>

          <aside className="min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="h-full overflow-y-auto px-6 py-6">
              <div className="mb-5">
                <div className="flex items-center gap-3">
                  <Pencil className="h-5 w-5 text-slate-800" />
                  <h3 className="text-xl font-bold">フィールド編集</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  左のプレビュー上のテキストをクリックしても直接編集できます
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <FieldLabel required>取引先会社名</FieldLabel>
                  <input
                    value={fields.customerName}
                    onChange={event => updateField('customerName', event.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>案件名</FieldLabel>
                  <textarea
                    value={fields.projectName}
                    onChange={event => updateField('projectName', event.target.value)}
                    className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base leading-7 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>会議体の名前</FieldLabel>
                  <input
                    value={fields.meetingName}
                    onChange={event => updateField('meetingName', event.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>商談日時</FieldLabel>
                  <DatePicker
                    value={fields.meetingDate}
                    onChange={(value) => updateField('meetingDate', value)}
                    placeholder="日付を選択"
                    buttonClassName="h-12 rounded-xl border-slate-200 bg-white px-4 text-base shadow-none hover:border-blue-300 hover:bg-white focus-visible:border-blue-300 focus-visible:ring-blue-100"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>商談場所</FieldLabel>
                  <input
                    value={fields.location}
                    onChange={event => updateField('location', event.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>議題</FieldLabel>
                  <textarea
                    value={fields.topic}
                    onChange={event => updateField('topic', event.target.value)}
                    className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base leading-7 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>内容・課題</FieldLabel>
                  <textarea
                    value={fields.issue}
                    onChange={event => updateField('issue', event.target.value)}
                    className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base leading-7 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  )
}
