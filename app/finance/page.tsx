'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { IS_DEMO_MODE } from '@/lib/demo'

const SUMMARY = {
  revenue:     1250000,
  cost:         380000,
  grossProfit:  870000,
  profitRate:   69.6,
}

const PROJECT_PROFITS = [
  { name: 'コーポレートサイト大規模リニューアル', client: '山田建設株式会社', revenue: 800000, cost: 210000, profit: 590000, profitRate: 73.8 },
  { name: 'LP制作',                          client: '山田デザイン事務所', revenue: 300000, cost:  80000, profit: 220000, profitRate: 73.3 },
  { name: 'ホームページ制作',                  client: 'BELLE美容室',       revenue: 180000, cost:  55000, profit: 125000, profitRate: 69.4 },
  { name: 'ホームページリニューアル',           client: 'さくら整体院',       revenue: 240000, cost:  90000, profit: 150000, profitRate: 62.5 },
]

const COST_CATEGORIES = [
  { category: '外注費',        amount: 240000, pct: 63 },
  { category: '材料・ツール費', amount:  85000, pct: 22 },
  { category: '広告・販促費',  amount:  35000, pct:  9 },
  { category: 'その他',        amount:  20000, pct:  5 },
]

function fmt(n: number) { return '¥' + n.toLocaleString() }

export default function FinancePage() {
  if (!IS_DEMO_MODE) return (
    <AppShell>
      <main className="max-w-7xl mx-auto px-4 py-6 lg:px-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">利益管理</h2>
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm font-medium text-gray-500 mb-1">データがありません</p>
          <p className="text-xs">案件ページからコストを入力すると利益が集計されます</p>
        </div>
      </main>
    </AppShell>
  )

  return (
    <AppShell>
      <main className="max-w-7xl mx-auto px-4 py-6 lg:px-8 space-y-6">

        {/* デモバナー */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <span className="text-xs text-blue-700 font-medium">デモデータを表示中</span>
          <span className="text-xs text-blue-500">— 案件・タスクを登録すると実データに切り替わります</span>
        </div>

        {/* ページタイトル */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-700" />
            利益管理
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">2026年6月 集計</p>
        </div>

        {/* KPIカード */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">今月売上</p>
            <p className="text-xl font-bold text-gray-900">{fmt(SUMMARY.revenue)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">今月原価</p>
            <p className="text-xl font-bold text-rose-500">{fmt(SUMMARY.cost)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">粗利益</p>
            <p className="text-xl font-bold text-emerald-600">{fmt(SUMMARY.grossProfit)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">利益率</p>
            <p className="text-xl font-bold text-emerald-600">{SUMMARY.profitRate}%</p>
          </div>
        </div>

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
                  {PROJECT_PROFITS.map(p => (
                    <tr key={p.name} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-400">{p.client}</p>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{p.name}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-700">{fmt(p.revenue)}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums text-rose-500 hidden sm:table-cell">{fmt(p.cost)}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums font-semibold text-emerald-600">{fmt(p.profit)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-semibold ${p.profitRate >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {p.profitRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
                    <td className="px-4 py-3">合計</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmt(SUMMARY.revenue)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-rose-500 hidden sm:table-cell">{fmt(SUMMARY.cost)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-600">{fmt(SUMMARY.grossProfit)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{SUMMARY.profitRate}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>

        {/* 原価内訳 */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">原価内訳</h3>
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            {COST_CATEGORIES.map(c => (
              <div key={c.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{c.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{c.pct}%</span>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums w-24 text-right">{fmt(c.amount)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded-full transition-all"
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">原価合計</span>
              <span className="text-sm font-bold text-rose-500">{fmt(SUMMARY.cost)}</span>
            </div>
          </div>
        </section>

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
                <span className="text-sm font-semibold text-gray-900 tabular-nums">{fmt(SUMMARY.revenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  <span className="text-sm text-gray-700">原価</span>
                </div>
                <span className="text-sm font-semibold text-rose-500 tabular-nums">−{fmt(SUMMARY.cost)}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">粗利益</span>
                <span className="text-base font-bold text-emerald-600 tabular-nums">{fmt(SUMMARY.grossProfit)}</span>
              </div>
            </div>
          </div>
        </section>

      </main>
    </AppShell>
  )
}
