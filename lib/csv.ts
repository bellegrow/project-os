import { getProjects, getAllInvoices, getAllProjectCosts, getAllEstimates } from './dataSource'
import { formatInvoiceNumber } from './utils'

const BOM = '\uFEFF'
const CRLF = '\r\n'

function escapeCell(value: string | number | undefined | null): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function toCsv(rows: (string | number | undefined | null)[][]): string {
  return rows.map((row) => row.map(escapeCell).join(',')).join(CRLF)
}

function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function todayStr(): string {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('')
}

export async function exportProjectsCsv(): Promise<void> {
  const [projects, invoices, costs, estimates] = await Promise.all([
    getProjects(),
    getAllInvoices(),
    getAllProjectCosts(),
    getAllEstimates(),
  ])

  const invoicesByProject = new Map<string, typeof invoices>()
  for (const inv of invoices) {
    const list = invoicesByProject.get(inv.projectId) ?? []
    list.push(inv)
    invoicesByProject.set(inv.projectId, list)
  }

  const costsByProject = new Map<string, typeof costs>()
  for (const cost of costs) {
    const list = costsByProject.get(cost.projectId) ?? []
    list.push(cost)
    costsByProject.set(cost.projectId, list)
  }

  const estimatesByProject = new Map<string, typeof estimates>()
  for (const est of estimates) {
    const list = estimatesByProject.get(est.projectId) ?? []
    list.push(est)
    estimatesByProject.set(est.projectId, list)
  }

  const headers = [
    '案件ID', '案件名', '顧客名', 'ステータス', '予算',
    '作成日', '更新日',
    '見積合計', '請求合計', '入金合計', '原価合計', '粗利',
  ]

  const rows: (string | number | undefined | null)[][] = [headers]

  for (const p of projects) {
    const invList = invoicesByProject.get(p.id) ?? []
    const costList = costsByProject.get(p.id) ?? []
    const estList = estimatesByProject.get(p.id) ?? []

    const estimateTotal = estList.reduce((s, e) => s + e.total, 0)
    const invoiceTotal = invList
      .filter((i) => i.status !== 'canceled')
      .reduce((s, i) => s + i.total, 0)
    const paidTotal = invList
      .filter((i) => i.status === 'paid')
      .reduce((s, i) => s + (i.paidAmount ?? i.total), 0)
    const costTotal = costList.reduce((s, c) => s + c.amount, 0)
    const hasFinancials = paidTotal > 0 || costTotal > 0
    const grossProfit = hasFinancials ? paidTotal - costTotal : ''

    rows.push([
      p.id,
      p.name,
      p.clientName,
      p.status,
      p.budget ?? '',
      p.createdAt.slice(0, 10),
      p.updatedAt.slice(0, 10),
      estimateTotal || '',
      invoiceTotal || '',
      paidTotal || '',
      costTotal || '',
      grossProfit,
    ])
  }

  downloadCsv(`projectos-projects-${todayStr()}.csv`, toCsv(rows))
}

export async function exportInvoicesCsv(): Promise<void> {
  const [invoices, projects] = await Promise.all([
    getAllInvoices(),
    getProjects(),
  ])

  const projectMap = new Map(projects.map((p) => [p.id, p]))

  const statusLabel: Record<string, string> = {
    draft: '下書き',
    sent: '送付済み',
    paid: '入金済み',
    overdue: '期限超過',
    canceled: 'キャンセル',
  }

  const headers = [
    '請求ID', '請求番号', '案件名', '顧客名', 'タイトル', 'ステータス',
    '小計', '消費税', '合計', '支払期限', '入金日', '入金額', '備考', '作成日',
  ]

  const rows: (string | number | undefined | null)[][] = [headers]

  for (const inv of invoices) {
    const project = projectMap.get(inv.projectId)
    rows.push([
      inv.id,
      formatInvoiceNumber(inv.id, inv.createdAt),
      project?.name ?? '',
      project?.clientName ?? '',
      inv.title,
      statusLabel[inv.status] ?? inv.status,
      inv.subtotal,
      inv.tax,
      inv.total,
      inv.dueDate ?? '',
      inv.paidAt ?? '',
      inv.paidAmount ?? '',
      inv.note ?? '',
      inv.createdAt.slice(0, 10),
    ])
  }

  downloadCsv(`projectos-invoices-${todayStr()}.csv`, toCsv(rows))
}

export async function exportCostsCsv(): Promise<void> {
  const [costs, projects] = await Promise.all([
    getAllProjectCosts(),
    getProjects(),
  ])

  const projectMap = new Map(projects.map((p) => [p.id, p]))

  const categoryLabel: Record<string, string> = {
    outsourcing: '外注費',
    material: '材料費',
    tool: 'ツール費',
    ad: '広告費',
    other: 'その他',
  }

  const headers = [
    '原価ID', '案件名', '顧客名', 'タイトル', 'カテゴリ', '金額', '原価日', '備考', '作成日',
  ]

  const rows: (string | number | undefined | null)[][] = [headers]

  for (const cost of costs) {
    const project = projectMap.get(cost.projectId)
    rows.push([
      cost.id,
      project?.name ?? '',
      project?.clientName ?? '',
      cost.title,
      categoryLabel[cost.category] ?? cost.category,
      cost.amount,
      cost.costDate,
      cost.note ?? '',
      cost.createdAt.slice(0, 10),
    ])
  }

  downloadCsv(`projectos-costs-${todayStr()}.csv`, toCsv(rows))
}
