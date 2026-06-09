'use client'

import { useState } from 'react'
import { X, FilePlus, ChevronRight } from 'lucide-react'
import { Estimate, Invoice, InvoiceInput } from '@/lib/types'
import { createInvoice, createActivity } from '@/lib/dataSource'
import { formatCurrency, formatEstimateNumber, formatInvoiceNumber } from '@/lib/utils'
import EstimateStatusBadge from './EstimateStatusBadge'

type PctOption = '100' | '50-deposit' | '50-final' | 'custom'

interface Props {
  estimate: Estimate
  projectId: string
  customerId?: string
  taxRate?: number
  invoiceDueDays?: number
  onClose: () => void
  onSaved: (invoice: Invoice) => void
  onActivityCreated: () => void
}

const PCT_OPTIONS: { key: PctOption; label: string; sublabel: string; pct: number | null }[] = [
  { key: '100',         label: '全額請求',    sublabel: '100%',    pct: 100  },
  { key: '50-deposit',  label: '着手金50%',   sublabel: '先払い',  pct: 50   },
  { key: '50-final',    label: '残金50%',     sublabel: '後払い',  pct: 50   },
  { key: 'custom',      label: 'カスタム割合', sublabel: '任意%',  pct: null },
]

function getTitleSuffix(key: PctOption, customPct: number): string {
  if (key === '50-deposit') return '（着手金）'
  if (key === '50-final')   return '（残金）'
  if (key === 'custom')     return `（${customPct}%）`
  return ''
}

function getMultiplier(key: PctOption, customPct: number): number {
  if (key === '100') return 1
  if (key === '50-deposit' || key === '50-final') return 0.5
  return customPct / 100
}

export default function EstimateToInvoiceModal({
  estimate, projectId, customerId, taxRate, invoiceDueDays,
  onClose, onSaved, onActivityCreated,
}: Props) {
  const [selectedPct, setSelectedPct] = useState<PctOption>('100')
  const [customPct, setCustomPct]     = useState(50)
  const [customTitle, setCustomTitle] = useState(`${estimate.title} 請求書`)
  const [submitting, setSubmitting]   = useState(false)
  const [saveError, setSaveError]     = useState('')

  const effectiveTaxRate = taxRate ?? 10
  const multiplier       = getMultiplier(selectedPct, customPct)
  const adjustedSubtotal = Math.round(estimate.subtotal * multiplier)
  const adjustedTax      = Math.round(adjustedSubtotal * effectiveTaxRate / 100)
  const adjustedTotal    = adjustedSubtotal + adjustedTax

  const estimateNum = formatEstimateNumber(estimate.id, estimate.createdAt)

  const handlePctChange = (key: PctOption) => {
    setSelectedPct(key)
    const suffix = getTitleSuffix(key, customPct)
    setCustomTitle(`${estimate.title} 請求書${suffix}`)
  }

  const handleCustomPctChange = (v: number) => {
    const clamped = Math.max(1, Math.min(100, v))
    setCustomPct(clamped)
    setCustomTitle(`${estimate.title} 請求書（${clamped}%）`)
  }

  const handleCreate = async () => {
    if (submitting) return
    setSubmitting(true)
    setSaveError('')

    const m = getMultiplier(selectedPct, customPct)
    const dueDate = (() => {
      const d = new Date()
      d.setDate(d.getDate() + (invoiceDueDays ?? 30))
      return d.toISOString().split('T')[0]
    })()

    const input: InvoiceInput = {
      projectId,
      customerId,
      estimateId: estimate.id,
      title: customTitle.trim() || `${estimate.title} 請求書`,
      status: 'draft',
      dueDate,
      taxRate: effectiveTaxRate,
      note: estimate.note,
      items: estimate.items.map((item, idx) => ({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: Math.round(item.unitPrice * m),
        sortOrder: idx + 1,
      })),
    }

    try {
      const saved = await createInvoice(input)
      if (!saved) {
        setSaveError('作成に失敗しました。時間をおいて再度お試しください。')
        setSubmitting(false)
        return
      }

      const invoiceNum = formatInvoiceNumber(saved.id, saved.createdAt)
      await createActivity({
        projectId,
        customerId,
        type: 'invoice_created',
        title: `請求書作成：${saved.title}`,
        body: `見積書 ${estimateNum} から 請求書 ${invoiceNum} を作成しました（${Math.round(m * 100)}%・合計 ${saved.total.toLocaleString()}円）`,
      }).catch(() => {})

      onSaved(saved)
      onActivityCreated()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '作成に失敗しました。')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
              <FilePlus className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">この見積書から請求書を作成しますか？</p>
              <p className="text-xs text-gray-500 mt-0.5">明細・金額・顧客情報を引き継いで、請求書を作成します。</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {/* Estimate summary */}
          <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
            <div className="flex items-center gap-2 mb-1.5">
              <EstimateStatusBadge status={estimate.status} />
              <span className="text-xs text-gray-400 font-mono">{estimateNum}</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">{estimate.title}</p>
            <p className="text-base font-bold text-gray-900">{formatCurrency(estimate.total)}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              小計 {formatCurrency(estimate.subtotal)} + 消費税 {formatCurrency(estimate.tax)}（{effectiveTaxRate}%）
            </p>
          </div>

          {/* Percentage selector */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">請求割合</p>
            <div className="grid grid-cols-4 gap-2">
              {PCT_OPTIONS.map((opt) => {
                const active = selectedPct === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => handlePctChange(opt.key)}
                    className={`flex flex-col items-center gap-0.5 py-3 px-2 rounded-xl border-2 transition-all ${
                      active
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-xs font-bold ${active ? 'text-emerald-700' : 'text-gray-700'}`}>
                      {opt.label}
                    </span>
                    <span className={`text-[10px] ${active ? 'text-emerald-500' : 'text-gray-400'}`}>
                      {opt.sublabel}
                    </span>
                  </button>
                )
              })}
            </div>

            {selectedPct === 'custom' && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={customPct}
                  onChange={(e) => handleCustomPctChange(Number(e.target.value))}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            )}
          </div>

          {/* Amount preview */}
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <p className="text-xs text-emerald-600 font-medium mb-1">請求金額（税込）</p>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(adjustedTotal)}</p>
            <p className="text-xs text-emerald-500 mt-0.5">
              小計 {formatCurrency(adjustedSubtotal)} + 消費税 {formatCurrency(adjustedTax)}
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
              請求書タイトル
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {saveError && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{saveError}</p>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleCreate}
            disabled={submitting || customTitle.trim() === ''}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '作成中...' : '請求書を作成'}
            {!submitting && <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>
    </div>
  )
}
