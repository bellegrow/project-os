'use client'

import { useState } from 'react'
import { X, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Estimate, EstimateStatus, EstimateInput } from '@/lib/types'
import { createEstimate, updateEstimate } from '@/lib/dataSource'
import { formatCurrency } from '@/lib/utils'

interface ItemDraft {
  key: string
  name: string
  description: string
  quantity: string
  unitPrice: string
}

interface Props {
  projectId: string
  customerId?: string
  estimate?: Estimate
  taxRate?: number
  onClose: () => void
  onSaved: (estimate: Estimate) => void
}

const STATUS_OPTIONS: { value: EstimateStatus; label: string }[] = [
  { value: 'draft',    label: '下書き' },
  { value: 'sent',     label: '送付済み' },
  { value: 'approved', label: '承認済み' },
  { value: 'rejected', label: '却下' },
]

function toItemDraft(item: Estimate['items'][number]): ItemDraft {
  return {
    key: item.id,
    name: item.name,
    description: item.description ?? '',
    quantity: String(item.quantity),
    unitPrice: String(item.unitPrice),
  }
}

function newEmptyItem(): ItemDraft {
  return { key: crypto.randomUUID(), name: '', description: '', quantity: '1', unitPrice: '' }
}

function parseQty(v: string): number {
  const n = parseFloat(v)
  return isNaN(n) || n <= 0 ? 0 : n
}

function parsePrice(v: string): number {
  const n = parseInt(v.replace(/[^0-9]/g, ''), 10)
  return isNaN(n) ? 0 : n
}

export default function EstimateModal({ projectId, customerId, estimate, taxRate, onClose, onSaved }: Props) {
  const isEdit = !!estimate
  // 編集時は保存済みの税額から実効税率を逆算して既存金額を保護する
  const effectiveRate = isEdit && (estimate?.subtotal ?? 0) > 0
    ? Math.round((estimate!.tax / estimate!.subtotal) * 100)
    : (taxRate ?? 10)
  const [title, setTitle] = useState(estimate?.title ?? '')
  const [status, setStatus] = useState<EstimateStatus>(estimate?.status ?? 'draft')
  const [note, setNote] = useState(estimate?.note ?? '')
  const [items, setItems] = useState<ItemDraft[]>(
    estimate && estimate.items.length > 0
      ? estimate.items.map(toItemDraft)
      : [newEmptyItem()]
  )
  const [submitting, setSubmitting] = useState(false)
  const [saveError, setSaveError] = useState('')

  // ─ 計算 ────────────────────────────────────────
  const subtotal = items.reduce((sum, item) => {
    return sum + Math.round(parseQty(item.quantity) * parsePrice(item.unitPrice))
  }, 0)
  const tax = Math.round(subtotal * effectiveRate / 100)
  const total = subtotal + tax

  // ─ 明細操作 ────────────────────────────────────
  const addItem = () => setItems((prev) => [...prev, newEmptyItem()])

  const removeItem = (key: string) =>
    setItems((prev) => prev.length > 1 ? prev.filter((i) => i.key !== key) : prev)

  const updateItem = (key: string, field: keyof Omit<ItemDraft, 'key'>, value: string) =>
    setItems((prev) => prev.map((i) => i.key === key ? { ...i, [field]: value } : i))

  const moveUp = (idx: number) => {
    if (idx === 0) return
    setItems((prev) => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }

  const moveDown = (idx: number) => {
    setItems((prev) => {
      if (idx === prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
  }

  // ─ バリデーション ───────────────────────────────
  const hasValidItem = items.some((i) => i.name.trim() !== '')
  const canSubmit = !submitting && title.trim() !== '' && hasValidItem

  // ─ 送信 ────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setSaveError('')

    const input: EstimateInput = {
      projectId,
      customerId,
      title: title.trim(),
      status,
      note: note.trim() || undefined,
      taxRate: effectiveRate,
      items: items
        .filter((i) => i.name.trim())
        .map((i, idx) => ({
          name: i.name.trim(),
          description: i.description.trim() || undefined,
          quantity: parseQty(i.quantity) || 1,
          unitPrice: parsePrice(i.unitPrice),
          sortOrder: idx + 1,
        })),
    }

    try {
      const saved = isEdit
        ? await updateEstimate(estimate!.id, input)
        : await createEstimate(input)

      setSubmitting(false)
      if (saved) {
        onSaved(saved)
      } else {
        setSaveError('保存に失敗しました。時間をおいて再度お試しください。')
      }
    } catch (err) {
      setSubmitting(false)
      setSaveError(err instanceof Error ? err.message : '保存に失敗しました。')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-sm font-semibold text-gray-900">
            {isEdit ? '見積書を編集' : '見積書を作成'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* コンテンツ（スクロール可能） */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            {/* タイトル + ステータス */}
            <div className="grid grid-cols-[1fr_140px] gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  見積タイトル <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例：Webサイトリニューアル 御見積"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">ステータス</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EstimateStatus)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 明細 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700">
                  明細 <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  行を追加
                </button>
              </div>

              {/* ヘッダー行 */}
              <div className="hidden sm:grid grid-cols-[1fr_60px_100px_90px_44px] gap-2 px-1 mb-1">
                <span className="text-xs text-gray-400">項目名・説明</span>
                <span className="text-xs text-gray-400 text-center">数量</span>
                <span className="text-xs text-gray-400 text-right">単価（円）</span>
                <span className="text-xs text-gray-400 text-right">金額</span>
                <span />
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => {
                  const amount = Math.round(parseQty(item.quantity) * parsePrice(item.unitPrice))
                  return (
                    <div key={item.key} className="bg-gray-50 rounded-xl p-3 space-y-2">
                      {/* 1行目: 番号 + 項目名 + 操作 */}
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-gray-400 mt-2 shrink-0 w-4 text-center select-none">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.key, 'name', e.target.value)}
                          placeholder="項目名 *"
                          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveUp(idx)}
                            disabled={idx === 0}
                            className="p-1 rounded text-gray-300 hover:text-gray-500 disabled:opacity-30 transition-colors"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveDown(idx)}
                            disabled={idx === items.length - 1}
                            className="p-1 rounded text-gray-300 hover:text-gray-500 disabled:opacity-30 transition-colors"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            disabled={items.length === 1}
                            className="p-1 rounded text-gray-300 hover:text-red-400 disabled:opacity-30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 2行目: 説明 */}
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.key, 'description', e.target.value)}
                        placeholder="説明（任意）"
                        className="w-full border border-gray-100 rounded-lg px-2.5 py-1 text-xs text-gray-500 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 ml-6"
                      />

                      {/* 3行目: 数量 × 単価 = 金額 */}
                      <div className="flex items-center gap-2 ml-6 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.key, 'quantity', e.target.value)}
                            min="0.01"
                            step="0.01"
                            placeholder="数量"
                            className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-right bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-400">×</span>
                          <input
                            type="text"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.key, 'unitPrice', e.target.value)}
                            placeholder="単価"
                            className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-sm text-right bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <span className="text-xs text-gray-400">=</span>
                        <span className="text-sm font-medium text-gray-800">
                          {amount > 0 ? formatCurrency(amount) : '¥0'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 備考 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">備考</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="支払い条件、有効期限、その他の備考など"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* フッター：合計 + ボタン（固定） */}
          <div className="px-5 py-4 border-t border-gray-100 shrink-0 space-y-3">
            {/* 合計 */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>小計</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>消費税（{effectiveRate}%）</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                <span className="text-sm font-semibold text-gray-900">合計（税込）</span>
                <span className="text-base font-bold text-gray-900">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* エラー表示 */}
            {saveError && (
              <p className="text-xs text-red-500 text-center px-1">{saveError}</p>
            )}

            {/* ボタン */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? '保存中...' : isEdit ? '更新する' : '作成する'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
