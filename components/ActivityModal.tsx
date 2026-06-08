'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Activity, ActivityInput } from '@/lib/types'
import { createActivity } from '@/lib/dataSource'

interface Props {
  projectId?: string
  customerId?: string
  onClose: () => void
  onSaved: (activity: Activity) => void
}

export default function ActivityModal({ projectId, customerId, onClose, onSaved }: Props) {
  const [type, setType] = useState<'note' | 'meeting'>('note')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('タイトルを入力してください')
      return
    }
    setSaving(true)
    setError('')
    try {
      const input: ActivityInput = {
        projectId,
        customerId,
        type,
        title: title.trim(),
        body: body.trim() || undefined,
        occurredAt: new Date(occurredAt).toISOString(),
      }
      const saved = await createActivity(input)
      if (!saved) throw new Error('保存に失敗しました')
      onSaved(saved)
    } catch {
      setError('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">活動を記録</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">種別</label>
            <div className="flex gap-3">
              {(['note', 'meeting'] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={t}
                    checked={type === t}
                    onChange={() => setType(t)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm">{t === 'note' ? 'メモ' : 'ミーティング'}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
            <input
              type="date"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：初回打ち合わせ"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ（任意）</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="詳細・議事録・メモなど"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
