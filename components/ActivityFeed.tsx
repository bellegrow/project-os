'use client'

import { useEffect, useState } from 'react'
import { Trash2, FileText, Users, FileSignature, Receipt, CreditCard, ArrowRightLeft, StickyNote, CheckSquare, Banknote, Folder } from 'lucide-react'
import { Activity, ActivityType } from '@/lib/types'
import { getActivities, getActivitiesByCustomer, getRecentActivities, deleteActivity } from '@/lib/dataSource'

interface Props {
  projectId?: string
  customerId?: string
  limit?: number
  refreshKey?: number
}

const TYPE_LABELS: Record<ActivityType, string> = {
  note: 'メモ',
  meeting: 'ミーティング',
  estimate_created: '見積作成',
  estimate_updated: '見積更新',
  invoice_created: '請求書作成',
  invoice_sent: '請求書送付',
  payment_received: '入金記録',
  payment_updated: '入金修正',
  contract_created: '契約書作成',
  contract_signed: '契約締結',
  status_changed: 'ステータス変更',
  task_created: 'タスク作成',
  task_completed: 'タスク完了',
  cost_added: '原価追加',
  cost_updated: '原価更新',
  cost_deleted: '原価削除',
  file_added: 'ファイル追加',
  file_updated: 'ファイル更新',
  file_deleted: 'ファイル削除',
}

const TYPE_COLORS: Record<ActivityType, string> = {
  note: 'bg-gray-100 text-gray-700',
  meeting: 'bg-purple-100 text-purple-700',
  estimate_created: 'bg-blue-100 text-blue-700',
  estimate_updated: 'bg-blue-100 text-blue-700',
  invoice_created: 'bg-orange-100 text-orange-700',
  invoice_sent: 'bg-orange-100 text-orange-700',
  payment_received: 'bg-green-100 text-green-700',
  payment_updated: 'bg-green-100 text-green-700',
  contract_created: 'bg-indigo-100 text-indigo-700',
  contract_signed: 'bg-indigo-100 text-indigo-700',
  status_changed: 'bg-yellow-100 text-yellow-700',
  task_created: 'bg-teal-100 text-teal-700',
  task_completed: 'bg-teal-100 text-teal-700',
  cost_added: 'bg-rose-100 text-rose-700',
  cost_updated: 'bg-rose-100 text-rose-700',
  cost_deleted: 'bg-rose-100 text-rose-700',
  file_added: 'bg-sky-100 text-sky-700',
  file_updated: 'bg-sky-100 text-sky-700',
  file_deleted: 'bg-sky-100 text-sky-700',
}

function TypeIcon({ type }: { type: ActivityType }) {
  const cls = 'w-3.5 h-3.5'
  switch (type) {
    case 'note': return <StickyNote className={cls} />
    case 'meeting': return <Users className={cls} />
    case 'estimate_created':
    case 'estimate_updated': return <FileText className={cls} />
    case 'invoice_created':
    case 'invoice_sent': return <Receipt className={cls} />
    case 'payment_received':
    case 'payment_updated': return <CreditCard className={cls} />
    case 'contract_created':
    case 'contract_signed': return <FileSignature className={cls} />
    case 'status_changed': return <ArrowRightLeft className={cls} />
    case 'task_created':
    case 'task_completed': return <CheckSquare className={cls} />
    case 'cost_added':
    case 'cost_updated':
    case 'cost_deleted': return <Banknote className={cls} />
    case 'file_added':
    case 'file_updated':
    case 'file_deleted': return <Folder className={cls} />
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
}

const MANUAL_TYPES: ActivityType[] = ['note', 'meeting']

export default function ActivityFeed({ projectId, customerId, limit, refreshKey }: Props) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const fetch = projectId
      ? getActivities(projectId)
      : customerId
      ? getActivitiesByCustomer(customerId)
      : getRecentActivities(limit ?? 10)

    fetch.then((data) => {
      setActivities(limit && (projectId || customerId) ? data.slice(0, limit) : data)
    }).finally(() => setLoading(false))
  }, [projectId, customerId, limit, refreshKey])

  async function handleDelete(id: string) {
    if (!window.confirm('この活動記録を削除しますか？')) return
    await deleteActivity(id)
    setActivities((prev) => prev.filter((a) => a.id !== id))
  }

  if (loading) {
    return <p className="text-sm text-gray-400 py-4">読み込み中...</p>
  }

  if (activities.length === 0) {
    return <p className="text-sm text-gray-400 py-4">活動履歴はありません</p>
  }

  return (
    <ul className="space-y-3">
      {activities.map((a) => (
        <li key={a.id} className="flex gap-3">
          <div className="mt-0.5 flex-shrink-0 w-1.5 bg-gray-200 rounded-full" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[a.type]}`}
                >
                  <TypeIcon type={a.type} />
                  {TYPE_LABELS[a.type]}
                </span>
                <span className="text-xs text-gray-400">{formatDate(a.occurredAt)}</span>
              </div>
              {MANUAL_TYPES.includes(a.type) && (
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-gray-300 hover:text-red-400 flex-shrink-0 mt-0.5"
                  title="削除"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <p className="text-sm font-medium text-gray-800 mt-1">{a.title}</p>
            {a.body && <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{a.body}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}
