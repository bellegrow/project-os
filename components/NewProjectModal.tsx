'use client'

import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { Project, ProjectStatus, Customer } from '@/lib/types'
import { createProject, getCustomers, createCustomer } from '@/lib/dataSource'
import { useCloudMode } from '@/lib/hooks/useCloudMode'

interface Props {
  onClose: () => void
  onCreated: (project: Project) => void
}

const STATUS_OPTIONS: ProjectStatus[] = ['商談中', '提案済', '受注', '進行中', '完了', '失注']

export default function NewProjectModal({ onClose, onCreated }: Props) {
  const isCloud = useCloudMode()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [clientName, setClientName] = useState('')
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('商談中')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isCloud) {
      getCustomers().then(setCustomers)
    }
  }, [isCloud])

  // 顧客を選択したらクライアント名を自動入力
  useEffect(() => {
    if (selectedCustomerId) {
      const c = customers.find((c) => c.id === selectedCustomerId)
      if (c) setClientName(c.name)
    }
  }, [selectedCustomerId, customers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const effectiveClientName = clientName.trim() || newCustomerName.trim()
    if (!effectiveClientName || !name.trim()) return
    setSubmitting(true)

    let customerId = selectedCustomerId || undefined

    // 新規顧客を先に作成
    if (showNewCustomer && newCustomerName.trim()) {
      const newCustomer = await createCustomer({ name: newCustomerName.trim() })
      if (newCustomer) customerId = newCustomer.id
    }

    const project = await createProject({
      clientName: effectiveClientName,
      name: name.trim(),
      status,
      budget: budget ? parseInt(budget.replace(/[^0-9]/g, ''), 10) || undefined : undefined,
      customerId,
    })
    setSubmitting(false)
    if (project) onCreated(project)
  }

  const effectiveClientName = selectedCustomerId
    ? (customers.find((c) => c.id === selectedCustomerId)?.name ?? '')
    : showNewCustomer
    ? newCustomerName
    : clientName

  const canSubmit = !submitting && !!effectiveClientName.trim() && !!name.trim()

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">新規案件を作成</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* クライアント：クラウドモードでは顧客選択あり */}
          {isCloud ? (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                クライアント <span className="text-red-400">*</span>
              </label>
              {!showNewCustomer ? (
                <>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">─ 手動入力 ─</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {!selectedCustomerId && (
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="例：株式会社ヒカリ"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => { setShowNewCustomer(true); setSelectedCustomerId('') }}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1.5 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    新規顧客として追加
                  </button>
                </>
              ) : (
                <div>
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="顧客名を入力"
                    className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <p className="text-xs text-blue-500 mt-1">
                    案件作成時に顧客も新規登録されます。
                  </p>
                  <button
                    type="button"
                    onClick={() => { setShowNewCustomer(false); setNewCustomerName('') }}
                    className="text-xs text-gray-400 hover:text-gray-600 mt-1 transition-colors"
                  >
                    既存顧客から選ぶ
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                クライアント名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="例：株式会社ヒカリ"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              案件名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：ECサイトリニューアル"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">ステータス</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">概算予算（円）</label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="例：1500000"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
              disabled={!canSubmit}
              className="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? '作成中...' : '作成する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
