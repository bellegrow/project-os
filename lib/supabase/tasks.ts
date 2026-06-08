import { createClient } from './client'
import { Task, TaskInput, TaskUpdateInput } from '../types'
import { getTodayStr } from '../utils'

type TaskRow = {
  id: string
  project_id: string
  customer_id: string | null
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

function fromRow(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    customerId: row.customer_id ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status as Task['status'],
    priority: row.priority as Task['priority'],
    dueDate: row.due_date ?? undefined,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getAllTasks(): Promise<Task[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as TaskRow[]).map(fromRow)
}

export async function getTasks(projectId: string): Promise<Task[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('due_date', { ascending: true, nullsFirst: false })
  if (error || !data) return []
  return (data as TaskRow[]).map(fromRow)
}

export async function getTasksByCustomer(customerId: string): Promise<Task[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('customer_id', customerId)
    .neq('status', 'done')
    .order('due_date', { ascending: true, nullsFirst: false })
  if (error || !data) return []
  return (data as TaskRow[]).map(fromRow)
}

export async function getTodayTasks(): Promise<Task[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const today = getTodayStr()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('due_date', today)
    .neq('status', 'done')
  if (error || !data) return []
  return (data as TaskRow[]).map(fromRow)
}

export async function getOverdueTasks(): Promise<Task[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const today = getTodayStr()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .lt('due_date', today)
    .neq('status', 'done')
    .order('due_date', { ascending: true })
  if (error || !data) return []
  return (data as TaskRow[]).map(fromRow)
}

export async function createTask(input: TaskInput): Promise<Task | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return undefined
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: session.user.id,
      project_id: input.projectId,
      customer_id: input.customerId ?? null,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? 'todo',
      priority: input.priority ?? 'medium',
      due_date: input.dueDate ?? null,
    })
    .select()
    .single()
  if (error || !data) return undefined
  return fromRow(data as TaskRow)
}

export async function updateTask(id: string, input: TaskUpdateInput): Promise<Task | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.title !== undefined) patch.title = input.title
  if (input.description !== undefined) patch.description = input.description
  if (input.status !== undefined) patch.status = input.status
  if (input.priority !== undefined) patch.priority = input.priority
  if (input.dueDate !== undefined) patch.due_date = input.dueDate
  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error || !data) return undefined
  return fromRow(data as TaskRow)
}

export async function completeTask(id: string): Promise<Task | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'done', completed_at: now, updated_at: now })
    .eq('id', id)
    .select()
    .single()
  if (error || !data) return undefined
  return fromRow(data as TaskRow)
}

export async function deleteTask(id: string): Promise<void> {
  if (!isConfigured()) return
  const supabase = createClient()
  await supabase.from('tasks').delete().eq('id', id)
}
