import { createClient } from './client'
import { Activity, ActivityInput } from '../types'
import { getCurrentOrganizationId } from '@/lib/auth/getCurrentOrganization'

type ActivityRow = {
  id: string
  project_id: string | null
  organization_id: string
  customer_id: string | null
  type: string
  title: string
  body: string | null
  occurred_at: string
  created_at: string
  deleted_at: string | null
}

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

function fromRow(row: ActivityRow): Activity {
  return {
    id: row.id,
    organizationId: row.organization_id,
    projectId: row.project_id ?? undefined,
    customerId: row.customer_id ?? undefined,
    type: row.type as Activity['type'],
    title: row.title,
    body: row.body ?? undefined,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    deletedAt: row.deleted_at ?? undefined,
  }
}

export async function getAllActivities(): Promise<Activity[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const organizationId = await getCurrentOrganizationId()
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('occurred_at', { ascending: false })
  if (error || !data) return []
  if (process.env.NODE_ENV === 'development') console.log(`[v1.4.2] getAllActivities org=${organizationId} count=${data.length}`)
  return (data as ActivityRow[]).map(fromRow)
}

export async function getActivities(projectId: string): Promise<Activity[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('occurred_at', { ascending: false })
  if (error || !data) return []
  return (data as ActivityRow[]).map(fromRow)
}

export async function getActivitiesByCustomer(customerId: string): Promise<Activity[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .order('occurred_at', { ascending: false })
  if (error || !data) return []
  return (data as ActivityRow[]).map(fromRow)
}

export async function getRecentActivities(limit: number): Promise<Activity[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .is('deleted_at', null)
    .order('occurred_at', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return (data as ActivityRow[]).map(fromRow)
}

export async function createActivity(input: ActivityInput): Promise<Activity | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return undefined

  const organizationId = await getCurrentOrganizationId()

  const { data, error } = await supabase
    .from('activities')
    .insert({
      user_id: session.user.id,
      organization_id: organizationId,
      project_id: input.projectId ?? null,
      customer_id: input.customerId ?? null,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      occurred_at: input.occurredAt ?? new Date().toISOString(),
    })
    .select()
    .single()
  if (error || !data) return undefined
  return fromRow(data as ActivityRow)
}

export async function deleteActivity(id: string): Promise<void> {
  if (!isConfigured()) return
  const supabase = createClient()
  await supabase.from('activities').update({ deleted_at: new Date().toISOString() }).eq('id', id)
}

export async function restoreActivity(id: string): Promise<void> {
  if (!isConfigured()) return
  const supabase = createClient()
  await supabase.from('activities').update({ deleted_at: null }).eq('id', id)
}

export async function hardDeleteActivity(id: string): Promise<void> {
  if (!isConfigured()) return
  const supabase = createClient()
  await supabase.from('activities').delete().eq('id', id)
}
