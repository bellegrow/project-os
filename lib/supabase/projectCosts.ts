import { createClient } from './client'
import { ProjectCost, ProjectCostInput, ProjectCostUpdateInput } from '../types'
import { getTodayStr } from '../utils'
import { getCurrentOrganizationId } from '@/lib/auth/getCurrentOrganization'

type CostRow = {
  id: string
  project_id: string
  organization_id: string | null
  customer_id: string | null
  title: string
  category: string
  amount: number
  note: string | null
  cost_date: string
  created_at: string
  updated_at: string
}

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

function fromRow(row: CostRow): ProjectCost {
  return {
    id: row.id,
    organizationId: row.organization_id ?? '',
    projectId: row.project_id,
    customerId: row.customer_id ?? undefined,
    title: row.title,
    category: row.category as ProjectCost['category'],
    amount: row.amount,
    note: row.note ?? undefined,
    costDate: row.cost_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getProjectCosts(projectId: string): Promise<ProjectCost[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_costs')
    .select('*')
    .eq('project_id', projectId)
    .order('cost_date', { ascending: false })
  if (error || !data) return []
  return (data as CostRow[]).map(fromRow)
}

export async function getProjectCostsByCustomer(customerId: string): Promise<ProjectCost[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_costs')
    .select('*')
    .eq('customer_id', customerId)
    .order('cost_date', { ascending: false })
  if (error || !data) return []
  return (data as CostRow[]).map(fromRow)
}

export async function getAllProjectCosts(): Promise<ProjectCost[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const organizationId = await getCurrentOrganizationId()
  const { data, error } = await supabase
    .from('project_costs')
    .select('*')
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
    .order('cost_date', { ascending: false })
  if (error || !data) return []
  if (process.env.NODE_ENV === 'development') console.log(`[v1.4.2] getAllProjectCosts org=${organizationId} count=${data.length}`)
  return (data as CostRow[]).map(fromRow)
}

export async function createProjectCost(input: ProjectCostInput): Promise<ProjectCost | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return undefined

  const organizationId = await getCurrentOrganizationId()

  const { data, error } = await supabase
    .from('project_costs')
    .insert({
      user_id: session.user.id,
      organization_id: organizationId,
      project_id: input.projectId,
      customer_id: input.customerId ?? null,
      title: input.title,
      category: input.category ?? 'other',
      amount: input.amount,
      note: input.note ?? null,
      cost_date: input.costDate ?? getTodayStr(),
    })
    .select()
    .single()
  if (error || !data) return undefined
  return fromRow(data as CostRow)
}

export async function updateProjectCost(id: string, input: ProjectCostUpdateInput): Promise<ProjectCost | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.title !== undefined) patch.title = input.title
  if (input.category !== undefined) patch.category = input.category
  if (input.amount !== undefined) patch.amount = input.amount
  if (input.note !== undefined) patch.note = input.note
  if (input.costDate !== undefined) patch.cost_date = input.costDate
  const { data, error } = await supabase
    .from('project_costs')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error || !data) return undefined
  return fromRow(data as CostRow)
}

export async function deleteProjectCost(id: string): Promise<void> {
  if (!isConfigured()) return
  const supabase = createClient()
  await supabase.from('project_costs').delete().eq('id', id)
}
