'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { ProjectCost, ProjectCostInput, ProjectCostUpdateInput, CostCategory } from '@/lib/types'
import { createProjectCost, updateProjectCost } from '@/lib/dataSource'
import { getTodayStr } from '@/lib/utils'

interface Props {
  cost?: ProjectCost
  projectId: string
  customerId?: string
  onClose: () => void
  onSaved: (cost: ProjectCost) => void
}

const CATEGORY_LABELS: Record<CostCategory, string> = {
  outsourcing: '外注費',
  material: '材料費',
  tool: 'ツール費',
  ad: '広告費',
  other: 'その他',
}

export default function ProjectCostModal({ cost, projectId, customerId, onClose, onSaved }: Props) {
  const isEdit = !!cost
  const [title, setTitle] = useState(cost?.title ?? '')
  const [category, setCategory] = useState<CostCategory>(cost?.category ?? 'other')
  const [amount, setAmount] = useState(cost ? String(cost.amount) : '')
  const [costDate, setCostDate] = useState(cost?.costDate ?? getTodayStr())
  const [note, setNote] = useState(cost?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amountNum = parseInt(amount.replace(/,/g, ''), 10)
    if (!title.trim()) { setError('原価名を入力してください'); return }
    if (isNaN(amountNum) || amountNum < 0) { setError('金額を正しく入力してください'); return }
    setSaving(true)
    setError('')
    try {
      let saved: ProjectCost | undefined
      if (isEdit) {
        const input: ProjectCostUpdateInput = {
          title: title.trim(),
          category,
          amount: amountNum,
          note: note.trim() || null,
          costDate,
        }
        saved = await updateProjectCost(cost.id, input)
      } else {
        const input: ProjectCostInput = {
          projectId,
          customerId,
          title: title.trim(),
          category,
          amount: amountNum,
          note: note.trim() || undefined,
          costDate,
        }
        saved = await createProjectCost(input)
      }
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
          <h2 className="text-lg font-semibold">{isEdit ? '原価を編集' : '原価を追加'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">原価名</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：デザイン外注費"
              autoFocus
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CostCategory)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {(Object.keys(CATEGORY_LABELS) as CostCategory[]).map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">金額（円）</label>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">発生日</label>
            <input
              type="date"
              value={costDate}
              onChange={(e) => setCostDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ（任意）</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="詳細・備考など"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : isEdit ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
