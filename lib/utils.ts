import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Invoice, Task, Project, ProjectCost } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return '今日'
  if (diffDays === 1) return '昨日'
  if (diffDays < 7) return `${diffDays}日前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`
  return `${Math.floor(diffDays / 365)}年前`
}

export function daysSince(dateString: string): number {
  const date = new Date(dateString)
  const now = new Date()
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

export function getHearingPreview(memo: string): string {
  const lines = memo.split('\n').map((l) => l.trim()).filter(Boolean)
  const content = lines.find((l) => !l.endsWith('：') && !l.endsWith(':'))
  return content ?? lines[0] ?? ''
}

export function formatFullDate(dateString: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString))
}

export function formatEstimateNumber(id: string, createdAt: string): string {
  const d = new Date(createdAt)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const suffix = id.replace(/-/g, '').slice(0, 4).toUpperCase()
  return `${yyyy}${mm}${dd}-${suffix}`
}

// dueDate (YYYY-MM-DD) を文字列のまま今日と比較することでタイムゾーン誤差を回避
export function isInvoiceOverdue(invoice: Invoice): boolean {
  if (!invoice.dueDate) return false
  if (invoice.status === 'paid' || invoice.status === 'canceled') return false
  const t = new Date()
  const todayStr = [
    t.getFullYear(),
    String(t.getMonth() + 1).padStart(2, '0'),
    String(t.getDate()).padStart(2, '0'),
  ].join('-')
  return invoice.dueDate < todayStr
}

// YYYY-MM-DD 文字列をタイムゾーン影響なしで日本語表示する
export function formatYMD(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return `${year}年${month}月${day}日`
}

export function formatInvoiceNumber(id: string, createdAt: string): string {
  const d = new Date(createdAt)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const suffix = id.replace(/-/g, '').slice(0, 4).toUpperCase()
  return `INV-${yyyy}${mm}${dd}-${suffix}`
}

export function formatContractNumber(id: string, createdAt: string): string {
  const d = new Date(createdAt)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const suffix = id.replace(/-/g, '').slice(0, 4).toUpperCase()
  return `CTR-${yyyy}${mm}${dd}-${suffix}`
}

export function getTodayStr(): string {
  const t = new Date()
  return [
    t.getFullYear(),
    String(t.getMonth() + 1).padStart(2, '0'),
    String(t.getDate()).padStart(2, '0'),
  ].join('-')
}

export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'done') return false
  return task.dueDate < getTodayStr()
}

export function isTaskDueToday(task: Task): boolean {
  if (!task.dueDate || task.status === 'done') return false
  return task.dueDate === getTodayStr()
}

// ─── 案件状況チェック ─────────────────────────────────────────

export type StatusLevel = 'ok' | 'check' | 'action'

export interface ProjectStatusCheck {
  level: StatusLevel
  reasons: string[]
}

export interface StatusCheckConfig {
  neglectedCheckDays: number
  neglectedActionDays: number
  profitRateThreshold: number
  costOnlyAsCheck: boolean
}

const DEFAULT_STATUS_CONFIG: StatusCheckConfig = {
  neglectedCheckDays: 7,
  neglectedActionDays: 14,
  profitRateThreshold: 20,
  costOnlyAsCheck: true,
}

export function checkProjectStatus(
  project: Project,
  projectInvoices: Invoice[],
  projectOverdueTasks: Task[],
  projectCosts: ProjectCost[],
  config?: Partial<StatusCheckConfig>
): ProjectStatusCheck {
  const cfg = { ...DEFAULT_STATUS_CONFIG, ...config }

  const isActive = project.status !== '完了' && project.status !== '失注'
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(project.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  const totalBilled = projectInvoices
    .filter((inv) => inv.status !== 'canceled')
    .reduce((s, inv) => s + inv.total, 0)
  const totalPaid = projectInvoices.reduce((s, inv) => s + (inv.paidAmount ?? 0), 0)
  const totalCost = projectCosts.reduce((s, c) => s + c.amount, 0)
  const revenueBase = totalPaid > 0 ? totalPaid : totalBilled
  const grossProfit = revenueBase - totalCost
  const profitRate = revenueBase > 0 ? Math.round((grossProfit / revenueBase) * 100) : null
  const costOnlyMode = revenueBase === 0 && totalCost > 0

  const hasOverdueInvoice = projectInvoices.some(isInvoiceOverdue)

  const actionReasons: string[] = []
  const checkReasons: string[] = []

  // 🔴 要対応
  if (hasOverdueInvoice) actionReasons.push('期限超過の請求書があります')
  if (isActive && daysSinceUpdate >= cfg.neglectedActionDays) actionReasons.push(`${daysSinceUpdate}日間更新がありません`)
  if (revenueBase > 0 && grossProfit < 0) actionReasons.push('粗利がマイナスです')

  // 🟡 要確認
  if (isActive && daysSinceUpdate >= cfg.neglectedCheckDays && daysSinceUpdate < cfg.neglectedActionDays) checkReasons.push(`${daysSinceUpdate}日間更新がありません`)
  if (projectOverdueTasks.length > 0) checkReasons.push(`期限超過タスクが${projectOverdueTasks.length}件あります`)
  if (profitRate !== null && profitRate < cfg.profitRateThreshold && grossProfit >= 0) checkReasons.push(`利益率が${profitRate}%です`)
  if (cfg.costOnlyAsCheck && costOnlyMode) checkReasons.push('売上未発生で原価が先行しています')

  if (actionReasons.length > 0) return { level: 'action', reasons: actionReasons }
  if (checkReasons.length > 0) return { level: 'check', reasons: checkReasons }
  return { level: 'ok', reasons: [] }
}
