import { createClient } from './client'
import { Activity, ActivityInput } from '../types'
import { getCurrentOrganizationId } from '@/lib/auth/getCurrentOrganization'

type ActivityRow = {
  id: string
  project_id: string | null
  organization_id: string | null
  customer_id: string | null
  type: string
  title: string
  body: string | null
  occurred_at: string
  created_at: string
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
    organizationId: row.organization_id ?? '',
    projectId: row.project_id ?? undefined,
    customerId: row.customer_id ?? undefined,
    type: row.type as Activity['type'],
    title: row.title,
    body: row.body ?? undefined,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
  }
}

export async function getAllActivities(): Promise<Activity[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  // TODO: v1.4.2 — .eq('organization_id', organizationId) でテナント分離フィルタを追加
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('occurred_at', { ascending: false })
  if (error || !data) return []
  return (data as ActivityRow[]).map(fromRow)
}

export async function getActivities(projectId: string): Promise<Activity[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('project_id', projectId)
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
  await supabase.from('activities').delete().eq('id', id)
}
