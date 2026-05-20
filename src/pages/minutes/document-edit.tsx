import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'

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

  const initialBody = useMemo(
    () =>
      [
        `${documentType}`,
        '',
        `作成日: ${generatedDate}`,
        `関連議事録ID: ${id ?? '-'}`,
        `ドキュメントID: ${documentId ?? '-'}`,
        '',
        '本文',
        '生成されたドキュメント本文をここで編集できます。',
      ].join('\n'),
    [documentId, documentType, generatedDate, id],
  )

  const [body, setBody] = useState(initialBody)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div>
          <p className="text-xs font-bold text-gray-400">ドキュメント編集</p>
          <h1 className="mt-1 text-lg font-bold text-gray-900">
            {documentType} {generatedDate}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            戻る
          </Button>
          <Button type="button" variant="primary">
            保存
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-6 py-6">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="min-h-[70vh] w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 font-sans text-sm leading-7 text-gray-800 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        />
      </main>
    </div>
  )
}
