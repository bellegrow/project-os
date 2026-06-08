'use client'

import { useState } from 'react'
import { X, Banknote } from 'lucide-react'
import { Invoice } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { recordPayment } from '@/lib/dataSource'

interface Props {
  invoice: Invoice
  onClose: () => void
  onSaved: (invoice: Invoice) => void
}

export default function PaymentModal({ invoice, onClose, onSaved }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const isEdit = !!invoice.paidAt
  const [paidAt, setPaidAt] = useState(invoice.paidAt ?? today)
  const [paidAmountStr, setPaidAmountStr] = useState(String(invoice.paidAmount ?? invoice.total))
  const [paymentNote, setPaymentNote] = useState(invoice.paymentNote ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const parsedAmount = parseInt(paidAmountStr, 10)
  const amountValid = !isNaN(parsedAmount) && parsedAmount > 0
  const diff = amountValid ? parsedAmount - invoice.total : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paidAt || !amountValid) return
    setSaving(true)
    setError('')
    try {
      const saved = await recordPayment(invoice.id, {
        paidAt,
        paidAmount: parsedAmount,
        paymentNote: paymentNote.trim() || undefined,
      })
      if (!saved) throw new Error('保存に失敗しました。時間をおいて再試行してください。')
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-gray-900">{isEdit ? '入金を修正' : '入金を記録'}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* 請求書情報サマリー */}
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-0.5">
            <p className="text-xs font-medium text-gray-900 truncate">{invoice.title}</p>
            <p className="text-xs text-gray-500">
              請求金額：<span className="font-semibold text-gray-800">{formatCurrency(invoice.total)}</span>
            </p>
          </div>

          {/* 入金日 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">入金日</label>
            <input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 入金額 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">入金額（円）</label>
            <input
              type="number"
              value={paidAmountStr}
              onChange={(e) => setPaidAmountStr(e.target.value)}
              required
              min={1}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {diff !== null && diff !== 0 && (
              <p className={`text-xs mt-1 ${diff < 0 ? 'text-red-500' : 'text-amber-500'}`}>
                {diff < 0
                  ? `請求額より ${formatCurrency(Math.abs(diff))} 不足`
                  : `請求額より ${formatCurrency(diff)} 超過`}
              </p>
            )}
          </div>

          {/* メモ */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">メモ（任意）</label>
            <input
              type="text"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="例：〇〇銀行より振込確認"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-sm text-gray-500 hover:text-gray-700 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving || !paidAt || !amountValid}
              className="flex-1 bg-emerald-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {saving ? '保存中...' : isEdit ? '入金を更新する' : '入金を記録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
