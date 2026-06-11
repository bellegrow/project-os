'use client'

import { ScrollText, CheckCircle2, Send, FileEdit } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { IS_DEMO_MODE } from '@/lib/demo'

type ContractStatus = 'draft' | 'sent' | 'signed'

interface Contract {
  id: string
  client: string
  project: string
  type: string
  status: ContractStatus
  signedDate?: string
  updatedDate: string
}

const DEMO_CONTRACTS: Contract[] = [
  { id: 'CON-005', client: '田中工務店',         project: '採用サイト制作',                   type: '業務委託契約書',     status: 'draft',  updatedDate: '2026-06-07' },
  { id: 'CON-004', client: '山田デザイン事務所',  project: 'LP制作',                           type: '秘密保持契約書（NDA）', status: 'sent',  updatedDate: '2026-05-21' },
  { id: 'CON-003', client: 'BELLE美容室',         project: 'ホームページ制作',                  type: '業務委託契約書',     status: 'signed', signedDate: '2026-04-20', updatedDate: '2026-04-20' },
  { id: 'CON-002', client: 'さくら整体院',         project: 'ホームページリニューアル',           type: '保守契約書',         status: 'signed', signedDate: '2026-03-01', updatedDate: '2026-03-01' },
  { id: 'CON-001', client: '山田建設株式会社',    project: 'コーポレートサイト大規模リニューアル', type: '業務委託契約書',     status: 'signed', signedDate: '2026-02-15', updatedDate: '2026-02-15' },
]

const STATUS_CONFIG: Record<ContractStatus, { label: string; icon: React.ElementType; cls: string }> = {
  draft:  { label: '作成中',   icon: FileEdit,     cls: 'bg-gray-100 text-gray-600' },
  sent:   { label: '送付済み', icon: Send,         cls: 'bg-amber-100 text-amber-700' },
  signed: { label: '締結済み', icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
}

function formatDate(d: string) {
  const [y, m, dd] = d.split('-').map(Number)
  return `${y}年${m}月${dd}日`
}

export default function ContractsPage() {
  const signedCount = DEMO_CONTRACTS.filter(c => c.status === 'signed').length
  const sentCount   = DEMO_CONTRACTS.filter(c => c.status === 'sent').length
  const draftCount  = DEMO_CONTRACTS.filter(c => c.status === 'draft').length

  if (!IS_DEMO_MODE) return (
    <AppShell>
      <main className="max-w-7xl mx-auto px-4 py-6 lg:px-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">契約書</h2>
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm font-medium text-gray-500 mb-1">契約書がありません</p>
          <p className="text-xs">案件ページから契約書を作成できます</p>
        </div>
      </main>
    </AppShell>
  )

  return (
    <AppShell>
      <main className="max-w-7xl mx-auto px-4 py-6 lg:px-8">

        {/* デモバナー */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-2 mb-4">
          <span className="text-xs text-blue-700 font-medium">デモデータを表示中</span>
          <span className="text-xs text-blue-500">— 案件・タスクを登録すると実データに切り替わります</span>
        </div>

        {/* ページタイトル */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-gray-700" />
            契約書
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">全{DEMO_CONTRACTS.length}件</p>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" />締結済み</p>
            <p className="text-2xl font-bold text-emerald-600">{signedCount}<span className="text-sm font-normal text-gray-400 ml-1">件</span></p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Send className="w-3 h-3 text-amber-500" />送付済み</p>
            <p className="text-2xl font-bold text-amber-600">{sentCount}<span className="text-sm font-normal text-gray-400 ml-1">件</span></p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><FileEdit className="w-3 h-3 text-gray-400" />作成中</p>
            <p className="text-2xl font-bold text-gray-600">{draftCount}<span className="text-sm font-normal text-gray-400 ml-1">件</span></p>
          </div>
        </div>

        {/* テーブル */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400">
                  <th className="text-left px-4 py-3 font-medium">No</th>
                  <th className="text-left px-4 py-3 font-medium">顧客 / 案件</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">種別</th>
                  <th className="text-left px-4 py-3 font-medium">ステータス</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">締結日</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">更新日</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {DEMO_CONTRACTS.map(contract => {
                  const st = STATUS_CONFIG[contract.status]
                  return (
                    <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{contract.id}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-400">{contract.client}</p>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{contract.project}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">{contract.type}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>
                          <st.icon className="w-3 h-3" />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                        {contract.signedDate ? formatDate(contract.signedDate) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                        {formatDate(contract.updatedDate)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </AppShell>
  )
}
