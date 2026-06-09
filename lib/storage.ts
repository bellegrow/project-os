import { Project, Hearing, Estimate, EstimateItem, EstimateStatus, EstimateInput, EstimateItemInput, Invoice, InvoiceItem, InvoiceStatus, InvoiceInput, InvoiceItemInput, PaymentInput, Contract, ContractStatus, ContractInput, Activity, ActivityInput, Task, TaskInput, TaskUpdateInput, TaskStatus, ProjectCost, ProjectCostInput, ProjectCostUpdateInput, ProjectFile, ProjectFileInput, ProjectFileUpdateInput } from './types'
import { getTodayStr } from './utils'

const KEYS = {
  PROJECTS: 'pos_projects',
  HEARINGS: 'pos_hearings',
  ESTIMATES: 'pos_estimates',
  INVOICES: 'pos_invoices',
  CONTRACTS: 'pos_contracts',
  ACTIVITIES: 'pos_activities',
  TASKS: 'pos_tasks',
  PROJECT_COSTS: 'pos_project_costs',
  PROJECT_FILES: 'pos_project_files',
}

function getAll<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAll<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(items))
}

// Projects
export function getProjects(): Project[] {
  return getAll<Project>(KEYS.PROJECTS)
    .filter(p => !p.organizationId || p.organizationId === 'local')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function getProject(id: string): Project | undefined {
  return getAll<Project>(KEYS.PROJECTS).find((p) => p.id === id)
}

export function createProject(
  data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>
): Project {
  const now = new Date().toISOString()
  const project: Project = { organizationId: 'local', ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
  saveAll(KEYS.PROJECTS, [...getAll<Project>(KEYS.PROJECTS), project])
  return project
}

export function updateProjectStatus(id: string, status: Project['status']): void {
  saveAll(
    KEYS.PROJECTS,
    getAll<Project>(KEYS.PROJECTS).map((p) =>
      p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
    )
  )
}

export function updateProject(
  id: string,
  data: Partial<Pick<Project, 'clientName' | 'name' | 'budget' | 'status' | 'customerId'>>
): Project | undefined {
  const now = new Date().toISOString()
  const all = getAll<Project>(KEYS.PROJECTS).map((p) =>
    p.id === id ? { ...p, ...data, updatedAt: now } : p
  )
  saveAll(KEYS.PROJECTS, all)
  return all.find((p) => p.id === id)
}

export function deleteProject(id: string): void {
  saveAll(KEYS.PROJECTS, getAll<Project>(KEYS.PROJECTS).filter((p) => p.id !== id))
  saveAll(KEYS.HEARINGS, getAll<Hearing>(KEYS.HEARINGS).filter((h) => h.projectId !== id))
  saveAll(KEYS.ESTIMATES, getAll<Estimate>(KEYS.ESTIMATES).filter((e) => e.projectId !== id))
  saveAll(KEYS.INVOICES, getAll<Invoice>(KEYS.INVOICES).filter((i) => i.projectId !== id))
  saveAll(KEYS.CONTRACTS, getAll<Contract>(KEYS.CONTRACTS).filter((c) => c.projectId !== id))
}

export function updateHearing(id: string, memo: string, date?: string): void {
  saveAll(
    KEYS.HEARINGS,
    getAll<Hearing>(KEYS.HEARINGS).map((h) =>
      h.id === id ? { ...h, memo, ...(date !== undefined ? { date } : {}) } : h
    )
  )
}

// Hearings
export function getHearings(projectId: string): Hearing[] {
  return getAll<Hearing>(KEYS.HEARINGS)
    .filter((h) => h.projectId === projectId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function createHearing(data: Omit<Hearing, 'id' | 'createdAt'>): Hearing {
  const now = new Date().toISOString()
  const hearing: Hearing = { ...data, id: crypto.randomUUID(), createdAt: now }
  saveAll(KEYS.HEARINGS, [...getAll<Hearing>(KEYS.HEARINGS), hearing])
  // bump project updatedAt
  saveAll(
    KEYS.PROJECTS,
    getAll<Project>(KEYS.PROJECTS).map((p) =>
      p.id === data.projectId ? { ...p, updatedAt: now } : p
    )
  )
  return hearing
}

export function deleteHearing(id: string): void {
  const all = getAll<Hearing>(KEYS.HEARINGS)
  const hearing = all.find((h) => h.id === id)
  if (!hearing) return
  saveAll(KEYS.HEARINGS, all.filter((h) => h.id !== id))
  saveAll(
    KEYS.PROJECTS,
    getAll<Project>(KEYS.PROJECTS).map((p) =>
      p.id === hearing.projectId ? { ...p, updatedAt: new Date().toISOString() } : p
    )
  )
}

export function getHearingsByProjectIds(projectIds: string[]): Hearing[] {
  const set = new Set(projectIds)
  return getAll<Hearing>(KEYS.HEARINGS)
    .filter((h) => set.has(h.projectId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getAllHearings(): Hearing[] {
  return getAll<Hearing>(KEYS.HEARINGS)
}

export function getAllEstimates(): Estimate[] {
  return getAll<Estimate>(KEYS.ESTIMATES).filter(e => !e.organizationId || e.organizationId === 'local')
}

export function getAllInvoices(): Invoice[] {
  return getAll<Invoice>(KEYS.INVOICES).filter(i => !i.organizationId || i.organizationId === 'local')
}

export function getAllContracts(): Contract[] {
  return getAll<Contract>(KEYS.CONTRACTS).filter(c => !c.organizationId || c.organizationId === 'local')
}

export function getAllTasks(): Task[] {
  return getAll<Task>(KEYS.TASKS).filter(t => !t.organizationId || t.organizationId === 'local')
}

export function getAllActivities(): Activity[] {
  return getAll<Activity>(KEYS.ACTIVITIES).filter(a => !a.organizationId || a.organizationId === 'local')
}

export function getAllProjectFiles(): ProjectFile[] {
  return getAll<ProjectFile>(KEYS.PROJECT_FILES).filter(f => !f.organizationId || f.organizationId === 'local')
}

// ─── Estimates ───────────────────────────────────────────────

function buildEstimateItems(inputs: EstimateItemInput[], estimateId: string): EstimateItem[] {
  return inputs.map((item, i) => ({
    id: crypto.randomUUID(),
    estimateId,
    name: item.name,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    amount: Math.round(item.quantity * item.unitPrice),
    sortOrder: item.sortOrder ?? i + 1,
  }))
}

function computeTotals(items: EstimateItem[], taxRate = 10): { subtotal: number; tax: number; total: number } {
  const subtotal = items.reduce((sum, i) => sum + i.amount, 0)
  const tax = Math.round(subtotal * (taxRate / 100))
  return { subtotal, tax, total: subtotal + tax }
}

export function getEstimates(projectId: string): Estimate[] {
  return getAll<Estimate>(KEYS.ESTIMATES)
    .filter((e) => e.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getEstimate(id: string): Estimate | undefined {
  return getAll<Estimate>(KEYS.ESTIMATES).find((e) => e.id === id)
}

export function createEstimate(input: EstimateInput): Estimate {
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const items = buildEstimateItems(input.items, id)
  const { subtotal, tax, total } = computeTotals(items, input.taxRate)
  const estimate: Estimate = {
    id,
    organizationId: 'local',
    projectId: input.projectId,
    customerId: input.customerId,
    title: input.title,
    status: input.status ?? 'draft',
    subtotal,
    tax,
    total,
    note: input.note,
    items,
    createdAt: now,
    updatedAt: now,
  }
  saveAll(KEYS.ESTIMATES, [estimate, ...getAll<Estimate>(KEYS.ESTIMATES)])
  return estimate
}

export function seedEstimate(estimate: Estimate): void {
  const all = getAll<Estimate>(KEYS.ESTIMATES)
  if (all.find((e) => e.id === estimate.id)) return
  saveAll(KEYS.ESTIMATES, [...all, estimate])
}

export function updateEstimate(id: string, input: Partial<EstimateInput>): Estimate | undefined {
  const now = new Date().toISOString()
  const all = getAll<Estimate>(KEYS.ESTIMATES)
  const existing = all.find((e) => e.id === id)
  if (!existing) return undefined

  let updated: Estimate = { ...existing, updatedAt: now }
  if (input.title !== undefined) updated.title = input.title
  if ('note' in input) updated.note = input.note
  if (input.status !== undefined) updated.status = input.status
  if ('customerId' in input) updated.customerId = input.customerId

  if (input.items !== undefined) {
    const items = buildEstimateItems(input.items, id)
    const { subtotal, tax, total } = computeTotals(items, input.taxRate)
    updated = { ...updated, items, subtotal, tax, total }
  }

  saveAll(KEYS.ESTIMATES, all.map((e) => e.id === id ? updated : e))
  return updated
}

export function updateEstimateStatus(id: string, status: EstimateStatus): void {
  const now = new Date().toISOString()
  saveAll(
    KEYS.ESTIMATES,
    getAll<Estimate>(KEYS.ESTIMATES).map((e) =>
      e.id === id ? { ...e, status, updatedAt: now } : e
    )
  )
}

export function deleteEstimate(id: string): void {
  saveAll(KEYS.ESTIMATES, getAll<Estimate>(KEYS.ESTIMATES).filter((e) => e.id !== id))
}

// ─── Invoices ────────────────────────────────────────────────

function buildInvoiceItems(inputs: InvoiceItemInput[], invoiceId: string): InvoiceItem[] {
  return inputs.map((item, i) => ({
    id: crypto.randomUUID(),
    invoiceId,
    name: item.name,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    amount: Math.round(item.quantity * item.unitPrice),
    sortOrder: item.sortOrder ?? i + 1,
  }))
}

function computeInvoiceTotals(items: InvoiceItem[], taxRate = 10): { subtotal: number; tax: number; total: number } {
  const subtotal = items.reduce((sum, i) => sum + i.amount, 0)
  const tax = Math.round(subtotal * (taxRate / 100))
  return { subtotal, tax, total: subtotal + tax }
}

export function getInvoices(projectId: string): Invoice[] {
  return getAll<Invoice>(KEYS.INVOICES)
    .filter((i) => i.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getInvoice(id: string): Invoice | undefined {
  return getAll<Invoice>(KEYS.INVOICES).find((i) => i.id === id)
}

export function seedInvoice(invoice: Invoice): void {
  const all = getAll<Invoice>(KEYS.INVOICES)
  if (all.find((i) => i.id === invoice.id)) return
  saveAll(KEYS.INVOICES, [...all, invoice])
}

export function createInvoice(input: InvoiceInput): Invoice {
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const items = buildInvoiceItems(input.items, id)
  const { subtotal, tax, total } = computeInvoiceTotals(items, input.taxRate)
  const invoice: Invoice = {
    id,
    organizationId: 'local',
    projectId: input.projectId,
    customerId: input.customerId,
    estimateId: input.estimateId,
    title: input.title,
    status: input.status ?? 'draft',
    subtotal,
    tax,
    total,
    dueDate: input.dueDate,
    note: input.note,
    items,
    createdAt: now,
    updatedAt: now,
  }
  saveAll(KEYS.INVOICES, [invoice, ...getAll<Invoice>(KEYS.INVOICES)])
  return invoice
}

export function updateInvoice(id: string, input: Partial<InvoiceInput>): Invoice | undefined {
  const now = new Date().toISOString()
  const all = getAll<Invoice>(KEYS.INVOICES)
  const existing = all.find((i) => i.id === id)
  if (!existing) return undefined

  let updated: Invoice = { ...existing, updatedAt: now }
  if (input.title !== undefined) updated.title = input.title
  if ('note' in input) updated.note = input.note
  if (input.status !== undefined) updated.status = input.status
  if ('customerId' in input) updated.customerId = input.customerId
  if ('estimateId' in input) updated.estimateId = input.estimateId
  if ('dueDate' in input) updated.dueDate = input.dueDate

  if (input.items !== undefined) {
    const items = buildInvoiceItems(input.items, id)
    const { subtotal, tax, total } = computeInvoiceTotals(items, input.taxRate)
    updated = { ...updated, items, subtotal, tax, total }
  }

  saveAll(KEYS.INVOICES, all.map((i) => i.id === id ? updated : i))
  return updated
}

export function updateInvoiceStatus(id: string, status: InvoiceStatus): void {
  const now = new Date().toISOString()
  saveAll(
    KEYS.INVOICES,
    getAll<Invoice>(KEYS.INVOICES).map((i) =>
      i.id === id ? { ...i, status, updatedAt: now } : i
    )
  )
}

export function recordPayment(id: string, input: PaymentInput): Invoice | undefined {
  const now = new Date().toISOString()
  const all = getAll<Invoice>(KEYS.INVOICES)
  const existing = all.find((i) => i.id === id)
  if (!existing) return undefined
  const updated: Invoice = {
    ...existing,
    status: 'paid',
    paidAt: input.paidAt,
    paidAmount: input.paidAmount,
    paymentNote: input.paymentNote,
    updatedAt: now,
  }
  saveAll(KEYS.INVOICES, all.map((i) => i.id === id ? updated : i))
  return updated
}

export function cancelPayment(id: string): Invoice | undefined {
  const now = new Date().toISOString()
  const all = getAll<Invoice>(KEYS.INVOICES)
  const existing = all.find((i) => i.id === id)
  if (!existing) return undefined
  const todayStr = now.split('T')[0]
  // dueDate なし（下書きのまま入金された可能性）→ draft に戻す
  // dueDate あり → 超過なら overdue、未超過なら sent
  const newStatus: InvoiceStatus = !existing.dueDate
    ? 'draft'
    : existing.dueDate < todayStr ? 'overdue' : 'sent'
  const updated: Invoice = {
    ...existing,
    status: newStatus,
    paidAt: undefined,
    paidAmount: undefined,
    paymentNote: undefined,
    updatedAt: now,
  }
  saveAll(KEYS.INVOICES, all.map((i) => i.id === id ? updated : i))
  return updated
}

export function deleteInvoice(id: string): void {
  saveAll(KEYS.INVOICES, getAll<Invoice>(KEYS.INVOICES).filter((i) => i.id !== id))
}

// ─── Contracts ───────────────────────────────────────────────

export function getContracts(projectId: string): Contract[] {
  return getAll<Contract>(KEYS.CONTRACTS)
    .filter((c) => c.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getContract(id: string): Contract | undefined {
  return getAll<Contract>(KEYS.CONTRACTS).find((c) => c.id === id)
}

export function seedContract(contract: Contract): void {
  const all = getAll<Contract>(KEYS.CONTRACTS)
  if (all.find((c) => c.id === contract.id)) return
  saveAll(KEYS.CONTRACTS, [...all, contract])
}

export function createContract(input: ContractInput): Contract {
  const now = new Date().toISOString()
  const contract: Contract = {
    id: crypto.randomUUID(),
    organizationId: 'local',
    projectId: input.projectId,
    customerId: input.customerId,
    estimateId: input.estimateId,
    invoiceId: input.invoiceId,
    title: input.title,
    status: input.status ?? 'draft',
    contractDate: input.contractDate,
    startDate: input.startDate,
    endDate: input.endDate,
    amount: input.amount,
    note: input.note,
    createdAt: now,
    updatedAt: now,
  }
  saveAll(KEYS.CONTRACTS, [contract, ...getAll<Contract>(KEYS.CONTRACTS)])
  return contract
}

export function updateContract(id: string, input: Partial<ContractInput>): Contract | undefined {
  const now = new Date().toISOString()
  const all = getAll<Contract>(KEYS.CONTRACTS)
  const existing = all.find((c) => c.id === id)
  if (!existing) return undefined

  const updated: Contract = { ...existing, updatedAt: now }
  if (input.title !== undefined) updated.title = input.title
  if (input.status !== undefined) updated.status = input.status
  if ('customerId' in input) updated.customerId = input.customerId
  if ('estimateId' in input) updated.estimateId = input.estimateId
  if ('invoiceId' in input) updated.invoiceId = input.invoiceId
  if ('contractDate' in input) updated.contractDate = input.contractDate
  if ('startDate' in input) updated.startDate = input.startDate
  if ('endDate' in input) updated.endDate = input.endDate
  if ('amount' in input) updated.amount = input.amount
  if ('note' in input) updated.note = input.note
  saveAll(KEYS.CONTRACTS, all.map((c) => c.id === id ? updated : c))
  return updated
}

export function updateContractStatus(id: string, status: ContractStatus): void {
  const now = new Date().toISOString()
  saveAll(
    KEYS.CONTRACTS,
    getAll<Contract>(KEYS.CONTRACTS).map((c) =>
      c.id === id ? { ...c, status, updatedAt: now } : c
    )
  )
}

export function deleteContract(id: string): void {
  saveAll(KEYS.CONTRACTS, getAll<Contract>(KEYS.CONTRACTS).filter((c) => c.id !== id))
}

// ─── Activities ──────────────────────────────────────────────

export function getActivities(projectId: string): Activity[] {
  return getAll<Activity>(KEYS.ACTIVITIES)
    .filter((a) => a.projectId === projectId)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
}

export function getActivitiesByCustomer(customerId: string): Activity[] {
  return getAll<Activity>(KEYS.ACTIVITIES)
    .filter((a) => a.customerId === customerId)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
}

export function getRecentActivities(limit: number): Activity[] {
  return getAll<Activity>(KEYS.ACTIVITIES)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, limit)
}

export function createActivity(input: ActivityInput): Activity {
  const now = new Date().toISOString()
  const activity: Activity = {
    id: crypto.randomUUID(),
    organizationId: 'local',
    projectId: input.projectId,
    customerId: input.customerId,
    type: input.type,
    title: input.title,
    body: input.body,
    occurredAt: input.occurredAt ?? now,
    createdAt: now,
  }
  const all = getAll<Activity>(KEYS.ACTIVITIES)
  saveAll(KEYS.ACTIVITIES, [...all, activity])
  return activity
}

export function deleteActivity(id: string): void {
  saveAll(KEYS.ACTIVITIES, getAll<Activity>(KEYS.ACTIVITIES).filter((a) => a.id !== id))
}

// ─── Tasks ───────────────────────────────────────────────────

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

function sortTasks(tasks: Task[]): Task[] {
  const today = getTodayStr()
  return [...tasks].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1
    if (a.status !== 'done' && b.status === 'done') return -1
    const aOv = a.dueDate && a.dueDate < today
    const bOv = b.dueDate && b.dueDate < today
    if (aOv && !bOv) return -1
    if (!aOv && bOv) return 1
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    if (a.dueDate && !b.dueDate) return -1
    if (!a.dueDate && b.dueDate) return 1
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  })
}

export function getTasks(projectId: string): Task[] {
  return sortTasks(getAll<Task>(KEYS.TASKS).filter((t) => t.projectId === projectId))
}

export function getTasksByCustomer(customerId: string): Task[] {
  return getAll<Task>(KEYS.TASKS)
    .filter((t) => t.customerId === customerId && t.status !== 'done')
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
      if (a.dueDate && !b.dueDate) return -1
      if (!a.dueDate && b.dueDate) return 1
      return 0
    })
}

export function getTodayTasks(): Task[] {
  const today = getTodayStr()
  return getAll<Task>(KEYS.TASKS).filter((t) => t.dueDate === today && t.status !== 'done')
}

export function getOverdueTasks(): Task[] {
  const today = getTodayStr()
  return getAll<Task>(KEYS.TASKS).filter((t) => t.dueDate && t.dueDate < today && t.status !== 'done')
}

export function createTask(input: TaskInput): Task {
  const now = new Date().toISOString()
  const task: Task = {
    id: crypto.randomUUID(),
    organizationId: 'local',
    projectId: input.projectId,
    customerId: input.customerId,
    title: input.title,
    description: input.description,
    status: input.status ?? 'todo',
    priority: input.priority ?? 'medium',
    dueDate: input.dueDate,
    createdAt: now,
    updatedAt: now,
  }
  saveAll(KEYS.TASKS, [...getAll<Task>(KEYS.TASKS), task])
  return task
}

export function updateTask(id: string, input: TaskUpdateInput): Task | undefined {
  const all = getAll<Task>(KEYS.TASKS)
  const existing = all.find((t) => t.id === id)
  if (!existing) return undefined
  const now = new Date().toISOString()
  const updated: Task = {
    ...existing,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description ?? undefined } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
    ...(input.dueDate !== undefined ? { dueDate: input.dueDate ?? undefined } : {}),
    updatedAt: now,
  }
  saveAll(KEYS.TASKS, all.map((t) => t.id === id ? updated : t))
  return updated
}

export function completeTask(id: string): Task | undefined {
  const all = getAll<Task>(KEYS.TASKS)
  const existing = all.find((t) => t.id === id)
  if (!existing) return undefined
  const now = new Date().toISOString()
  const updated: Task = { ...existing, status: 'done', completedAt: now, updatedAt: now }
  saveAll(KEYS.TASKS, all.map((t) => t.id === id ? updated : t))
  return updated
}

export function deleteTask(id: string): void {
  saveAll(KEYS.TASKS, getAll<Task>(KEYS.TASKS).filter((t) => t.id !== id))
}

// ─── Project Costs ───────────────────────────────────────────

export function getProjectCosts(projectId: string): ProjectCost[] {
  return getAll<ProjectCost>(KEYS.PROJECT_COSTS)
    .filter((c) => c.projectId === projectId)
    .sort((a, b) => b.costDate.localeCompare(a.costDate))
}

export function getProjectCostsByCustomer(customerId: string): ProjectCost[] {
  return getAll<ProjectCost>(KEYS.PROJECT_COSTS)
    .filter((c) => c.customerId === customerId)
    .sort((a, b) => b.costDate.localeCompare(a.costDate))
}

export function getAllProjectCosts(): ProjectCost[] {
  return getAll<ProjectCost>(KEYS.PROJECT_COSTS).filter(c => !c.organizationId || c.organizationId === 'local')
}

export function createProjectCost(input: ProjectCostInput): ProjectCost {
  const now = new Date().toISOString()
  const cost: ProjectCost = {
    id: crypto.randomUUID(),
    organizationId: 'local',
    projectId: input.projectId,
    customerId: input.customerId,
    title: input.title,
    category: input.category ?? 'other',
    amount: input.amount,
    note: input.note,
    costDate: input.costDate ?? getTodayStr(),
    createdAt: now,
    updatedAt: now,
  }
  saveAll(KEYS.PROJECT_COSTS, [...getAll<ProjectCost>(KEYS.PROJECT_COSTS), cost])
  return cost
}

export function updateProjectCost(id: string, input: ProjectCostUpdateInput): ProjectCost | undefined {
  const all = getAll<ProjectCost>(KEYS.PROJECT_COSTS)
  const existing = all.find((c) => c.id === id)
  if (!existing) return undefined
  const now = new Date().toISOString()
  const updated: ProjectCost = {
    ...existing,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.amount !== undefined ? { amount: input.amount } : {}),
    ...(input.note !== undefined ? { note: input.note ?? undefined } : {}),
    ...(input.costDate !== undefined ? { costDate: input.costDate } : {}),
    updatedAt: now,
  }
  saveAll(KEYS.PROJECT_COSTS, all.map((c) => c.id === id ? updated : c))
  return updated
}

export function deleteProjectCost(id: string): void {
  saveAll(KEYS.PROJECT_COSTS, getAll<ProjectCost>(KEYS.PROJECT_COSTS).filter((c) => c.id !== id))
}

// ─── Project Files ───────────────────────────────────────────

export function getProjectFiles(projectId: string): ProjectFile[] {
  return getAll<ProjectFile>(KEYS.PROJECT_FILES)
    .filter((f) => f.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getProjectFilesByCustomer(customerId: string): ProjectFile[] {
  return getAll<ProjectFile>(KEYS.PROJECT_FILES)
    .filter((f) => f.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function createProjectFile(input: ProjectFileInput): ProjectFile {
  const now = new Date().toISOString()
  const file: ProjectFile = {
    id: crypto.randomUUID(),
    organizationId: 'local',
    projectId: input.projectId,
    customerId: input.customerId,
    name: input.name,
    category: input.category ?? 'other',
    externalUrl: input.externalUrl,
    note: input.note,
    createdAt: now,
    updatedAt: now,
  }
  saveAll(KEYS.PROJECT_FILES, [file, ...getAll<ProjectFile>(KEYS.PROJECT_FILES)])
  return file
}

export function updateProjectFile(id: string, input: ProjectFileUpdateInput): ProjectFile | undefined {
  const all = getAll<ProjectFile>(KEYS.PROJECT_FILES)
  const existing = all.find((f) => f.id === id)
  if (!existing) return undefined
  const now = new Date().toISOString()
  const updated: ProjectFile = {
    ...existing,
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.externalUrl !== undefined ? { externalUrl: input.externalUrl ?? undefined } : {}),
    ...(input.note !== undefined ? { note: input.note ?? undefined } : {}),
    updatedAt: now,
  }
  saveAll(KEYS.PROJECT_FILES, all.map((f) => f.id === id ? updated : f))
  return updated
}

export function deleteProjectFile(id: string): void {
  saveAll(KEYS.PROJECT_FILES, getAll<ProjectFile>(KEYS.PROJECT_FILES).filter((f) => f.id !== id))
}
