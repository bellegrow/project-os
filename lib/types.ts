export type ProjectStatus = '商談中' | '提案済' | '受注' | '進行中' | '完了' | '失注'

export interface Project {
  id: string
  clientName: string
  name: string
  status: ProjectStatus
  budget?: number
  customerId?: string
  createdAt: string
  updatedAt: string
}

export interface Hearing {
  id: string
  projectId: string
  date: string
  memo: string
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  industry?: string
  website?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Contact {
  id: string
  customerId: string
  name: string
  role?: string
  email?: string
  phone?: string
  createdAt: string
}

export type EstimateStatus = 'draft' | 'sent' | 'approved' | 'rejected'

export interface EstimateItem {
  id: string
  estimateId: string
  name: string
  description?: string
  quantity: number
  unitPrice: number
  amount: number
  sortOrder: number
}

export interface Estimate {
  id: string
  projectId: string
  customerId?: string
  title: string
  status: EstimateStatus
  subtotal: number
  tax: number
  total: number
  note?: string
  items: EstimateItem[]
  createdAt: string
  updatedAt: string
}

export interface EstimateItemInput {
  name: string
  description?: string
  quantity: number
  unitPrice: number
  sortOrder: number
}

export interface EstimateInput {
  projectId: string
  customerId?: string
  title: string
  note?: string
  status?: EstimateStatus
  taxRate?: number
  items: EstimateItemInput[]
}

// ─── Contracts ───────────────────────────────────────────────

export type ContractStatus = 'draft' | 'sent' | 'signed' | 'completed' | 'canceled'

export interface Contract {
  id: string
  projectId: string
  customerId?: string
  estimateId?: string
  invoiceId?: string
  title: string
  status: ContractStatus
  contractDate?: string
  startDate?: string
  endDate?: string
  amount?: number
  note?: string
  createdAt: string
  updatedAt: string
}

export interface ContractInput {
  projectId: string
  customerId?: string
  estimateId?: string
  invoiceId?: string
  title: string
  status?: ContractStatus
  contractDate?: string
  startDate?: string
  endDate?: string
  amount?: number
  note?: string
}

// ─── Invoices ────────────────────────────────────────────────

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'canceled'

export interface InvoiceItem {
  id: string
  invoiceId: string
  name: string
  description?: string
  quantity: number
  unitPrice: number
  amount: number
  sortOrder: number
}

export interface Invoice {
  id: string
  projectId: string
  customerId?: string
  estimateId?: string
  title: string
  status: InvoiceStatus
  subtotal: number
  tax: number
  total: number
  dueDate?: string
  note?: string
  paidAt?: string
  paidAmount?: number
  paymentNote?: string
  items: InvoiceItem[]
  createdAt: string
  updatedAt: string
}

export interface PaymentInput {
  paidAt: string
  paidAmount: number
  paymentNote?: string
}

export interface InvoiceItemInput {
  name: string
  description?: string
  quantity: number
  unitPrice: number
  sortOrder: number
}

export interface InvoiceInput {
  projectId: string
  customerId?: string
  estimateId?: string
  title: string
  status?: InvoiceStatus
  dueDate?: string
  note?: string
  taxRate?: number
  items: InvoiceItemInput[]
}

// ─── Activities ──────────────────────────────────────────────

export type ActivityType =
  | 'note'
  | 'meeting'
  | 'estimate_created'
  | 'estimate_updated'
  | 'invoice_created'
  | 'invoice_sent'
  | 'payment_received'
  | 'payment_updated'
  | 'contract_created'
  | 'contract_signed'
  | 'status_changed'
  | 'task_created'
  | 'task_completed'
  | 'cost_added'
  | 'cost_updated'
  | 'cost_deleted'
  | 'file_added'
  | 'file_updated'
  | 'file_deleted'

export interface Activity {
  id: string
  projectId?: string
  customerId?: string
  type: ActivityType
  title: string
  body?: string
  occurredAt: string
  createdAt: string
}

export interface ActivityInput {
  projectId?: string
  customerId?: string
  type: ActivityType
  title: string
  body?: string
  occurredAt?: string
}

// ─── Tasks ───────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  projectId: string
  customerId?: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface TaskInput {
  projectId: string
  customerId?: string
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string
}

export interface TaskUpdateInput {
  title?: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string | null
}

// ─── Project Files ───────────────────────────────────────────

export type FileCategory = 'document' | 'image' | 'pdf' | 'design' | 'delivery' | 'other'

export interface ProjectFile {
  id: string
  projectId: string
  customerId?: string
  name: string
  category: FileCategory
  fileType?: string
  fileSize?: number
  storagePath?: string
  publicUrl?: string
  externalUrl?: string
  note?: string
  createdAt: string
  updatedAt: string
}

export interface ProjectFileInput {
  projectId: string
  customerId?: string
  name: string
  category?: FileCategory
  fileType?: string
  fileSize?: number
  storagePath?: string
  publicUrl?: string
  externalUrl?: string
  note?: string
}

export interface ProjectFileUpdateInput {
  name?: string
  category?: FileCategory
  externalUrl?: string | null
  note?: string | null
}

// ─── Project Costs ───────────────────────────────────────────

export type CostCategory = 'outsourcing' | 'material' | 'tool' | 'ad' | 'other'

export interface ProjectCost {
  id: string
  projectId: string
  customerId?: string
  title: string
  category: CostCategory
  amount: number
  note?: string
  costDate: string
  createdAt: string
  updatedAt: string
}

export interface ProjectCostInput {
  projectId: string
  customerId?: string
  title: string
  category?: CostCategory
  amount: number
  note?: string
  costDate?: string
}

export interface ProjectCostUpdateInput {
  title?: string
  category?: CostCategory
  amount?: number
  note?: string | null
  costDate?: string
}

// ─── Search ──────────────────────────────────────────────────

export type SearchResultType =
  | 'project'
  | 'customer'
  | 'contact'
  | 'hearing'
  | 'estimate'
  | 'invoice'
  | 'contract'
  | 'task'
  | 'activity'
  | 'meeting'
  | 'cost'
  | 'file'

export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  subtitle?: string
  snippet?: string
  href: string
  createdAt: string
  projectId?: string
  customerId?: string
}
