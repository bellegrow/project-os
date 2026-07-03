'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trash2, RotateCcw, AlertTriangle, X, Loader2 } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { TrashItem, TrashItemType } from '@/lib/types'
import { getTrashItems, restoreTrashItem, hardDeleteTrashItem } from '@/lib/dataSource'
import { demoTrash } from '@/lib/demoData'
import { IS_DEMO_MODE } from '@/lib/demo'

const TYPE_LABEL: Record<TrashItemType, string> = {
  customer:     '顧客',
  project:      '案件',
  task:         'タスク',
  activity:     'アクティビティ',
  estimate:     '見積',
  invoice:      '請求',
  contract:     '契約書',
  project_cost: '原価',
  project_file: 'ファイル',
}

const TYPE_COLOR: Record<TrashItemType, string> = {
  customer:     'bg-violet-50 text-violet-700',
  project:      'bg-indigo-50 text-indigo-700',
  task:         'bg-rose-50 text-rose-700',
  activity:     'bg-sky-50 text-sky-700',
  estimate:     'bg-orange-50 text-orange-700',
  invoice:      'bg-orange-50 text-orange-700',
  contract:     'bg-purple-50 text-purple-700',
  project_cost: 'bg-emerald-50 text-emerald-700',
  project_file: 'bg-amber-50 text-amber-700',
}

function formatDeletedAt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

interface HardDeleteModalProps {
  item: TrashItem
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

function HardDeleteModal({ item, onConfirm, onCancel, loading }: HardDeleteModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">完全削除の確認</h3>
            <p className="text-xs text-gray-500 mt-0.5">この操作は取り消せません</p>
          </div>
          <button onClick={onCancel} className="ml-auto p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5">
          <p className="text-xs text-gray-500 mb-1">{TYPE_LABEL[item.type]}</p>
          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
          {item.meta && <p className="text-xs text-gray-400 mt-0.5">{item.meta}</p>}
        </div>
        <p className="text-xs text-gray-500 mb-5">
          このデータはDBから完全に削除されます。復元できなくなります。
          {item.type === 'project_file' && 'ストレージファイルも削除されます。'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            完全削除
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TrashPage() {
  const [items, setItems] = useState<TrashItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [confirmItem, setConfirmItem] = useState<TrashItem | null>(null)
  const [hardDeleteLoading, setHardDeleteLoading] = useState(false)
  const [isDemo, setIsDemo] = useState(false)

  const load = useCallback(async () => {
    setMounted(true)
    setLoading(true)
    try {
      const trash = await getTrashItems()
      // デモ: ゴミ箱が空 → デモデータを表示
      const demo = IS_DEMO_MODE && trash.length === 0
      setIsDemo(demo)
      setItems(demo ? demoTrash : trash)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleRestore = async (item: TrashItem) => {
    // デモ: バックエンドは触らず一覧から除くだけ
    if (isDemo) {
      setItems(prev => prev.filter(i => i.id !== item.id))
      return
    }
    setActionId(item.id)
    try {
      await restoreTrashItem(item.type, item.id)
      setItems(prev => prev.filter(i => i.id !== item.id))
    } finally {
      setActionId(null)
    }
  }

  const handleHardDelete = async () => {
    if (!confirmItem) return
    // デモ: バックエンドは触らず一覧から除くだけ
    if (isDemo) {
      setItems(prev => prev.filter(i => i.id !== confirmItem.id))
      setConfirmItem(null)
      return
    }
    setHardDeleteLoading(true)
    try {
      await hardDeleteTrashItem(confirmItem.type, confirmItem.id, confirmItem.storagePath)
      setItems(prev => prev.filter(i => i.id !== confirmItem.id))
      setConfirmItem(null)
    } finally {
      setHardDeleteLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <AppShell>
      <main className="max-w-3xl mx-auto px-4 py-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-gray-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">ゴミ箱</h2>
            <p className="text-xs text-gray-400 mt-0.5">削除されたデータを復元または完全削除できます</p>
          </div>
        </div>

        {isDemo && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-2 mb-4">
            <span className="text-xs text-blue-700 font-medium">デモデータを表示中</span>
            <span className="text-xs text-blue-500">— クラウドモードで削除したデータの復元・完全削除ができます</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">読み込み中...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Trash2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-400">ゴミ箱は空です</p>
            <p className="text-xs text-gray-300 mt-1">削除したデータはここに表示されます</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => {
              const busy = actionId === item.id
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${TYPE_COLOR[item.type]}`}>
                    {TYPE_LABEL[item.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    {item.meta && <p className="text-xs text-gray-400 truncate">{item.meta}</p>}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
                    {formatDeletedAt(item.deletedAt)}
                  </span>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleRestore(item)}
                      disabled={busy}
                      title="復元"
                      className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                    >
                      {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                      <span className="hidden sm:inline">復元</span>
                    </button>
                    <button
                      onClick={() => setConfirmItem(item)}
                      disabled={busy}
                      title="完全削除"
                      className="flex items-center gap-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="hidden sm:inline">完全削除</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-6">
          {items.length > 0 && `${items.length}件の削除済みデータ`}
        </p>
      </main>

      {confirmItem && (
        <HardDeleteModal
          item={confirmItem}
          onConfirm={handleHardDelete}
          onCancel={() => setConfirmItem(null)}
          loading={hardDeleteLoading}
        />
      )}
    </AppShell>
  )
}
