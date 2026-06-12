import { createCustomer, createProject, getCustomers } from './dataSource'
import { ProjectStatus } from './types'

// ─── CSV パーサー ────────────────────────────────────────────────

export function parseCSV(text: string): string[][] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const rows: string[][] = []
  let i = 0

  while (i < normalized.length) {
    const row: string[] = []
    while (i < normalized.length && normalized[i] !== '\n') {
      if (normalized[i] === '"') {
        i++
        let cell = ''
        while (i < normalized.length) {
          if (normalized[i] === '"' && normalized[i + 1] === '"') {
            cell += '"'
            i += 2
          } else if (normalized[i] === '"') {
            i++
            break
          } else {
            cell += normalized[i++]
          }
        }
        row.push(cell)
        if (normalized[i] === ',') i++
      } else {
        let cell = ''
        while (i < normalized.length && normalized[i] !== ',' && normalized[i] !== '\n') {
          cell += normalized[i++]
        }
        row.push(cell.trim())
        if (normalized[i] === ',') i++
      }
    }
    if (normalized[i] === '\n') i++
    if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
      rows.push(row)
    }
  }

  return rows
}

// ─── サンプルCSV生成 ─────────────────────────────────────────────

const BOM = '﻿'
const CRLF = '\r\n'

function downloadCsv(filename: string, csv: string) {
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

export function downloadCustomerSampleCSV() {
  const rows = [
    ['顧客名', '業種', 'Webサイト', '備考'],
    ['株式会社サンプル', 'IT・ソフトウェア', 'https://example.com', '担当：山田さん'],
    ['有限会社テスト商事', '製造業', '', ''],
  ]
  const csv = rows.map(r => r.map(c => c.includes(',') ? `"${c}"` : c).join(',')).join(CRLF)
  downloadCsv('customers_sample.csv', csv)
}

export function downloadProjectSampleCSV() {
  const rows = [
    ['案件名', '顧客名', 'ステータス', '概算予算'],
    ['Webサイトリニューアル', '株式会社サンプル', '商談中', '1500000'],
    ['システム開発', '有限会社テスト商事', '進行中', '3000000'],
    ['LP制作', '株式会社サンプル', '受注', ''],
  ]
  const csv = rows.map(r => r.map(c => c.includes(',') ? `"${c}"` : c).join(',')).join(CRLF)
  downloadCsv('projects_sample.csv', csv)
}

// ─── 顧客インポート ──────────────────────────────────────────────

export interface CustomerImportRow {
  name: string
  industry: string
  website: string
  notes: string
  error?: string
}

export function validateCustomerRows(rows: string[][]): CustomerImportRow[] {
  const [header, ...data] = rows
  if (!header) return []

  const col = (name: string) => header.findIndex(h => h.replace(/\s/g, '') === name.replace(/\s/g, ''))
  const nameIdx    = col('顧客名')
  const industryIdx = col('業種')
  const websiteIdx = col('Webサイト')
  const notesIdx   = col('備考')

  if (nameIdx === -1) {
    return [{ name: '', industry: '', website: '', notes: '', error: '「顧客名」列が見つかりません' }]
  }

  return data.map(row => {
    const name = row[nameIdx]?.trim() ?? ''
    return {
      name,
      industry: industryIdx >= 0 ? (row[industryIdx]?.trim() ?? '') : '',
      website:  websiteIdx >= 0  ? (row[websiteIdx]?.trim() ?? '')  : '',
      notes:    notesIdx >= 0    ? (row[notesIdx]?.trim() ?? '')    : '',
      error:    name ? undefined : '顧客名が空です',
    }
  }).filter(r => r.name || r.error)
}

export async function importCustomers(
  rows: CustomerImportRow[],
  onProgress?: (done: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0
  const valid = rows.filter(r => !r.error)

  for (let i = 0; i < valid.length; i++) {
    const r = valid[i]
    try {
      const result = await createCustomer({
        name:     r.name,
        industry: r.industry || undefined,
        website:  r.website  || undefined,
        notes:    r.notes    || undefined,
      })
      if (result) success++
      else failed++
    } catch {
      failed++
    }
    onProgress?.(i + 1, valid.length)
  }

  return { success, failed }
}

// ─── 案件インポート ──────────────────────────────────────────────

const VALID_STATUSES: ProjectStatus[] = ['商談中', '提案済', '受注', '進行中', '完了', '失注']

export interface ProjectImportRow {
  name: string
  clientName: string
  status: ProjectStatus
  budget: number | undefined
  error?: string
}

export function validateProjectRows(rows: string[][]): ProjectImportRow[] {
  const [header, ...data] = rows
  if (!header) return []

  const col = (name: string) => header.findIndex(h => h.replace(/\s/g, '') === name.replace(/\s/g, ''))
  const nameIdx       = col('案件名')
  const clientNameIdx = col('顧客名')
  const statusIdx     = col('ステータス')
  const budgetIdx     = col('概算予算')

  if (nameIdx === -1) {
    return [{ name: '', clientName: '', status: '商談中', budget: undefined, error: '「案件名」列が見つかりません' }]
  }
  if (clientNameIdx === -1) {
    return [{ name: '', clientName: '', status: '商談中', budget: undefined, error: '「顧客名」列が見つかりません' }]
  }

  return data.map(row => {
    const name       = row[nameIdx]?.trim() ?? ''
    const clientName = clientNameIdx >= 0 ? (row[clientNameIdx]?.trim() ?? '') : ''
    const rawStatus  = statusIdx >= 0 ? row[statusIdx]?.trim() : ''
    const status: ProjectStatus = (VALID_STATUSES.includes(rawStatus as ProjectStatus)
      ? rawStatus as ProjectStatus
      : '商談中')
    const rawBudget  = budgetIdx >= 0 ? row[budgetIdx]?.replace(/[^0-9]/g, '') : ''
    const budget     = rawBudget ? parseInt(rawBudget, 10) || undefined : undefined

    let error: string | undefined
    if (!name) error = '案件名が空です'
    else if (!clientName) error = '顧客名が空です'

    return { name, clientName, status, budget, error }
  }).filter(r => r.name || r.clientName || r.error)
}

export async function importProjects(
  rows: ProjectImportRow[],
  onProgress?: (done: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0
  const valid = rows.filter(r => !r.error)

  // 既存顧客マップ（顧客名 → customerId）
  const customers = await getCustomers()
  const customerMap = new Map(customers.map(c => [c.name, c.id]))

  for (let i = 0; i < valid.length; i++) {
    const r = valid[i]
    try {
      const result = await createProject({
        name:       r.name,
        clientName: r.clientName,
        status:     r.status,
        budget:     r.budget,
        customerId: customerMap.get(r.clientName),
      })
      if (result) success++
      else failed++
    } catch {
      failed++
    }
    onProgress?.(i + 1, valid.length)
  }

  return { success, failed }
}
