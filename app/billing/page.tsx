'use client'

import { useState } from 'react'
import { FileText, AlertCircle } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { IS_DEMO_MODE } from '@/lib/demo'

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'accepted'
type Tab = 'invoices' | 'estimates'

interface BillingRow {
  id: string
  client: string
  project: string
  amount: number
  issuedDate: string
  dueDate?: string
  status: InvoiceStatus
}

const DEMO_ESTIMATES: BillingRow[] = [
  { id: 'EST-003', client: '田中工務店',        project: '採用サイト制作',                   amount: 420000, issuedDate: '2026-06-07', status: 'draft'    },
  { id: 'EST-002', client: '山田デザイン事務所', project: 'LP制作',                           amount: 300000, issuedDate: '2026-05-20', dueDate: '2026-06-20', status: 'sent' },
  { id: 'EST-001', client: 'BELLE美容室',        project: 'ホームページ制作',                  amount: 180000, issuedDate: '2026-04-15', status: 'accepted' },
]

const DEMO_INVOICES: BillingRow[] = [
  { id: 'INV-004', client: '山田建設株式会社',   project: 'コーポレートサイト大規模リニューアル', amount: 800000, issuedDate: '2026-06-01', dueDate: '2026-06-30', status: 'sent'    },
  { id: 'INV-003', client: 'BELLE美容室',        project: 'ホームページ制作',                  amount: 180000, issuedDate: '2026-05-01', dueDate: '2026-05-31', status: 'paid'    },
  { id: 'INV-002', client: 'さくら整体院',        project: 'ホームページリニューアル',           amount: 240000, issuedDate: '2026-04-15', dueDate: '2026-05-15', status: 'overdue' },
  { id: 'INV-001', client: '山田デザイン事務所', project: 'LP制作',                           amount: 150000, issuedDate: '2026-03-01', dueDate: '2026-03-31', status: 'paid'    },
]

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft:    '下書き',
  sent:     '送付済み',
  paid:     '入金済み',
  overdue:  '期限超過',
  accepted: '承認済み',
}
const STATUS_CLS: Record<InvoiceStatus, string> = {
  draft:    'bg-gray-100 text-gray-500',
  sent:     'bg-blue-100 text-blue-700',
  paid:     'bg-emerald-100 text-emerald-700',
  overdue:  'bg-red-100 text-red-700',
  accepted: 'bg-violet-100 text-violet-700',
}

function formatAmount(n: number) {
  return '¥' + n.toLocaleString()
}
function formatDate(d: string) {
  const [, m, dd] = d.split('-')
  return `${parseInt(m)}/${parseInt(dd)}`
}

export default function BillingPage() {
  const [tab, setTab] = useState<Tab>('invoices')

  if (!IS_DEMO_MODE) return (
    <AppShell>
      <main className="max-w-7xl mx-auto px-4 py-6 lg:px-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">見積・請求</h2>
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm font-medium text-gray-500 mb-1">請求データがありません</p>
          <p className="text-xs">案件ページから見積書・請求書を作成できます</p>
        </div>
      </main>
    </AppShell>
  )

  const sentAmount = DEMO_INVOICES.filter(i => i.status === 'sent').reduce((s, i) => s + i.amount, 0)
  const paidAmount = DEMO_INVOICES.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const overdueAmount = DEMO_INVOICES.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0)
  const totalBilled = sentAmount + paidAmount + overdueAmount

  const rows = tab === 'invoices' ? DEMO_INVOICES : DEMO_ESTIMATES

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
            <FileText className="w-5 h-5 text-gray-700" />
            見積・請求
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">今月の請求・見積状況</p>
        </div>

        {/* KPIカード */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">今月請求合計</p>
            <p className="text-xl font-bold text-gray-900">{formatAmount(totalBilled)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">入金済み</p>
            <p className="text-xl font-bold text-emerald-600">{formatAmount(paidAmount)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">未入金</p>
            <p className="text-xl font-bold text-blue-600">{formatAmount(sentAmount)}</p>
          </div>
          <div className={`rounded-xl p-4 border ${overdueAmount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
            <p className={`text-xs mb-1 flex items-center gap-1 ${overdueAmount > 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {overdueAmount > 0 && <AlertCircle className="w-3 h-3" />}
              期限超過
            </p>
            <p className={`text-xl font-bold ${overdueAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {formatAmount(overdueAmount)}
            </p>
          </div>
        </div>

        {/* タブ */}
        <div className="flex bg-white border border-gray-200 rounded-xl mb-4 p-1 gap-1 max-w-xs">
          {([['invoices', '請求書'], ['estimates', '見積書']] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === key ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* テーブル */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400">
                  <th className="text-left px-4 py-3 font-medium">No</th>
                  <th className="text-left px-4 py-3 font-medium">顧客 / 案件</th>
                  <th className="text-right px-4 py-3 font-medium">金額</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">発行日</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">支払期限</th>
                  <th className="text-left px-4 py-3 font-medium">ステータス</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{row.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-400 truncate">{row.client}</p>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{row.project}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 tabular-nums">
                      {formatAmount(row.amount)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">{formatDate(row.issuedDate)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">
                      {row.dueDate ? formatDate(row.dueDate) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CLS[row.status]}`}>
                        {STATUS_LABEL[row.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </AppShell>
  )
}
