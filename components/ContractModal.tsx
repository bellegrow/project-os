'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Contract, ContractStatus, ContractInput, Estimate, Invoice } from '@/lib/types'
import { createContract, updateContract } from '@/lib/dataSource'
import { formatCurrency, formatEstimateNumber, formatInvoiceNumber } from '@/lib/utils'

interface Props {
  projectId: string
  customerId?: string
  contract?: Contract
  estimates: Estimate[]
  invoices: Invoice[]
  onClose: () => void
  onSaved: (contract: Contract) => void
}

const STATUS_OPTIONS: { value: ContractStatus; label: string }[] = [
  { value: 'draft',     label: '下書き' },
  { value: 'sent',      label: '送付済み' },
  { value: 'signed',    label: '締結済み' },
  { value: 'completed', label: '完了' },
  { value: 'canceled',  label: 'キャンセル' },
]

function parseAmount(v: string): number | undefined {
  const n = parseInt(v.replace(/[^0-9]/g, ''), 10)
  return isNaN(n) ? undefined : n
}

export default function ContractModal({
  projectId, customerId, contract, estimates, invoices, onClose, onSaved,
}: Props) {
  const isEdit = !!contract

  const [title, setTitle] = useState(contract?.title ?? '')
  const [status, setStatus] = useState<ContractStatus>(contract?.status ?? 'draft')
  const [contractDate, setContractDate] = useState(contract?.contractDate ?? '')
  const [startDate, setStartDate] = useState(contract?.startDate ?? '')
  const [endDate, setEndDate] = useState(contract?.endDate ?? '')
  const [amountStr, setAmountStr] = useState(
    contract?.amount != null ? String(contract.amount) : ''
  )
  const [estimateId, setEstimateId] = useState(contract?.estimateId ?? '')
  const [invoiceId, setInvoiceId] = useState(contract?.invoiceId ?? '')
  const [note, setNote] = useState(contract?.note ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [saveError, setSaveError] = useState('')

  const canSubmit = !submitting && title.trim() !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setSaveError('')

    const input: ContractInput = {
      projectId,
      customerId,
      estimateId: estimateId || undefined,
      invoiceId: invoiceId || undefined,
      title: title.trim(),
      status,
      contractDate: contractDate || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      amount: parseAmount(amountStr),
      note: note.trim() || undefined,
    }

    try {
      const saved = isEdit
        ? await updateContract(contract!.id, input)
        : await createContract(input)

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
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-sm font-semibold text-gray-900">
            {isEdit ? '契約情報を編集' : '契約情報を作成'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {/* タイトル + ステータス */}
            <div className="grid grid-cols-[1fr_140px] gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  契約タイトル <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例：Webサイトリニューアル 業務委託契約"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">ステータス</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ContractStatus)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 日付 */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">契約日</label>
                <input
                  type="date"
                  value={contractDate}
                  onChange={(e) => setContractDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">開始日</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">終了日</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 契約金額 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                契約金額（税込・任意）
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                  ¥
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {amountStr !== '' && !isNaN(parseInt(amountStr)) && (
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {formatCurrency(parseInt(amountStr))}
                </p>
              )}
            </div>

            {/* 関連見積書 */}
            {estimates.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  関連見積書（任意）
                </label>
                <select
                  value={estimateId}
                  onChange={(e) => setEstimateId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択しない</option>
                  {estimates.map((est) => (
                    <option key={est.id} value={est.id}>
                      {formatEstimateNumber(est.id, est.createdAt)}　{est.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 関連請求書 */}
            {invoices.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  関連請求書（任意）
                </label>
                <select
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択しない</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {formatInvoiceNumber(inv.id, inv.createdAt)}　{inv.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 備考 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">備考</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="契約条件、特記事項など"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* フッター */}
          <div className="px-5 py-4 border-t border-gray-100 shrink-0 space-y-3">
            {saveError && (
              <p className="text-xs text-red-500 text-center px-1">{saveError}</p>
            )}
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
