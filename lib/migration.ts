import * as storage from './storage'
import { getSettings as getLocalSettings } from './settings'
import * as sbProjects from './supabase/projects'
import * as sbHearings from './supabase/hearings'
import * as sbCustomers from './supabase/customers'
import * as sbEstimates from './supabase/estimates'
import * as sbInvoices from './supabase/invoices'
import * as sbContracts from './supabase/contracts'
import * as sbSettings from './supabase/settings'
import * as sbTasks from './supabase/tasks'
import * as sbActivities from './supabase/activities'
import * as sbProjectCosts from './supabase/projectCosts'
import * as sbProjectFiles from './supabase/projectFiles'

export interface MigrationSummary {
  projects: number
  hearings: number
  estimates: number
  invoices: number
  contracts: number
  settings: boolean
  tasks: number
  activities: number
  costs: number
  files: number
}

export interface MigrationResult {
  success: boolean
  migrated: MigrationSummary
  errors: string[]
}

const MIGRATION_DONE_KEY = 'pos_migration_done'

export function isMigrationDone(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(MIGRATION_DONE_KEY) === 'true'
}

function markMigrationDone(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(MIGRATION_DONE_KEY, 'true')
}

export function hasLocalData(): boolean {
  if (typeof window === 'undefined') return false
  return storage.getProjects().length > 0
}

export function getLocalSummary(): MigrationSummary {
  if (typeof window === 'undefined') {
    return {
      projects: 0, hearings: 0, estimates: 0, invoices: 0, contracts: 0, settings: false,
      tasks: 0, activities: 0, costs: 0, files: 0,
    }
  }
  const settings = getLocalSettings()
  return {
    projects:   storage.getProjects().length,
    hearings:   storage.getAllHearings().length,
    estimates:  storage.getAllEstimates().length,
    invoices:   storage.getAllInvoices().length,
    contracts:  storage.getAllContracts().length,
    settings:   settings.issuerName.trim() !== '' || settings.bankName.trim() !== '',
    tasks:      storage.getAllTasks().length,
    activities: storage.getAllActivities().length,
    costs:      storage.getAllProjectCosts().length,
    files:      storage.getAllProjectFiles().length,
  }
}

export async function migrateToSupabase(): Promise<MigrationResult> {
  const errors: string[] = []
  const migrated: MigrationSummary = {
    projects: 0, hearings: 0,
    estimates: 0, invoices: 0, contracts: 0, settings: false,
    tasks: 0, activities: 0, costs: 0, files: 0,
  }

  const localProjects    = storage.getProjects()
  const localHearings    = storage.getAllHearings()
  const localEstimates   = storage.getAllEstimates()
  const localInvoices    = storage.getAllInvoices()
  const localContracts   = storage.getAllContracts()
  const localTasks       = storage.getAllTasks()
  const localActivities  = storage.getAllActivities()
  const localCosts       = storage.getAllProjectCosts()
  const localFiles       = storage.getAllProjectFiles()
  const localSettings    = getLocalSettings()

  // ── 1. 顧客（clientName → Customer） ──────────────────────────
  const clientNameToCustomerId = new Map<string, string>()
  const uniqueNames = [...new Set(localProjects.map((p) => p.clientName))]
  for (const name of uniqueNames) {
    const customer = await sbCustomers.createCustomer({ name })
    if (customer) {
      clientNameToCustomerId.set(name, customer.id)
    } else {
      errors.push(`顧客の作成に失敗: ${name}`)
    }
  }

  // ── 2. 案件 ───────────────────────────────────────────────────
  const projectIdMap = new Map<string, string>()
  // localProjectId → clientName（customer再マッピング用）
  const localProjectClientName = new Map<string, string>()
  for (const p of localProjects) {
    localProjectClientName.set(p.id, p.clientName)
    const customerId = clientNameToCustomerId.get(p.clientName)
    const created = await sbProjects.createProject({
      clientName: p.clientName,
      name: p.name,
      status: p.status,
      budget: p.budget,
      customerId,
    })
    if (created) {
      projectIdMap.set(p.id, created.id)
      migrated.projects++
    } else {
      errors.push(`案件の作成に失敗: ${p.name}`)
    }
  }

  // ── 3. ヒアリング ──────────────────────────────────────────────
  for (const h of localHearings) {
    const newProjectId = projectIdMap.get(h.projectId)
    if (!newProjectId) continue
    const created = await sbHearings.createHearing({
      projectId: newProjectId,
      date: h.date,
      memo: h.memo,
    })
    if (created) {
      migrated.hearings++
    } else {
      errors.push(`ヒアリングの移行に失敗: ${h.id}`)
    }
  }

  // ── 4. 見積書（明細含む） ─────────────────────────────────────
  const estimateIdMap = new Map<string, string>()
  for (const est of localEstimates) {
    const newProjectId = projectIdMap.get(est.projectId)
    if (!newProjectId) {
      errors.push(`見積書のスキップ（案件未移行）: ${est.title}`)
      continue
    }
    try {
      const created = await sbEstimates.createEstimate({
        projectId: newProjectId,
        title: est.title,
        status: est.status,
        note: est.note,
        items: est.items.map((item) => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          sortOrder: item.sortOrder,
        })),
      })
      if (created) {
        estimateIdMap.set(est.id, created.id)
        migrated.estimates++
      } else {
        errors.push(`見積書の移行に失敗: ${est.title}`)
      }
    } catch {
      errors.push(`見積書の移行に失敗（例外）: ${est.title}`)
    }
  }

  // ── 5. 請求書（明細含む） ─────────────────────────────────────
  const invoiceIdMap = new Map<string, string>()
  for (const inv of localInvoices) {
    const newProjectId = projectIdMap.get(inv.projectId)
    if (!newProjectId) {
      errors.push(`請求書のスキップ（案件未移行）: ${inv.title}`)
      continue
    }
    try {
      const created = await sbInvoices.createInvoice({
        projectId: newProjectId,
        estimateId: inv.estimateId ? (estimateIdMap.get(inv.estimateId) ?? undefined) : undefined,
        title: inv.title,
        status: inv.status,
        dueDate: inv.dueDate,
        note: inv.note,
        items: inv.items.map((item) => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          sortOrder: item.sortOrder,
        })),
      })
      if (created) {
        invoiceIdMap.set(inv.id, created.id)
        migrated.invoices++
      } else {
        errors.push(`請求書の移行に失敗: ${inv.title}`)
      }
    } catch {
      errors.push(`請求書の移行に失敗（例外）: ${inv.title}`)
    }
  }

  // ── 6. 契約 ───────────────────────────────────────────────────
  for (const con of localContracts) {
    const newProjectId = projectIdMap.get(con.projectId)
    if (!newProjectId) {
      errors.push(`契約のスキップ（案件未移行）: ${con.title}`)
      continue
    }
    const created = await sbContracts.createContract({
      projectId: newProjectId,
      estimateId: con.estimateId ? (estimateIdMap.get(con.estimateId) ?? undefined) : undefined,
      invoiceId:  con.invoiceId  ? (invoiceIdMap.get(con.invoiceId)   ?? undefined) : undefined,
      title: con.title,
      status: con.status,
      contractDate: con.contractDate,
      startDate: con.startDate,
      endDate: con.endDate,
      amount: con.amount,
      note: con.note,
    })
    if (created) {
      migrated.contracts++
    } else {
      errors.push(`契約の移行に失敗: ${con.title}`)
    }
  }

  // ── 7. 設定 ───────────────────────────────────────────────────
  if (localSettings.issuerName.trim() !== '' || localSettings.bankName.trim() !== '') {
    try {
      await sbSettings.saveSettings(localSettings)
      migrated.settings = true
    } catch {
      errors.push('事業者設定の移行に失敗しました')
    }
  }

  // ── 8. タスク ─────────────────────────────────────────────────
  for (const task of localTasks) {
    const newProjectId = projectIdMap.get(task.projectId)
    if (!newProjectId) {
      errors.push(`タスクのスキップ（案件未移行）: ${task.title}`)
      continue
    }
    const clientName = localProjectClientName.get(task.projectId)
    const newCustomerId = clientName ? clientNameToCustomerId.get(clientName) : undefined
    const created = await sbTasks.createTask({
      projectId: newProjectId,
      customerId: newCustomerId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
    })
    if (created) {
      migrated.tasks++
    } else {
      errors.push(`タスクの移行に失敗: ${task.title}`)
    }
  }

  // ── 9. 活動履歴 ──────────────────────────────────────────────
  for (const act of localActivities) {
    const newProjectId = act.projectId ? projectIdMap.get(act.projectId) : undefined
    if (act.projectId && !newProjectId) {
      errors.push(`活動履歴のスキップ（案件未移行）: ${act.title}`)
      continue
    }
    const clientName = act.projectId ? localProjectClientName.get(act.projectId) : undefined
    const newCustomerId = clientName ? clientNameToCustomerId.get(clientName) : undefined
    const created = await sbActivities.createActivity({
      projectId: newProjectId,
      customerId: newCustomerId,
      type: act.type,
      title: act.title,
      body: act.body,
      occurredAt: act.occurredAt,
    })
    if (created) {
      migrated.activities++
    } else {
      errors.push(`活動履歴の移行に失敗: ${act.title}`)
    }
  }

  // ── 10. 原価 ─────────────────────────────────────────────────
  for (const cost of localCosts) {
    const newProjectId = projectIdMap.get(cost.projectId)
    if (!newProjectId) {
      errors.push(`原価のスキップ（案件未移行）: ${cost.title}`)
      continue
    }
    const clientName = localProjectClientName.get(cost.projectId)
    const newCustomerId = clientName ? clientNameToCustomerId.get(clientName) : undefined
    const created = await sbProjectCosts.createProjectCost({
      projectId: newProjectId,
      customerId: newCustomerId,
      title: cost.title,
      category: cost.category,
      amount: cost.amount,
      note: cost.note,
      costDate: cost.costDate,
    })
    if (created) {
      migrated.costs++
    } else {
      errors.push(`原価の移行に失敗: ${cost.title}`)
    }
  }

  // ── 11. ファイルメタデータ ────────────────────────────────────
  // ファイル本体（storagePath）は移行できないため、externalUrlのみ対象とする
  for (const file of localFiles) {
    const newProjectId = projectIdMap.get(file.projectId)
    if (!newProjectId) {
      errors.push(`ファイルのスキップ（案件未移行）: ${file.name}`)
      continue
    }
    if (file.storagePath && !file.externalUrl) {
      errors.push(`ファイルのスキップ（Storageファイルは本体移行未対応）: ${file.name}`)
      continue
    }
    const clientName = localProjectClientName.get(file.projectId)
    const newCustomerId = clientName ? clientNameToCustomerId.get(clientName) : undefined
    const created = await sbProjectFiles.createProjectFile({
      projectId: newProjectId,
      customerId: newCustomerId,
      name: file.name,
      category: file.category,
      externalUrl: file.externalUrl,
      note: file.note,
    })
    if (created) {
      migrated.files++
    } else {
      errors.push(`ファイルの移行に失敗: ${file.name}`)
    }
  }

  if (errors.length === 0) {
    markMigrationDone()
  }

  return { success: errors.length === 0, migrated, errors }
}

export function clearLocalData(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('pos_projects')
  localStorage.removeItem('pos_hearings')
  localStorage.removeItem('pos_estimates')
  localStorage.removeItem('pos_invoices')
  localStorage.removeItem('pos_contracts')
  localStorage.removeItem('pos_settings')
  localStorage.removeItem('pos_tasks')
  localStorage.removeItem('pos_activities')
  localStorage.removeItem('pos_project_costs')
  localStorage.removeItem('pos_project_files')
  // 移行フラグは残す（再移行ブロックを維持するため）
}
