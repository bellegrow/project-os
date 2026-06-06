'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getProject, createHearing } from '@/lib/storage'
import { Project } from '@/lib/types'

export default function HearingForm() {
  const params = useParams()
  const projectId = params.id as string
  const router = useRouter()

  const [project, setProject] = useState<Project | null>(null)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [memo, setMemo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setProject(getProject(projectId) ?? null)
  }, [projectId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!memo.trim()) return
    setSubmitting(true)
    createHearing({ projectId, date, memo: memo.trim() })
    router.push(`/projects/${projectId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            案件に戻る
          </button>
          {project ? (
            <>
              <p className="text-xs text-gray-500 mb-0.5">{project.clientName}</p>
              <h1 className="text-base font-bold text-gray-900 leading-tight">{project.name}</h1>
              <p className="text-sm font-medium text-gray-500 mt-1.5">ヒアリングを記録する</p>
            </>
          ) : (
            <h1 className="text-lg font-bold text-gray-900">ヒアリングを記録する</h1>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">日時</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              ヒアリング内容 <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              聞いた内容をそのまま書いてください。箇条書きでも文章でも構いません。
              このメモが提案書骨子の材料になります。
            </p>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder={`例：
・現在のサイトは2015年に構築したWordPress
・スマートフォンから閲覧すると崩れてしまう
・カートの使いにくさに社内から不満が出ている
・競合のABC社サイトのデザインを参考にしたい
・予算は120〜150万円の範囲内
・来月の役員会で社内承認が必要
・リリースは3ヶ月後が理想`}
              rows={14}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none leading-relaxed"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => router.push(`/projects/${projectId}`)}
              className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting || !memo.trim()}
              className="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? '保存中...' : '記録を保存する'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
