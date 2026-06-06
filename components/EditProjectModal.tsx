'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Project, ProjectStatus } from '@/lib/types'
import { updateProject } from '@/lib/storage'

interface Props {
  project: Project
  onClose: () => void
  onSaved: (project: Project) => void
}

const STATUS_OPTIONS: ProjectStatus[] = ['商談中', '提案済', '受注', '進行中', '完了', '失注']

export default function EditProjectModal({ project, onClose, onSaved }: Props) {
  const [clientName, setClientName] = useState(project.clientName)
  const [name, setName] = useState(project.name)
  const [budget, setBudget] = useState(project.budget ? String(project.budget) : '')
  const [status, setStatus] = useState<ProjectStatus>(project.status)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName.trim() || !name.trim()) return
    const budgetNum = budget ? parseInt(budget.replace(/[^0-9]/g, ''), 10) || undefined : undefined
    const updated = updateProject(project.id, {
      clientName: clientName.trim(),
      name: name.trim(),
      status,
      budget: budgetNum,
    })
    if (updated) onSaved(updated)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">案件を編集</h2>
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
              クライアント名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              案件名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              disabled={!clientName.trim() || !name.trim()}
              className="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              保存する
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
