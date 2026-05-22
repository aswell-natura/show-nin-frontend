import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
<<<<<<< HEAD
import { Check, ChevronLeft, Download, Lock, Printer, Unlock } from 'lucide-react'

import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
=======
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
>>>>>>> ad7912f9c0ebf86067f25abd270dacdfc10f91dd

function todayLabel() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}/${mm}/${dd}`
}

export default function MinuteDocumentEdit() {
  const { id, documentId } = useParams<{ id: string; documentId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const documentType = searchParams.get('type') || '生成ドキュメント'
  const generatedDate = searchParams.get('date') || todayLabel()

  const [documentTitle, setDocumentTitle] = useState(`${documentType} - ${generatedDate}`)
  const [isEditing, setIsEditing] = useState(false)

  return (
    <AppLayout>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 text-slate-950">
        <div className="flex shrink-0 flex-col gap-4 border-b border-slate-200 bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <p className="text-xs font-bold text-slate-400">ドキュメント編集</p>
              <input
                value={documentTitle}
                onChange={event => setDocumentTitle(event.target.value)}
                className="mt-1 w-full min-w-0 rounded-md border border-transparent bg-transparent px-0 text-lg font-bold tracking-tight text-slate-950 outline-none transition focus:border-blue-200 focus:bg-white focus:px-2 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
            <Button
              type="button"
              variant={isEditing ? 'primary' : 'secondary'}
              onClick={() => setIsEditing(current => !current)}
              className="h-10 gap-2"
            >
              {isEditing ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {isEditing ? 'ドキュメント編集' : 'ドキュメントロック'}
            </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="border border-slate-200 bg-white text-slate-950 shadow-lg"
                >
                  <p>ドキュメントのテキストクリックで編集可能</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button type="button" variant="primary" className="h-10 gap-2">
              <Check className="h-4 w-4" />
              保存
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

        <main className="min-h-0 flex-1 overflow-auto px-4 py-6 md:px-8">
          <article
            contentEditable={isEditing}
            suppressContentEditableWarning
            className={`mx-auto min-h-[1120px] w-full max-w-[794px] bg-white text-slate-950 shadow-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-200 ${
              isEditing ? 'cursor-text' : 'cursor-default select-none'
            }`}
          >
            <header className="bg-teal-700 px-8 py-8 text-center">
              <h2 className="text-3xl font-bold tracking-[0.18em] text-white">議 事 録</h2>
            </header>

            <section className="grid grid-cols-[9rem_1fr] border-b border-slate-200">
              <div className="bg-teal-100 px-6 py-5 text-base font-medium">
                商人
                <br />
                その他複数名
              </div>
              <div className="px-7 py-5 text-lg">
                SHOW-NIN開発に関連する打ち合わせ
              </div>
            </section>

            <section className="grid grid-cols-[9rem_1fr] border-b border-slate-200">
              <div className="bg-teal-100 px-6 py-4 text-base font-medium">件名</div>
              <div className="px-7 py-4 text-lg">会議 {generatedDate} 議事録レポート</div>
            </section>

            <section className="border-b border-slate-200 px-7 py-6 text-base leading-8">
              <p>作成日: {generatedDate}</p>
              <p>関連議事録ID: {id ?? '-'}</p>
              <p>ドキュメントID: {documentId ?? '-'}</p>
            </section>

            <section className="border-b border-slate-200 px-7 py-8">
              <h3 className="mb-5 inline-flex rounded bg-teal-700 px-2 py-1 text-lg font-bold text-white">
                ミーティング内容・現状の課題
              </h3>
              <p className="whitespace-pre-wrap text-base leading-8">
                録音・記録内容をもとに、議事録として確認しやすい状態へ整理します。
                参加者の発言、決定事項、課題、次回までのアクションをこの画面で直接編集できます。
              </p>
            </section>

<<<<<<< HEAD
            <section className="border-b border-slate-200 px-7 py-8">
              <h3 className="mb-5 inline-flex rounded bg-teal-700 px-2 py-1 text-lg font-bold text-white">
                次のアクション
              </h3>
              <ul className="list-disc space-y-2 pl-6 text-base leading-8">
                <li>関係者へ内容を共有する</li>
                <li>必要に応じてドキュメント内容を更新する</li>
                <li>次回会議までの対応事項を確認する</li>
              </ul>
            </section>
=======
                <div className="space-y-2">
                  <FieldLabel>商談日時</FieldLabel>
                  <DatePicker
                    value={fields.meetingDate}
                    onChange={(value) => updateField('meetingDate', value)}
                    placeholder="日付を選択"
                    buttonClassName="h-12 rounded-xl border-slate-200 bg-white px-4 text-base shadow-none hover:border-blue-300 hover:bg-white focus-visible:border-blue-300 focus-visible:ring-blue-100"
                  />
                </div>
>>>>>>> ad7912f9c0ebf86067f25abd270dacdfc10f91dd

            <section className="px-7 py-8">
              <h3 className="mb-5 inline-flex rounded bg-teal-700 px-2 py-1 text-lg font-bold text-white">
                備考
              </h3>
              <p className="text-base leading-8">
                このドキュメントは生成後に自由に編集できます。本文、見出し、箇条書きなどを直接クリックして入力してください。
              </p>
            </section>
          </article>
        </main>
      </div>
    </AppLayout>
  )
}
