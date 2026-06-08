'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Clock, ListTodo, TrendingUp } from 'lucide-react'
import AppShell from '@/components/AppShell'
import MigrationBanner from '@/components/MigrationBanner'
import { getProjects, getAllInvoices, getTodayTasks, getOverdueTasks, getAllProjectCosts } from '@/lib/dataSource'
import { formatCurrency, isInvoiceOverdue, formatYMD, checkProjectStatus, StatusCheckConfig } from '@/lib/utils'
import { getSettings } from '@/lib/settingsSource'
import { Project, Invoice, ProjectStatus, Task, ProjectCost } from '@/lib/types'
import ActivityFeed from '@/components/ActivityFeed'
import ProjectStatusBadge from '@/components/ProjectStatusBadge'

const STATUS_CLS: Record<ProjectStatus, string> = {
  商談中: 'bg-amber-100 text-amber-700',
  提案済: 'bg-blue-100 text-blue-700',
  受注: 'bg-emerald-100 text-emerald-700',
  進行中: 'bg-violet-100 text-violet-700',
  完了: 'bg-gray-100 text-gray-600',
  失注: 'bg-red-100 text-red-600',
}

const PRIORITY_CLS = (p: Task['priority']) =>
  p === 'high' ? 'bg-red-100 text-red-600' : p === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'

const PRIORITY_LABEL = (p: Task['priority']) =>
  p === 'high' ? '高' : p === 'medium' ? '中' : '低'

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])
  const [allCosts, setAllCosts] = useState<ProjectCost[]>([])
  const [statusConfig, setStatusConfig] = useState<Partial<StatusCheckConfig>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    Promise.all([
      getProjects(), getAllInvoices(), getTodayTasks(), getOverdueTasks(), getAllProjectCosts(), getSettings(),
    ]).then(([ps, invs, today, overdue, costs, settings]) => {
      setProjects(ps)
      setInvoices(invs)
      setTodayTasks(today)
      setOverdueTasks(overdue)
      setAllCosts(costs)
      setStatusConfig({
        neglectedCheckDays: settings.neglectedCheckDays,
        neglectedActionDays: settings.neglectedActionDays,
        profitRateThreshold: settings.profitRateThreshold,
        costOnlyAsCheck: settings.costOnlyAsCheck,
      })
    })
  }, [])

  if (!mounted) return null

  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth() + 1

  // ─── 集計 ─────────────────────────────────────────────────

  const activeProjects = projects.filter(p => p.status !== '完了' && p.status !== '失注')

  const neglectedThresholdDays = statusConfig.neglectedCheckDays ?? 7
  const neglectedCutoff = Date.now() - neglectedThresholdDays * 24 * 60 * 60 * 1000
  const neglectedProjects = projects.filter(p =>
    (p.status === '商談中' || p.status === '提案済') &&
    new Date(p.updatedAt).getTime() < neglectedCutoff
  )

  const overdueInvoices = invoices.filter(isInvoiceOverdue)

  const thisMonthBilled = invoices
    .filter(inv => {
      if (inv.status === 'canceled') return false
      const d = new Date(inv.createdAt)
      return d.getFullYear() === thisYear && d.getMonth() + 1 === thisMonth
    })
    .reduce((sum, inv) => sum + inv.total, 0)

  const thisMonthPaid = invoices
    .filter(inv => { if (!inv.paidAt) return false; const [y, m] = inv.paidAt.split('-').map(Number); return y === thisYear && m === thisMonth })
    .reduce((sum, inv) => sum + (inv.paidAmount ?? inv.total), 0)

  const thisMonthCost = allCosts
    .filter(c => { const [y, m] = c.costDate.split('-').map(Number); return y === thisYear && m === thisMonth })
    .reduce((sum, c) => sum + c.amount, 0)

  const thisMonthGrossProfit = thisMonthPaid - thisMonthCost
  const thisMonthProfitRate = thisMonthPaid > 0 ? Math.round((thisMonthGrossProfit / thisMonthPaid) * 100) : null
  const thisMonthCostOnly = thisMonthPaid === 0 && thisMonthCost > 0

  const unpaidAmount = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total, 0)

  const projectMap = new Map(projects.map(p => [p.id, p]))

  // 案件別収益ランキング
  const invoicesByProject = new Map<string, Invoice[]>()
  invoices.forEach(inv => {
    const arr = invoicesByProject.get(inv.projectId) ?? []
    arr.push(inv)
    invoicesByProject.set(inv.projectId, arr)
  })
  const costsByProject = new Map<string, ProjectCost[]>()
  allCosts.forEach(c => {
    const arr = costsByProject.get(c.projectId) ?? []
    arr.push(c)
    costsByProject.set(c.projectId, arr)
  })
  const overdueTasksByProject = new Map<string, Task[]>()
  overdueTasks.forEach(t => {
    const arr = overdueTasksByProject.get(t.projectId) ?? []
    arr.push(t)
    overdueTasksByProject.set(t.projectId, arr)
  })

  type ProjectRevenue = {
    project: Project
    totalPaid: number
    totalCost: number
    grossProfit: number
    profitRate: number | null
    revenueBase: number
  }

  const projectRevenues: ProjectRevenue[] = projects
    .map(p => {
      const invs = invoicesByProject.get(p.id) ?? []
      const cs = costsByProject.get(p.id) ?? []
      const totalBilled = invs.filter(inv => inv.status !== 'canceled').reduce((sum, inv) => sum + inv.total, 0)
      const totalPaid = invs.reduce((sum, inv) => sum + (inv.paidAmount ?? 0), 0)
      const totalCost = cs.reduce((sum, c) => sum + c.amount, 0)
      const revenueBase = totalPaid > 0 ? totalPaid : totalBilled
      const grossProfit = revenueBase - totalCost
      const profitRate = revenueBase > 0 ? Math.round((grossProfit / revenueBase) * 100) : null
      return { project: p, totalPaid, totalCost, grossProfit, profitRate, revenueBase }
    })
    .filter(r => r.revenueBase > 0)
    .sort((a, b) => b.grossProfit - a.grossProfit)
    .slice(0, 5)

  const hasTodayActions =
    overdueTasks.length > 0 || todayTasks.length > 0 ||
    neglectedProjects.length > 0 || overdueInvoices.length > 0

  type ActionProject = { project: Project; reasons: string[] }
  const actionProjects: ActionProject[] = activeProjects
    .map(p => {
      const sc = checkProjectStatus(
        p,
        invoicesByProject.get(p.id) ?? [],
        overdueTasksByProject.get(p.id) ?? [],
        costsByProject.get(p.id) ?? [],
        statusConfig,
      )
      return { project: p, level: sc.level, reasons: sc.reasons }
    })
    .filter(r => r.level === 'action')
    .map(r => ({ project: r.project, reasons: r.reasons }))

  const hasFinancialData = projects.length > 0 || invoices.length > 0

  // ─── UI ───────────────────────────────────────────────────

  return (
    <AppShell>
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6 lg:px-8">

        <MigrationBanner onMigrated={async () => {
          const [ps, invs] = await Promise.all([getProjects(), getAllInvoices()])
          setProjects(ps)
          setInvoices(invs)
        }} />

        {/* ── 1. 今日やること ─────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">今日やること</h2>
            <Link href="/tasks" className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
              タスクをすべて見る →
            </Link>
          </div>
          {!hasTodayActions ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
              <p className="text-sm text-gray-400">今日の緊急案件はありません</p>
            </div>
          ) : (
            <div className="space-y-3">

              {/* 期限超過タスク */}
              {overdueTasks.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-600 mb-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    期限超過タスク（{overdueTasks.length}件）
                  </p>
                  <div className="bg-white border border-red-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                    {overdueTasks.slice(0, 3).map(task => {
                      const project = projectMap.get(task.projectId)
                      return (
                        <Link key={task.id} href={`/projects/${task.projectId}`}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 truncate">{project?.clientName ?? '—'} / {project?.name ?? '—'}</p>
                            <p className="text-sm font-medium text-red-700 truncate">{task.title}</p>
                            {task.dueDate && <p className="text-xs text-red-400">期限 {formatYMD(task.dueDate)}</p>}
                          </div>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded shrink-0 ${PRIORITY_CLS(task.priority)}`}>
                            {PRIORITY_LABEL(task.priority)}
                          </span>
                        </Link>
                      )
                    })}
                    {overdueTasks.length > 3 && (
                      <p className="text-xs text-gray-400 px-4 py-2">他 {overdueTasks.length - 3} 件</p>
                    )}
                  </div>
                </div>
              )}

              {/* 今日のタスク */}
              {todayTasks.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-blue-600 mb-1.5 flex items-center gap-1">
                    <ListTodo className="w-3 h-3" />
                    今日のタスク（{todayTasks.length}件）
                  </p>
                  <div className="bg-white border border-blue-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                    {todayTasks.slice(0, 3).map(task => {
                      const project = projectMap.get(task.projectId)
                      return (
                        <Link key={task.id} href={`/projects/${task.projectId}`}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 truncate">{project?.clientName ?? '—'} / {project?.name ?? '—'}</p>
                            <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                          </div>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded shrink-0 ${PRIORITY_CLS(task.priority)}`}>
                            {PRIORITY_LABEL(task.priority)}
                          </span>
                        </Link>
                      )
                    })}
                    {todayTasks.length > 3 && (
                      <p className="text-xs text-gray-400 px-4 py-2">他 {todayTasks.length - 3} 件</p>
                    )}
                  </div>
                </div>
              )}

              {/* 放置案件 */}
              {neglectedProjects.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-600 mb-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    放置案件（{neglectedProjects.length}件 / {neglectedThresholdDays}日以上更新なし）
                  </p>
                  <div className="bg-white border border-amber-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                    {neglectedProjects.slice(0, 3).map(p => {
                      const daysSince = Math.floor((Date.now() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
                      return (
                        <Link key={p.id} href={`/projects/${p.id}`}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 truncate">{p.clientName}</p>
                            <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                          </div>
                          <span className="text-xs font-medium text-amber-600 shrink-0 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {daysSince}日放置
                          </span>
                        </Link>
                      )
                    })}
                    {neglectedProjects.length > 3 && (
                      <p className="text-xs text-gray-400 px-4 py-2">他 {neglectedProjects.length - 3} 件</p>
                    )}
                  </div>
                </div>
              )}

              {/* 期限超過請求 */}
              {overdueInvoices.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-600 mb-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    期限超過請求（{overdueInvoices.length}件）
                  </p>
                  <div className="bg-white border border-red-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                    {overdueInvoices.slice(0, 3).map(inv => {
                      const project = projectMap.get(inv.projectId)
                      return (
                        <Link key={inv.id} href={`/projects/${inv.projectId}`}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 truncate">{project?.clientName ?? '—'}</p>
                            <p className="text-sm font-medium text-gray-900 truncate">{inv.title}</p>
                            {inv.dueDate && <p className="text-xs text-red-500">期限 {formatYMD(inv.dueDate)}</p>}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 shrink-0">{formatCurrency(inv.total)}</p>
                        </Link>
                      )
                    })}
                    {overdueInvoices.length > 3 && (
                      <p className="text-xs text-gray-400 px-4 py-2">他 {overdueInvoices.length - 3} 件</p>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
        </section>

        {/* ── 1.5 要対応案件 ──────────────────────────────── */}
        {actionProjects.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">要対応案件</h2>
            <div className="bg-white border border-red-100 rounded-xl overflow-hidden divide-y divide-gray-100">
              {actionProjects.map(({ project: p, reasons }) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-red-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 truncate">{p.clientName}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    {reasons.length > 0 && (
                      <p className="text-xs text-red-500 mt-0.5 line-clamp-1">{reasons[0]}</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium shrink-0 px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5 ${STATUS_CLS[p.status]}`}>
                    {p.status}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── 2. お金の状況 ───────────────────────────────── */}
        {hasFinancialData && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">お金の状況</h2>
            <div className="grid grid-cols-2 gap-2">

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">今月の請求額</p>
                <p className="text-lg font-bold text-gray-900 leading-tight">{formatCurrency(thisMonthBilled)}</p>
                <p className="text-xs text-gray-400 mt-1">{thisYear}年{thisMonth}月</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">今月の入金額</p>
                <p className={`text-lg font-bold leading-tight ${thisMonthPaid > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                  {formatCurrency(thisMonthPaid)}
                </p>
                <p className="text-xs text-gray-400 mt-1">{thisYear}年{thisMonth}月</p>
              </div>

              <div className={`bg-white border rounded-xl p-4 ${unpaidAmount > 0 ? 'border-orange-200' : 'border-gray-200'}`}>
                <p className="text-xs text-gray-500 mb-1">未入金残高</p>
                <p className={`text-lg font-bold leading-tight ${unpaidAmount > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
                  {formatCurrency(unpaidAmount)}
                </p>
                <p className="text-xs text-gray-400 mt-1">送付済み未収金</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">今月の原価</p>
                <p className={`text-lg font-bold leading-tight ${thisMonthCost > 0 ? 'text-rose-600' : 'text-gray-300'}`}>
                  {formatCurrency(thisMonthCost)}
                </p>
                <p className="text-xs text-gray-400 mt-1">{thisYear}年{thisMonth}月</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 col-span-2">
                <p className="text-xs text-gray-500 mb-1">
                  今月の粗利
                  {!thisMonthCostOnly && thisMonthProfitRate !== null && (
                    <span className={`ml-1.5 font-semibold ${thisMonthGrossProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {thisMonthProfitRate}%
                    </span>
                  )}
                </p>
                {thisMonthCostOnly ? (
                  <p className="text-lg font-bold leading-tight text-amber-600">原価先行</p>
                ) : (
                  <p className={`text-lg font-bold leading-tight ${thisMonthGrossProfit > 0 ? 'text-emerald-600' : thisMonthGrossProfit < 0 ? 'text-red-500' : 'text-gray-300'}`}>
                    {formatCurrency(thisMonthGrossProfit)}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">入金合計 − 原価合計</p>
              </div>

            </div>
          </section>
        )}

        {/* ── 3. 案件別収益ランキング ─────────────────────── */}
        {projectRevenues.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-gray-700">案件別粗利ランキング</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
              {projectRevenues.map((r, i) => (
                <Link
                  key={r.project.id}
                  href={`/projects/${r.project.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <span className={`text-sm font-bold w-5 shrink-0 tabular-nums ${i === 0 ? 'text-amber-500' : 'text-gray-300'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 truncate">{r.project.clientName}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{r.project.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400">入金 {formatCurrency(r.totalPaid)}</span>
                      {r.totalCost > 0 && (
                        <span className="text-xs text-rose-500">原価 {formatCurrency(r.totalCost)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${r.grossProfit > 0 ? 'text-emerald-600' : r.grossProfit < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {formatCurrency(r.grossProfit)}
                    </p>
                    {r.profitRate !== null && (
                      <p className={`text-xs ${r.grossProfit >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                        {r.profitRate}%
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── 4. 最近の活動 ───────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">最近の活動</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <ActivityFeed limit={5} />
          </div>
        </section>

        {/* ── 5. 案件状況 ─────────────────────────────────── */}
        {activeProjects.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">案件状況</h2>
              <Link href="/projects" className="text-xs text-blue-600 hover:text-blue-700 transition-colors">
                すべて見る →
              </Link>
            </div>
            <div className="space-y-1.5">
              {activeProjects.slice(0, 5).map(p => {
                const sc = checkProjectStatus(
                  p,
                  invoicesByProject.get(p.id) ?? [],
                  overdueTasksByProject.get(p.id) ?? [],
                  costsByProject.get(p.id) ?? [],
                  statusConfig,
                )
                return (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-400 truncate">{p.clientName}</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {sc.level !== 'ok' && <ProjectStatusBadge check={sc} />}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_CLS[p.status]}`}>
                        {p.status}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

      </main>
    </AppShell>
  )
}
