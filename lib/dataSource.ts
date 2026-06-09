/**
 * データソースルーター
 * - Supabase設定済み かつ セッションあり → Supabase CRUD
 * - それ以外 → localStorage（v1互換）
 * 顧客・担当者はクラウドモード専用（localStorageフォールバックなし）
 *
 * TODO: v1.4+ — マルチテナント対応
 *   getCurrentOrganizationId() で組織IDを取得し、
 *   各 getAll* / getX 関数に organizationId フィルタを追加する。
 *   Supabase 側は organization_id カラム + RLS ポリシーで分離を保証する。
 *   参照: lib/auth/getCurrentOrganization.ts
 */
import { Project, Hearing, ProjectStatus, Customer, Contact, Estimate, EstimateStatus, EstimateInput, Invoice, InvoiceStatus, InvoiceInput, PaymentInput, Contract, ContractStatus, ContractInput, Activity, ActivityInput, Task, TaskInput, TaskUpdateInput, ProjectCost, ProjectCostInput, ProjectCostUpdateInput, ProjectFile, ProjectFileInput, ProjectFileUpdateInput, FileCategory } from './types'
import {
  demoProjectMap, demoCustomers, demoHearings, demoHearingsByProject,
  demoEstimatesByProject, demoInvoicesByProject, demoContractsByProject,
  demoTasksByProject, demoCostsByProject, demoFilesByProject,
  demoContactsByCustomer, demoProjects, demoTasks, demoProjectCosts, demoProjectFiles,
} from './demoData'
import * as storage from './storage'
import * as sbProjects from './supabase/projects'
import * as sbHearings from './supabase/hearings'
import * as sbCustomers from './supabase/customers'
import * as sbContacts from './supabase/contacts'
import * as sbEstimates from './supabase/estimates'
import * as sbInvoices from './supabase/invoices'
import * as sbContracts from './supabase/contracts'
import * as sbActivities from './supabase/activities'
import * as sbTasks from './supabase/tasks'
import * as sbProjectCosts from './supabase/projectCosts'
import * as sbProjectFiles from './supabase/projectFiles'

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

async function isCloudMode(): Promise<boolean> {
  if (!isConfigured()) return false
  try {
    const { createClient } = await import('./supabase/client')
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return !!session
  } catch {
    return false
  }
}

// ─── Projects ────────────────────────────────────────────────

// TODO: v1.4+ — _organizationId を sbProjects.getProjects() に渡してフィルタを適用
export async function getProjects(
  _organizationId?: string
): Promise<Project[]> {
  if (await isCloudMode()) return sbProjects.getProjects()
  return storage.getProjects()
}

export async function getProject(id: string): Promise<Project | undefined> {
  if (await isCloudMode()) return sbProjects.getProject(id)
  return storage.getProject(id) ?? demoProjectMap.get(id)
}

export async function createProject(
  input: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>
): Promise<Project | undefined> {
  if (await isCloudMode()) return sbProjects.createProject(input)
  return storage.createProject(input)
}

export async function updateProject(
  id: string,
  input: Partial<Pick<Project, 'clientName' | 'name' | 'budget' | 'status' | 'customerId'>>
): Promise<Project | undefined> {
  if (await isCloudMode()) return sbProjects.updateProject(id, input)
  return storage.updateProject(id, input)
}

export async function updateProjectStatus(
  id: string,
  status: ProjectStatus
): Promise<void> {
  if (await isCloudMode()) return sbProjects.updateProjectStatus(id, status)
  storage.updateProjectStatus(id, status)
}

export async function deleteProject(id: string): Promise<void> {
  if (await isCloudMode()) return sbProjects.deleteProject(id)
  storage.deleteProject(id)
}

// ─── Hearings ────────────────────────────────────────────────

export async function getHearings(projectId: string): Promise<Hearing[]> {
  if (await isCloudMode()) return sbHearings.getHearings(projectId)
  const real = storage.getHearings(projectId)
  if (real.length > 0 || !projectId.startsWith('demo-')) return real
  return demoHearingsByProject.get(projectId) ?? []
}

export async function getHearingsByProjectIds(projectIds: string[]): Promise<Hearing[]> {
  if (await isCloudMode()) return sbHearings.getHearingsByProjectIds(projectIds)
  const real = storage.getHearingsByProjectIds(projectIds)
  const demoIds = projectIds.filter(id => id.startsWith('demo-'))
  if (demoIds.length === 0) return real
  const demoResults = demoHearings.filter(h => demoIds.includes(h.projectId))
  return [...real, ...demoResults]
}

export async function getAllHearings(): Promise<Hearing[]> {
  if (await isCloudMode()) return sbHearings.getAllHearings()
  return storage.getAllHearings()
}

export async function createHearing(
  input: Omit<Hearing, 'id' | 'createdAt'>
): Promise<Hearing | undefined> {
  if (await isCloudMode()) return sbHearings.createHearing(input)
  return storage.createHearing(input)
}

export async function updateHearing(id: string, memo: string, date?: string): Promise<void> {
  if (await isCloudMode()) return sbHearings.updateHearing(id, memo, date)
  storage.updateHearing(id, memo, date)
}

export async function deleteHearing(id: string): Promise<void> {
  if (await isCloudMode()) return sbHearings.deleteHearing(id)
  storage.deleteHearing(id)
}

// ─── Customers（クラウドモード専用） ──────────────────────────

// TODO: v1.4+ — _organizationId を sbCustomers.getCustomers() に渡してフィルタを適用
export async function getCustomers(
  _organizationId?: string
): Promise<Customer[]> {
  if (await isCloudMode()) return sbCustomers.getCustomers()
  return []
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  if (await isCloudMode()) return sbCustomers.getCustomer(id)
  return demoCustomers.find(c => c.id === id)
}

export async function createCustomer(
  input: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>
): Promise<Customer | undefined> {
  if (await isCloudMode()) return sbCustomers.createCustomer(input)
  return undefined
}

export async function updateCustomer(
  id: string,
  input: Partial<Pick<Customer, 'name' | 'industry' | 'website' | 'notes'>>
): Promise<Customer | undefined> {
  if (await isCloudMode()) return sbCustomers.updateCustomer(id, input)
  return undefined
}

export async function deleteCustomer(id: string): Promise<void> {
  if (await isCloudMode()) return sbCustomers.deleteCustomer(id)
}

export async function getProjectsByCustomer(customerId: string): Promise<Project[]> {
  if (await isCloudMode()) return sbProjects.getProjectsByCustomer(customerId)
  return demoProjects.filter(p => p.customerId === customerId)
}

// ─── Contacts（クラウドモード専用） ───────────────────────────

export async function getContacts(customerId: string): Promise<Contact[]> {
  if (await isCloudMode()) return sbContacts.getContacts(customerId)
  return demoContactsByCustomer.get(customerId) ?? []
}

export async function createContact(
  input: Omit<Contact, 'id' | 'createdAt'>
): Promise<Contact | undefined> {
  if (await isCloudMode()) return sbContacts.createContact(input)
  return undefined
}

export async function updateContact(
  id: string,
  input: Partial<Pick<Contact, 'name' | 'role' | 'email' | 'phone'>>
): Promise<Contact | undefined> {
  if (await isCloudMode()) return sbContacts.updateContact(id, input)
  return undefined
}

export async function deleteContact(id: string): Promise<void> {
  if (await isCloudMode()) return sbContacts.deleteContact(id)
}

// ─── Estimates ───────────────────────────────────────────────

// TODO: v1.4+ — _organizationId を sbEstimates.getAllEstimates() に渡してフィルタを適用
export async function getAllEstimates(
  _organizationId?: string
): Promise<Estimate[]> {
  if (await isCloudMode()) return sbEstimates.getAllEstimates()
  return storage.getAllEstimates()
}

export async function getEstimates(projectId: string): Promise<Estimate[]> {
  if (await isCloudMode()) return sbEstimates.getEstimates(projectId)
  const real = storage.getEstimates(projectId)
  if (real.length > 0 || !projectId.startsWith('demo-')) return real
  return demoEstimatesByProject.get(projectId) ?? []
}

export async function getEstimate(id: string): Promise<Estimate | undefined> {
  if (await isCloudMode()) return sbEstimates.getEstimate(id)
  return storage.getEstimate(id)
}

export async function createEstimate(input: EstimateInput): Promise<Estimate | undefined> {
  if (await isCloudMode()) return sbEstimates.createEstimate(input)
  return storage.createEstimate(input)
}

export async function updateEstimate(
  id: string,
  input: Partial<EstimateInput>
): Promise<Estimate | undefined> {
  if (await isCloudMode()) return sbEstimates.updateEstimate(id, input)
  return storage.updateEstimate(id, input)
}

export async function updateEstimateStatus(id: string, status: EstimateStatus): Promise<void> {
  if (await isCloudMode()) return sbEstimates.updateEstimateStatus(id, status)
  storage.updateEstimateStatus(id, status)
}

export async function deleteEstimate(id: string): Promise<void> {
  if (await isCloudMode()) return sbEstimates.deleteEstimate(id)
  storage.deleteEstimate(id)
}

// ─── Invoices ────────────────────────────────────────────────

export async function getInvoices(projectId: string): Promise<Invoice[]> {
  if (await isCloudMode()) return sbInvoices.getInvoices(projectId)
  const real = storage.getInvoices(projectId)
  if (real.length > 0 || !projectId.startsWith('demo-')) return real
  return demoInvoicesByProject.get(projectId) ?? []
}

// TODO: v1.4+ — _organizationId を sbInvoices.getAllInvoices() に渡してフィルタを適用
export async function getAllInvoices(
  _organizationId?: string
): Promise<Invoice[]> {
  if (await isCloudMode()) return sbInvoices.getAllInvoices()
  return storage.getAllInvoices()
}

export async function getInvoice(id: string): Promise<Invoice | undefined> {
  if (await isCloudMode()) return sbInvoices.getInvoice(id)
  return storage.getInvoice(id)
}

export async function createInvoice(input: InvoiceInput): Promise<Invoice | undefined> {
  if (await isCloudMode()) return sbInvoices.createInvoice(input)
  return storage.createInvoice(input)
}

export async function updateInvoice(
  id: string,
  input: Partial<InvoiceInput>
): Promise<Invoice | undefined> {
  if (await isCloudMode()) return sbInvoices.updateInvoice(id, input)
  return storage.updateInvoice(id, input)
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<void> {
  if (await isCloudMode()) return sbInvoices.updateInvoiceStatus(id, status)
  storage.updateInvoiceStatus(id, status)
}

export async function recordPayment(id: string, input: PaymentInput): Promise<Invoice | undefined> {
  if (await isCloudMode()) return sbInvoices.recordPayment(id, input)
  return storage.recordPayment(id, input)
}

export async function cancelPayment(id: string): Promise<Invoice | undefined> {
  if (await isCloudMode()) return sbInvoices.cancelPayment(id)
  return storage.cancelPayment(id)
}

export async function deleteInvoice(id: string): Promise<void> {
  if (await isCloudMode()) return sbInvoices.deleteInvoice(id)
  storage.deleteInvoice(id)
}

// ─── Contracts ───────────────────────────────────────────────

// TODO: v1.4+ — _organizationId を sbContracts.getAllContracts() に渡してフィルタを適用
export async function getAllContracts(
  _organizationId?: string
): Promise<Contract[]> {
  if (await isCloudMode()) return sbContracts.getAllContracts()
  return storage.getAllContracts()
}

export async function getContracts(projectId: string): Promise<Contract[]> {
  if (await isCloudMode()) return sbContracts.getContracts(projectId)
  const real = storage.getContracts(projectId)
  if (real.length > 0 || !projectId.startsWith('demo-')) return real
  return demoContractsByProject.get(projectId) ?? []
}

export async function getContract(id: string): Promise<Contract | undefined> {
  if (await isCloudMode()) return sbContracts.getContract(id)
  return storage.getContract(id)
}

export async function createContract(input: ContractInput): Promise<Contract | undefined> {
  if (await isCloudMode()) return sbContracts.createContract(input)
  return storage.createContract(input)
}

export async function updateContract(
  id: string,
  input: Partial<ContractInput>
): Promise<Contract | undefined> {
  if (await isCloudMode()) return sbContracts.updateContract(id, input)
  return storage.updateContract(id, input)
}

export async function updateContractStatus(id: string, status: ContractStatus): Promise<void> {
  if (await isCloudMode()) return sbContracts.updateContractStatus(id, status)
  storage.updateContractStatus(id, status)
}

export async function deleteContract(id: string): Promise<void> {
  if (await isCloudMode()) return sbContracts.deleteContract(id)
  storage.deleteContract(id)
}

// ─── Activities ──────────────────────────────────────────────

// TODO: v1.4+ — _organizationId を sbActivities.getAllActivities() に渡してフィルタを適用
export async function getAllActivities(
  _organizationId?: string
): Promise<Activity[]> {
  if (await isCloudMode()) return sbActivities.getAllActivities()
  return storage.getAllActivities()
}

export async function getActivities(projectId: string): Promise<Activity[]> {
  if (await isCloudMode()) return sbActivities.getActivities(projectId)
  return storage.getActivities(projectId)
}

export async function getActivitiesByCustomer(customerId: string): Promise<Activity[]> {
  if (await isCloudMode()) return sbActivities.getActivitiesByCustomer(customerId)
  return storage.getActivitiesByCustomer(customerId)
}

export async function getRecentActivities(limit: number): Promise<Activity[]> {
  if (await isCloudMode()) return sbActivities.getRecentActivities(limit)
  return storage.getRecentActivities(limit)
}

export async function createActivity(input: ActivityInput): Promise<Activity | undefined> {
  if (await isCloudMode()) return sbActivities.createActivity(input)
  return storage.createActivity(input)
}

export async function deleteActivity(id: string): Promise<void> {
  if (await isCloudMode()) return sbActivities.deleteActivity(id)
  storage.deleteActivity(id)
}

// ─── Tasks ───────────────────────────────────────────────────

// TODO: v1.4+ — _organizationId を sbTasks.getAllTasks() に渡してフィルタを適用
export async function getAllTasks(
  _organizationId?: string
): Promise<Task[]> {
  if (await isCloudMode()) return sbTasks.getAllTasks()
  return storage.getAllTasks()
}

export async function getTasks(projectId: string): Promise<Task[]> {
  if (await isCloudMode()) return sbTasks.getTasks(projectId)
  const real = storage.getTasks(projectId)
  if (real.length > 0 || !projectId.startsWith('demo-')) return real
  return demoTasksByProject.get(projectId) ?? []
}

export async function getTasksByCustomer(customerId: string): Promise<Task[]> {
  if (await isCloudMode()) return sbTasks.getTasksByCustomer(customerId)
  const real = storage.getTasksByCustomer(customerId)
  if (real.length > 0 || !customerId.startsWith('demo-')) return real
  return demoTasks.filter(t => t.customerId === customerId)
}

export async function getTodayTasks(): Promise<Task[]> {
  if (await isCloudMode()) return sbTasks.getTodayTasks()
  return storage.getTodayTasks()
}

export async function getOverdueTasks(): Promise<Task[]> {
  if (await isCloudMode()) return sbTasks.getOverdueTasks()
  return storage.getOverdueTasks()
}

export async function createTask(input: TaskInput): Promise<Task | undefined> {
  if (await isCloudMode()) return sbTasks.createTask(input)
  return storage.createTask(input)
}

export async function updateTask(id: string, input: TaskUpdateInput): Promise<Task | undefined> {
  if (await isCloudMode()) return sbTasks.updateTask(id, input)
  return storage.updateTask(id, input)
}

export async function completeTask(id: string): Promise<Task | undefined> {
  if (await isCloudMode()) return sbTasks.completeTask(id)
  return storage.completeTask(id)
}

export async function deleteTask(id: string): Promise<void> {
  if (await isCloudMode()) return sbTasks.deleteTask(id)
  storage.deleteTask(id)
}

// ─── Project Costs ───────────────────────────────────────────

export async function getProjectCosts(projectId: string): Promise<ProjectCost[]> {
  if (await isCloudMode()) return sbProjectCosts.getProjectCosts(projectId)
  const real = storage.getProjectCosts(projectId)
  if (real.length > 0 || !projectId.startsWith('demo-')) return real
  return demoCostsByProject.get(projectId) ?? []
}

export async function getProjectCostsByCustomer(customerId: string): Promise<ProjectCost[]> {
  if (await isCloudMode()) return sbProjectCosts.getProjectCostsByCustomer(customerId)
  const real = storage.getProjectCostsByCustomer(customerId)
  if (real.length > 0 || !customerId.startsWith('demo-')) return real
  return demoProjectCosts.filter(c => c.customerId === customerId)
}

// TODO: v1.4+ — _organizationId を sbProjectCosts.getAllProjectCosts() に渡してフィルタを適用
export async function getAllProjectCosts(
  _organizationId?: string
): Promise<ProjectCost[]> {
  if (await isCloudMode()) return sbProjectCosts.getAllProjectCosts()
  return storage.getAllProjectCosts()
}

export async function createProjectCost(input: ProjectCostInput): Promise<ProjectCost | undefined> {
  if (await isCloudMode()) return sbProjectCosts.createProjectCost(input)
  return storage.createProjectCost(input)
}

export async function updateProjectCost(id: string, input: ProjectCostUpdateInput): Promise<ProjectCost | undefined> {
  if (await isCloudMode()) return sbProjectCosts.updateProjectCost(id, input)
  return storage.updateProjectCost(id, input)
}

export async function deleteProjectCost(id: string): Promise<void> {
  if (await isCloudMode()) return sbProjectCosts.deleteProjectCost(id)
  storage.deleteProjectCost(id)
}

// ─── Project Files ───────────────────────────────────────────

// TODO: v1.4+ — _organizationId を sbProjectFiles.getAllProjectFiles() に渡してフィルタを適用
export async function getAllProjectFiles(
  _organizationId?: string
): Promise<ProjectFile[]> {
  if (await isCloudMode()) return sbProjectFiles.getAllProjectFiles()
  return storage.getAllProjectFiles()
}

export async function getProjectFiles(projectId: string): Promise<ProjectFile[]> {
  if (await isCloudMode()) return sbProjectFiles.getProjectFiles(projectId)
  const real = storage.getProjectFiles(projectId)
  if (real.length > 0 || !projectId.startsWith('demo-')) return real
  return demoFilesByProject.get(projectId) ?? []
}

export async function getProjectFilesByCustomer(customerId: string): Promise<ProjectFile[]> {
  if (await isCloudMode()) return sbProjectFiles.getProjectFilesByCustomer(customerId)
  const real = storage.getProjectFilesByCustomer(customerId)
  if (real.length > 0 || !customerId.startsWith('demo-')) return real
  return demoProjectFiles.filter(f => f.customerId === customerId)
}

export async function createProjectFile(input: ProjectFileInput): Promise<ProjectFile | undefined> {
  if (await isCloudMode()) return sbProjectFiles.createProjectFile(input)
  return storage.createProjectFile(input)
}

export async function updateProjectFile(id: string, input: ProjectFileUpdateInput): Promise<ProjectFile | undefined> {
  if (await isCloudMode()) return sbProjectFiles.updateProjectFile(id, input)
  return storage.updateProjectFile(id, input)
}

export async function deleteProjectFile(id: string, storagePath?: string): Promise<void> {
  if (await isCloudMode()) return sbProjectFiles.deleteProjectFile(id, storagePath)
  storage.deleteProjectFile(id)
}

export async function uploadProjectFile(
  projectId: string,
  file: File,
  meta: { name?: string; customerId?: string; category?: FileCategory; note?: string }
): Promise<ProjectFile | undefined> {
  if (await isCloudMode()) return sbProjectFiles.uploadProjectFile(projectId, file, meta)
  return undefined
}

export async function getProjectFileUrl(storagePath: string): Promise<string | null> {
  if (await isCloudMode()) return sbProjectFiles.getProjectFileUrl(storagePath)
  return null
}
