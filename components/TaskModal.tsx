'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Task, TaskInput, TaskUpdateInput } from '@/lib/types'
import { createTask, updateTask } from '@/lib/dataSource'

interface Props {
  task?: Task
  projectId: string
  customerId?: string
  onClose: () => void
  onSaved: (task: Task) => void
}

const PRIORITY_LABELS = { high: '高', medium: '中', low: '低' } as const
const STATUS_LABELS = { todo: '未対応', in_progress: '進行中', done: '完了' } as const

export default function TaskModal({ task, projectId, customerId, onClose, onSaved }: Props) {
  const isEdit = !!task
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '')
  const [priority, setPriority] = useState<Task['priority']>(task?.priority ?? 'medium')
  const [status, setStatus] = useState<Task['status']>(task?.status ?? 'todo')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('タスク名を入力してください'); return }
    setSaving(true)
    setError('')
    try {
      let saved: Task | undefined
      if (isEdit) {
        const input: TaskUpdateInput = {
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          dueDate: dueDate || null,
        }
        saved = await updateTask(task.id, input)
      } else {
        const input: TaskInput = {
          projectId,
          customerId,
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          dueDate: dueDate || undefined,
        }
        saved = await createTask(input)
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
          <h2 className="text-lg font-semibold">{isEdit ? 'タスクを編集' : 'タスクを追加'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">タスク名</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：提案書を送る"
              autoFocus
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">説明（任意）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="詳細・メモなど"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">期限（任意）</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">優先度</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {(['high', 'medium', 'low'] as const).map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Task['status'])}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {(['todo', 'in_progress', 'done'] as const).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
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
