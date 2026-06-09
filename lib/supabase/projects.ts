import { createClient } from './client'
import { Project, ProjectStatus } from '../types'

// Supabase DB の snake_case 行型
type ProjectRow = {
  id: string
  user_id: string
  customer_id: string | null
  client_name: string
  name: string
  status: string
  budget: number | null
  created_at: string
  updated_at: string
}

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

function fromRow(row: ProjectRow): Project {
  return {
    id: row.id,
    clientName: row.client_name,
    name: row.name,
    status: row.status as ProjectStatus,
    budget: row.budget ?? undefined,
    customerId: row.customer_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getProjects(): Promise<Project[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  // TODO: v1.4+ — .eq('organization_id', organizationId) でテナント分離フィルタを追加
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error || !data) return []
  return (data as ProjectRow[]).map(fromRow)
}

export async function getProject(id: string): Promise<Project | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return undefined
  return fromRow(data as ProjectRow)
}

export async function createProject(
  input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Project | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return undefined

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      customer_id: input.customerId ?? null,
      client_name: input.clientName,
      name: input.name,
      status: input.status,
      budget: input.budget ?? null,
    })
    .select()
    .single()
  if (error || !data) return undefined
  return fromRow(data as ProjectRow)
}

export async function updateProject(
  id: string,
  input: Partial<Pick<Project, 'clientName' | 'name' | 'budget' | 'status' | 'customerId'>>
): Promise<Project | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()

  const patch: Record<string, unknown> = {}
  if (input.clientName !== undefined) patch.client_name = input.clientName
  if (input.name !== undefined) patch.name = input.name
  if (input.budget !== undefined) patch.budget = input.budget
  if (input.status !== undefined) patch.status = input.status
  if ('customerId' in input) patch.customer_id = input.customerId ?? null

  const { data, error } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error || !data) return undefined
  return fromRow(data as ProjectRow)
}

export async function updateProjectStatus(
  id: string,
  status: ProjectStatus
): Promise<void> {
  if (!isConfigured()) return
  const supabase = createClient()
  await supabase.from('projects').update({ status }).eq('id', id)
}

export async function deleteProject(id: string): Promise<void> {
  if (!isConfigured()) return
  const supabase = createClient()
  // hearings など関連データは DB の ON DELETE CASCADE で自動削除される
  await supabase.from('projects').delete().eq('id', id)
}

export async function getProjectsByCustomer(customerId: string): Promise<Project[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('customer_id', customerId)
    .order('updated_at', { ascending: false })
  if (error || !data) return []
  return (data as ProjectRow[]).map(fromRow)
}
