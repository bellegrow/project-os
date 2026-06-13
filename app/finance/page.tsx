'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { getAllInvoices, getAllProjectCosts, getProjects } from '@/lib/dataSource'
import type { Invoice, ProjectCost, Project, CostCategory } from '@/lib/types'

const COST_LABEL: Record<CostCategory, string> = {
  outsourcing: '外注費',
  material:    '材料費',
  tool:        'ツール費',
  ad:          '広告費',
  other:       'その他',
}

function fmt(n: number) { return '¥' + n.toLocaleString() }

interface ProjectRow {
  id: string
  name: string
  clientName: string
  revenue: number
  cost: number
  profit: number
  profitRate: number
  deleted: boolean
}

export default function FinancePage() {
  const router = useRouter()
  const [rows, setRows] = useState<ProjectRow[]>([])
  const [costByCategory, setCostByCategory] = useState<{ category: CostCategory; amount: number }[]>([])
  const [totals, setTotals] = useState({ revenue: 0, cost: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [invoices, costs, projs] = await Promise.all([
        getAllInvoices(),
        getAllProjectCosts(),
        getProjects(),
      ])

      const projectMap = new Map(projs.map(p => [p.id, p]))

      // 案件ごとに売上・原価を集計
      const revenueByProject = new Map<string, number>()
      for (const inv of invoices) {
        if (inv.status !== 'canceled') {
          revenueByProject.set(inv.projectId, (revenueByProject.get(inv.projectId) ?? 0) + inv.total)
        }
      }
      const costByProject = new Map<string, number>()
      for (const c of costs) {
        costByProject.set(c.projectId, (costByProject.get(c.projectId) ?? 0) + c.amount)
      }

      // 関係する全案件IDを収集
      const allProjectIds = new Set([...revenueByProject.keys(), ...costByProject.keys()])
      const projectRows: ProjectRow[] = []
      for (const pid of allProjectIds) {
        const proj = projectMap.get(pid)
        const revenue = revenueByProject.get(pid) ?? 0
        const cost    = costByProject.get(pid) ?? 0
        const profit  = revenue - cost
        projectRows.push({
          id: pid,
          name: proj?.name ?? '(削除済み案件)',
          clientName: proj?.clientName ?? '',
          revenue,
          cost,
          profit,
          profitRate: revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0,
          deleted: !proj,
        })
      }
      projectRows.sort((a, b) => b.revenue - a.revenue)

      // カテゴリ別原価
      const catMap = new Map<CostCategory, number>()
      for (const c of costs) {
        catMap.set(c.category, (catMap.get(c.category) ?? 0) + c.amount)
      }
      const catRows = (Object.keys(COST_LABEL) as CostCategory[])
        .map(cat => ({ category: cat, amount: catMap.get(cat) ?? 0 }))
        .filter(r => r.amount > 0)
        .sort((a, b) => b.amount - a.amount)

      const totalRevenue = projectRows.reduce((s, r) => s + r.revenue, 0)
      const totalCost    = projectRows.reduce((s, r) => s + r.cost, 0)

      setRows(projectRows)
      setCostByCategory(catRows)
      setTotals({ revenue: totalRevenue, cost: totalCost })
      setLoading(false)
    }
    load()
  }, [])

  const grossProfit = totals.revenue - totals.cost
  const profitRate  = totals.revenue > 0
    ? Math.round((grossProfit / totals.revenue) * 1000) / 10
    : 0

  return (
    <AppShell>
      <main className="max-w-7xl mx-auto px-4 py-6 lg:px-8 space-y-6">

        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-700" />
            利益管理
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">案件別売上・原価・粗利益の集計</p>
        </div>

        {/* KPIカード */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">売上合計</p>
            <p className="text-xl font-bold text-gray-900">{fmt(totals.revenue)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">原価合計</p>
            <p className="text-xl font-bold text-rose-500">{fmt(totals.cost)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">粗利益</p>
            <p className={`text-xl font-bold ${grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(grossProfit)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">利益率</p>
            <p className={`text-xl font-bold ${profitRate >= 50 ? 'text-emerald-600' : profitRate < 0 ? 'text-red-600' : 'text-amber-600'}`}>{profitRate}%</p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-xs text-gray-400">読み込み中...</div>
        ) : rows.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
            <p className="text-sm font-medium text-gray-500 mb-1">データがありません</p>
            <p className="text-xs">案件ページから見積・請求・原価を入力すると集計されます</p>
          </div>
        ) : (
          <>
            {/* 案件別利益 */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">案件別利益</h3>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs text-gray-400">
                        <th className="text-left px-4 py-3 font-medium">案件</th>
                        <th className="text-right px-4 py-3 font-medium">売上</th>
                        <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">原価</th>
                        <th className="text-right px-4 py-3 font-medium">粗利益</th>
                        <th className="text-right px-4 py-3 font-medium">利益率</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {rows.map(r => (
                        <tr
                          key={r.id}
                          onClick={() => !r.deleted && router.push(`/projects/${r.id}`)}
                          className={`transition-colors ${r.deleted ? 'opacity-50' : 'hover:bg-gray-50 cursor-pointer'}`}
                        >
                          <td className="px-4 py-3">
                            <p className="text-xs text-gray-400">{r.clientName}</p>
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{r.name}</p>
                          </td>
                          <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-700">{fmt(r.revenue)}</td>
                          <td className="px-4 py-3 text-right text-sm tabular-nums text-rose-500 hidden sm:table-cell">{fmt(r.cost)}</td>
                          <td className={`px-4 py-3 text-right text-sm tabular-nums font-semibold ${r.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(r.profit)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-xs font-semibold ${r.profitRate >= 70 ? 'text-emerald-600' : r.profitRate < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                              {r.profitRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
                        <td className="px-4 py-3">合計</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmt(totals.revenue)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-rose-500 hidden sm:table-cell">{fmt(totals.cost)}</td>
                        <td className={`px-4 py-3 text-right tabular-nums ${grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(grossProfit)}</td>
                        <td className={`px-4 py-3 text-right ${profitRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{profitRate}%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </section>

            {/* 原価内訳 */}
            {costByCategory.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">原価内訳</h3>
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  {costByCategory.map(c => {
                    const pct = totals.cost > 0 ? Math.round((c.amount / totals.cost) * 100) : 0
                    return (
                      <div key={c.category}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{COST_LABEL[c.category]}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">{pct}%</span>
                            <span className="text-sm font-semibold text-gray-900 tabular-nums w-24 text-right">{fmt(c.amount)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">原価合計</span>
                    <span className="text-sm font-bold text-rose-500">{fmt(totals.cost)}</span>
                  </div>
                </div>
              </section>
            )}

            {/* 損益サマリー */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">損益サマリー</h3>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-700">売上</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">{fmt(totals.revenue)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-rose-400" />
                      <span className="text-sm text-gray-700">原価</span>
                    </div>
                    <span className="text-sm font-semibold text-rose-500 tabular-nums">−{fmt(totals.cost)}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">粗利益</span>
                    <span className={`text-base font-bold tabular-nums ${grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {fmt(grossProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

      </main>
    </AppShell>
  )
}
