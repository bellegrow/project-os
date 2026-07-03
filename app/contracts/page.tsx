'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollText, CheckCircle2, Send, FileEdit, XCircle } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { getAllContracts, getProjects } from '@/lib/dataSource'
import type { Contract, Project, ContractStatus } from '@/lib/types'
import { demoContracts, demoProjects } from '@/lib/demoData'
import { IS_DEMO_MODE } from '@/lib/demo'

const STATUS_CONFIG: Record<ContractStatus, { label: string; icon: React.ElementType; cls: string }> = {
  draft:     { label: '作成中',   icon: FileEdit,    cls: 'bg-gray-100 text-gray-600' },
  sent:      { label: '送付済み', icon: Send,        cls: 'bg-amber-100 text-amber-700' },
  signed:    { label: '締結済み', icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
  completed: { label: '完了',     icon: CheckCircle2, cls: 'bg-blue-100 text-blue-700' },
  canceled:  { label: 'キャンセル', icon: XCircle,   cls: 'bg-gray-100 text-gray-400' },
}

function fmt(n: number) { return '¥' + n.toLocaleString() }
function formatDate(d: string) {
  const [y, m, dd] = d.split('-').map(Number)
  return `${y}年${m}月${dd}日`
}

export default function ContractsPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [projectMap, setProjectMap] = useState<Map<string, Project>>(new Map())
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    async function load() {
      const [cs, projs] = await Promise.all([getAllContracts(), getProjects()])
      // デモ: データ0件 → デモデータを表示
      const demo = IS_DEMO_MODE && cs.length === 0
      const c = demo ? demoContracts : cs
      setIsDemo(demo)
      setContracts([...c].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
      setProjectMap(new Map((demo ? demoProjects : projs).map(p => [p.id, p])))
      setLoading(false)
    }
    load()
  }, [])

  const signedCount    = contracts.filter(c => c.status === 'signed' || c.status === 'completed').length
  const sentCount      = contracts.filter(c => c.status === 'sent').length
  const draftCount     = contracts.filter(c => c.status === 'draft').length

  return (
    <AppShell>
      <main className="max-w-7xl mx-auto px-4 py-6 lg:px-8">

        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-gray-700" />
            契約書
          </h2>
          {!loading && <p className="text-xs text-gray-400 mt-0.5">全{contracts.length}件</p>}
        </div>

        {isDemo && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-2 mb-4">
            <span className="text-xs text-blue-700 font-medium">デモデータを表示中</span>
            <span className="text-xs text-blue-500">— クラウドモードで契約書を作成・管理できます</span>
          </div>
        )}

        {/* サマリーカード */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />締結済み
            </p>
            <p className="text-2xl font-bold text-emerald-600">{signedCount}<span className="text-sm font-normal text-gray-400 ml-1">件</span></p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <Send className="w-3 h-3 text-amber-500" />送付済み
            </p>
            <p className="text-2xl font-bold text-amber-600">{sentCount}<span className="text-sm font-normal text-gray-400 ml-1">件</span></p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <FileEdit className="w-3 h-3 text-gray-400" />作成中
            </p>
            <p className="text-2xl font-bold text-gray-600">{draftCount}<span className="text-sm font-normal text-gray-400 ml-1">件</span></p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-xs text-gray-400">読み込み中...</div>
        ) : contracts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
            <p className="text-sm font-medium text-gray-500 mb-1">契約書がありません</p>
            <p className="text-xs">案件ページから契約書を作成できます</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400">
                    <th className="text-left px-4 py-3 font-medium">タイトル</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">顧客 / 案件</th>
                    <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">金額</th>
                    <th className="text-left px-4 py-3 font-medium">ステータス</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">締結日</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">更新日</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {contracts.map(c => {
                    const proj = projectMap.get(c.projectId)
                    const st = STATUS_CONFIG[c.status]
                    return (
                      <tr
                        key={c.id}
                        onClick={() => router.push(`/projects/${c.projectId}`)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{c.title}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-xs text-gray-400 truncate">{proj?.clientName ?? '—'}</p>
                          <p className="text-xs text-gray-600 truncate max-w-[160px]">{proj?.name ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-700 hidden sm:table-cell">
                          {c.amount ? fmt(c.amount) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>
                            <st.icon className="w-3 h-3" />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                          {c.contractDate ? formatDate(c.contractDate) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                          {formatDate(c.updatedAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </AppShell>
  )
}
