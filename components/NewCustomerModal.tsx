'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Customer } from '@/lib/types'
import { createCustomer, updateCustomer } from '@/lib/dataSource'

interface Props {
  customer?: Customer
  onClose: () => void
  onSaved: (customer: Customer) => void
}

export default function NewCustomerModal({ customer, onClose, onSaved }: Props) {
  const [name, setName] = useState(customer?.name ?? '')
  const [industry, setIndustry] = useState(customer?.industry ?? '')
  const [website, setWebsite] = useState(customer?.website ?? '')
  const [notes, setNotes] = useState(customer?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)

  const isEdit = !!customer

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)

    const input = {
      name: name.trim(),
      industry: industry.trim() || undefined,
      website: website.trim() || undefined,
      notes: notes.trim() || undefined,
    }

    const result = isEdit
      ? await updateCustomer(customer!.id, input)
      : await createCustomer(input)

    setSubmitting(false)
    if (result) onSaved(result)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            {isEdit ? '顧客情報を編集' : '顧客を追加'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              顧客名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：株式会社ヒカリ"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">業種</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="例：建設業、美容・サロン、IT"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">WebサイトURL</label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="例：https://example.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">メモ</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="顧客に関するメモ（任意）"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? '保存中...' : isEdit ? '保存する' : '追加する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
