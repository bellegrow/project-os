'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, AlertCircle } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { getAllEstimates, getAllInvoices, getProjects } from '@/lib/dataSource'
import type { Estimate, Invoice, Project, EstimateStatus, InvoiceStatus } from '@/lib/types'
import { demoEstimates, demoInvoices, demoProjects } from '@/lib/demoData'
import { IS_DEMO_MODE } from '@/lib/demo'

type Tab = 'invoices' | 'estimates'

const ESTIMATE_STATUS_LABEL: Record<EstimateStatus, string> = {
  draft:    '下書き',
  sent:     '送付済み',
  approved: '承認済み',
  rejected: '却下',
}
const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft:    '下書き',
  sent:     '送付済み',
  paid:     '入金済み',
  overdue:  '期限超過',
  canceled: 'キャンセル',
}
const ESTIMATE_STATUS_CLS: Record<EstimateStatus, string> = {
  draft:    'bg-gray-100 text-gray-500',
  sent:     'bg-blue-100 text-blue-700',
  approved: 'bg-violet-100 text-violet-700',
  rejected: 'bg-red-100 text-red-500',
}
const INVOICE_STATUS_CLS: Record<InvoiceStatus, string> = {
  draft:    'bg-gray-100 text-gray-500',
  sent:     'bg-blue-100 text-blue-700',
  paid:     'bg-emerald-100 text-emerald-700',
  overdue:  'bg-red-100 text-red-700',
  canceled: 'bg-gray-100 text-gray-400',
}

function fmt(n: number) { return '¥' + n.toLocaleString() }
function fmtDate(d: string) {
  const [, m, dd] = d.split('-')
  return `${parseInt(m)}/${parseInt(dd)}`
}

export default function BillingPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('invoices')
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [projectMap, setProjectMap] = useState<Map<string, Project>>(new Map())
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    async function load() {
      const [ests, invs, projs] = await Promise.all([
        getAllEstimates(),
        getAllInvoices(),
        getProjects(),
      ])
      // デモ: データ0件 → デモデータを表示
      const demo = IS_DEMO_MODE && ests.length === 0 && invs.length === 0
      const e = demo ? demoEstimates : ests
      const i = demo ? demoInvoices : invs
      const map = new Map((demo ? demoProjects : projs).map(p => [p.id, p]))
      setIsDemo(demo)
      setEstimates([...e].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
      setInvoices([...i].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
      setProjectMap(map)
      setLoading(false)
    }
    load()
  }, [])

  const sentAmount    = invoices.filter(i => i.status === 'sent').reduce((s, i) => s + i.total, 0)
  const paidAmount    = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.total, 0)
  const totalBilled   = sentAmount + paidAmount + overdueAmount

  return (
    <AppShell>
      <main className="max-w-7xl mx-auto px-4 py-6 lg:px-8">

        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-700" />
            見積・請求
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">請求・見積の一覧と入金状況</p>
        </div>

        {isDemo && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-2 mb-4">
            <span className="text-xs text-blue-700 font-medium">デモデータを表示中</span>
            <span className="text-xs text-blue-500">— クラウドモードで見積・請求を作成・管理できます</span>
          </div>
        )}

        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">請求合計</p>
            <p className="text-xl font-bold text-gray-900">{fmt(totalBilled)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">入金済み</p>
            <p className="text-xl font-bold text-emerald-600">{fmt(paidAmount)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">未入金</p>
            <p className="text-xl font-bold text-blue-600">{fmt(sentAmount)}</p>
          </div>
          <div className={`rounded-xl p-4 border ${overdueAmount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
            <p className={`text-xs mb-1 flex items-center gap-1 ${overdueAmount > 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {overdueAmount > 0 && <AlertCircle className="w-3 h-3" />}
              期限超過
            </p>
            <p className={`text-xl font-bold ${overdueAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {fmt(overdueAmount)}
            </p>
          </div>
        </div>

        {/* タブ */}
        <div className="flex bg-white border border-gray-200 rounded-xl mb-4 p-1 gap-1 max-w-xs">
          {([['invoices', `請求書 ${invoices.length > 0 ? `(${invoices.length})` : ''}`], ['estimates', `見積書 ${estimates.length > 0 ? `(${estimates.length})` : ''}`]] as [Tab, string][]).map(([key, label]) => (
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
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-xs text-gray-400">
            読み込み中...
          </div>
        ) : tab === 'invoices' ? (
          invoices.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
              <p className="text-sm font-medium text-gray-500 mb-1">請求書がありません</p>
              <p className="text-xs">案件ページから請求書を作成できます</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400">
                      <th className="text-left px-4 py-3 font-medium">タイトル</th>
                      <th className="text-left px-4 py-3 font-medium hidden md:table-cell">顧客 / 案件</th>
                      <th className="text-right px-4 py-3 font-medium">金額</th>
                      <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">発行日</th>
                      <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">支払期限</th>
                      <th className="text-left px-4 py-3 font-medium">ステータス</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {invoices.map(inv => {
                      const proj = projectMap.get(inv.projectId)
                      return (
                        <tr
                          key={inv.id}
                          onClick={() => router.push(`/projects/${inv.projectId}`)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{inv.title}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <p className="text-xs text-gray-400 truncate">{proj?.clientName ?? '—'}</p>
                            <p className="text-xs text-gray-600 truncate max-w-[160px]">{proj?.name ?? '—'}</p>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 tabular-nums">
                            {fmt(inv.total)}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">{fmtDate(inv.createdAt)}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">
                            {inv.dueDate ? fmtDate(inv.dueDate) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${INVOICE_STATUS_CLS[inv.status]}`}>
                              {INVOICE_STATUS_LABEL[inv.status]}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          estimates.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
              <p className="text-sm font-medium text-gray-500 mb-1">見積書がありません</p>
              <p className="text-xs">案件ページから見積書を作成できます</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400">
                      <th className="text-left px-4 py-3 font-medium">タイトル</th>
                      <th className="text-left px-4 py-3 font-medium hidden md:table-cell">顧客 / 案件</th>
                      <th className="text-right px-4 py-3 font-medium">金額</th>
                      <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">作成日</th>
                      <th className="text-left px-4 py-3 font-medium">ステータス</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {estimates.map(est => {
                      const proj = projectMap.get(est.projectId)
                      return (
                        <tr
                          key={est.id}
                          onClick={() => router.push(`/projects/${est.projectId}`)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{est.title}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <p className="text-xs text-gray-400 truncate">{proj?.clientName ?? '—'}</p>
                            <p className="text-xs text-gray-600 truncate max-w-[160px]">{proj?.name ?? '—'}</p>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 tabular-nums">
                            {fmt(est.total)}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">{fmtDate(est.createdAt)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTIMATE_STATUS_CLS[est.status]}`}>
                              {ESTIMATE_STATUS_LABEL[est.status]}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

      </main>
    </AppShell>
  )
}
