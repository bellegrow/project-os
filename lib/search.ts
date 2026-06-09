import { SearchResult, SearchResultType } from './types'
import { formatEstimateNumber, formatInvoiceNumber, formatContractNumber, formatCurrency } from './utils'
import { searchDemoData } from './demoData'
import {
  getProjects,
  getCustomers,
  getAllHearings,
  getAllEstimates,
  getAllInvoices,
  getAllContracts,
  getAllTasks,
  getAllActivities,
  getAllProjectFiles,
  getAllProjectCosts,
} from './dataSource'

const MAX_RESULTS = 50

function matches(q: string, ...fields: (string | undefined | null)[]): boolean {
  return fields.some((f) => f && f.toLowerCase().includes(q))
}

function excerpt(q: string, text: string, maxLen = 80): string {
  const i = text.toLowerCase().indexOf(q)
  if (i === -1) return text.slice(0, maxLen) + (text.length > maxLen ? '…' : '')
  const start = Math.max(0, i - 20)
  const end = Math.min(text.length, i + q.length + 40)
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
}

// 金額 → 検索可能文字列（「500000」と「500,000」の両方）
function amountStr(amount: number | undefined | null): string[] {
  if (amount == null) return []
  return [String(amount), amount.toLocaleString('ja-JP')]
}

const TYPE_ORDER: Record<SearchResultType, number> = {
  project: 0,
  customer: 1,
  task: 2,
  estimate: 3,
  invoice: 4,
  contract: 5,
  hearing: 6,
  activity: 7,
  meeting: 7,
  cost: 8,
  file: 9,
  contact: 10,
}

export async function searchAll(query: string): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const [
    projects,
    customers,
    hearings,
    estimates,
    invoices,
    contracts,
    tasks,
    activities,
    files,
    costs,
  ] = await Promise.all([
    getProjects(),
    getCustomers(),
    getAllHearings(),
    getAllEstimates(),
    getAllInvoices(),
    getAllContracts(),
    getAllTasks(),
    getAllActivities(),
    getAllProjectFiles(),
    getAllProjectCosts(),
  ])

  const projectNameMap = new Map(projects.map((p) => [p.id, p.name]))
  const customerNameMap = new Map(customers.map((c) => [c.id, c.name]))

  const results: SearchResult[] = []

  // Projects
  for (const p of projects) {
    if (matches(q, p.name, p.clientName)) {
      results.push({
        id: p.id,
        type: 'project',
        title: p.name,
        subtitle: p.clientName,
        href: `/projects/${p.id}`,
        createdAt: p.createdAt,
      })
    }
  }

  // Customers (cloud-only — empty array in local mode)
  for (const c of customers) {
    if (matches(q, c.name, c.industry, c.notes)) {
      results.push({
        id: c.id,
        type: 'customer',
        title: c.name,
        subtitle: c.industry,
        snippet: c.notes && matches(q, c.notes) ? excerpt(q, c.notes) : undefined,
        href: `/customers/${c.id}`,
        createdAt: c.createdAt,
        customerId: c.id,
      })
    }
  }

  // Hearings
  for (const h of hearings) {
    if (matches(q, h.memo)) {
      const projName = projectNameMap.get(h.projectId)
      results.push({
        id: h.id,
        type: 'hearing',
        title: h.date ? `${h.date} の打ち合わせメモ` : '打ち合わせメモ',
        subtitle: projName,
        snippet: excerpt(q, h.memo),
        href: `/projects/${h.projectId}`,
        createdAt: h.createdAt,
        projectId: h.projectId,
      })
    }
  }

  // Estimates（番号・金額・明細金額も検索対象）
  for (const e of estimates) {
    const estNum = formatEstimateNumber(e.id, e.createdAt)
    const itemMatch = e.items.some((item) =>
      matches(q, item.name, item.description, ...amountStr(item.amount), ...amountStr(item.unitPrice))
    )
    if (matches(q, e.title, e.note, estNum, ...amountStr(e.total), ...amountStr(e.subtotal)) || itemMatch) {
      const projName = projectNameMap.get(e.projectId)
      const subtitle = [projName, estNum, formatCurrency(e.total)].filter(Boolean).join(' · ')
      results.push({
        id: e.id,
        type: 'estimate',
        title: e.title,
        subtitle,
        snippet: e.note && matches(q, e.note) ? excerpt(q, e.note) : undefined,
        href: `/projects/${e.projectId}`,
        createdAt: e.createdAt,
        projectId: e.projectId,
        customerId: e.customerId,
      })
    }
  }

  // Invoices（番号・金額・明細金額も検索対象）
  for (const inv of invoices) {
    const invNum = formatInvoiceNumber(inv.id, inv.createdAt)
    const itemMatch = inv.items.some((item) =>
      matches(q, item.name, item.description, ...amountStr(item.amount), ...amountStr(item.unitPrice))
    )
    if (matches(q, inv.title, inv.note, invNum, ...amountStr(inv.total), ...amountStr(inv.subtotal)) || itemMatch) {
      const projName = projectNameMap.get(inv.projectId)
      const subtitle = [projName, invNum, formatCurrency(inv.total)].filter(Boolean).join(' · ')
      results.push({
        id: inv.id,
        type: 'invoice',
        title: inv.title,
        subtitle,
        snippet: inv.note && matches(q, inv.note) ? excerpt(q, inv.note) : undefined,
        href: `/projects/${inv.projectId}`,
        createdAt: inv.createdAt,
        projectId: inv.projectId,
        customerId: inv.customerId,
      })
    }
  }

  // Contracts（番号・金額も検索対象）
  for (const con of contracts) {
    const ctrNum = formatContractNumber(con.id, con.createdAt)
    if (matches(q, con.title, con.note, ctrNum, ...amountStr(con.amount))) {
      const projName = projectNameMap.get(con.projectId)
      const subtitle = [
        projName,
        ctrNum,
        con.amount != null ? formatCurrency(con.amount) : undefined,
      ].filter(Boolean).join(' · ')
      results.push({
        id: con.id,
        type: 'contract',
        title: con.title,
        subtitle,
        snippet: con.note && matches(q, con.note) ? excerpt(q, con.note) : undefined,
        href: `/projects/${con.projectId}`,
        createdAt: con.createdAt,
        projectId: con.projectId,
        customerId: con.customerId,
      })
    }
  }

  // Tasks
  for (const t of tasks) {
    if (matches(q, t.title, t.description)) {
      results.push({
        id: t.id,
        type: 'task',
        title: t.title,
        subtitle: projectNameMap.get(t.projectId),
        snippet: t.description && matches(q, t.description) ? excerpt(q, t.description) : undefined,
        href: `/projects/${t.projectId}`,
        createdAt: t.createdAt,
        projectId: t.projectId,
        customerId: t.customerId,
      })
    }
  }

  // Activities — title は全 type 検索対象、body は note / meeting のみ
  for (const a of activities) {
    const titleMatches = matches(q, a.title)
    const bodyMatches = (a.type === 'note' || a.type === 'meeting') && !!a.body && matches(q, a.body)
    if (!titleMatches && !bodyMatches) continue
    const projName = a.projectId ? projectNameMap.get(a.projectId) : undefined
    const custName = a.customerId ? customerNameMap.get(a.customerId) : undefined
    const href = a.projectId
      ? `/projects/${a.projectId}`
      : a.customerId ? `/customers/${a.customerId}` : '/dashboard'
    results.push({
      id: a.id,
      type: a.type === 'meeting' ? 'meeting' : 'activity',
      title: a.title,
      subtitle: projName ?? custName,
      snippet: bodyMatches ? excerpt(q, a.body!) : undefined,
      href,
      createdAt: a.createdAt,
      projectId: a.projectId,
      customerId: a.customerId,
    })
  }

  // Costs（金額も検索対象）
  for (const c of costs) {
    if (matches(q, c.title, c.note, ...amountStr(c.amount))) {
      const projName = projectNameMap.get(c.projectId)
      results.push({
        id: c.id,
        type: 'cost',
        title: c.title,
        subtitle: [projName, formatCurrency(c.amount)].filter(Boolean).join(' · '),
        snippet: c.note && matches(q, c.note) ? excerpt(q, c.note) : undefined,
        href: `/projects/${c.projectId}`,
        createdAt: c.createdAt,
        projectId: c.projectId,
        customerId: c.customerId,
      })
    }
  }

  // Files（externalUrl・fileType も検索対象）
  for (const f of files) {
    if (matches(q, f.name, f.note, f.externalUrl, f.fileType)) {
      results.push({
        id: f.id,
        type: 'file',
        title: f.name,
        subtitle: projectNameMap.get(f.projectId),
        snippet: f.note && matches(q, f.note) ? excerpt(q, f.note) : undefined,
        href: `/projects/${f.projectId}`,
        createdAt: f.createdAt,
        projectId: f.projectId,
        customerId: f.customerId,
      })
    }
  }

  // Demo fallback: if no real data exists, search demo data
  const isNoRealData = projects.length === 0 && customers.length === 0 && hearings.length === 0
  if (isNoRealData) {
    results.push(...searchDemoData(query))
  }

  results.sort((a, b) => {
    const typeDiff = TYPE_ORDER[a.type] - TYPE_ORDER[b.type]
    if (typeDiff !== 0) return typeDiff
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return results.slice(0, MAX_RESULTS)
}
