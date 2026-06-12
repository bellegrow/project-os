import { createClient } from './client'
import { TrashItem } from '../types'
import { getCurrentOrganizationId } from '@/lib/auth/getCurrentOrganization'

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function getTrashItems(): Promise<TrashItem[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const organizationId = await getCurrentOrganizationId()

  const [
    customers,
    projects,
    tasks,
    activities,
    estimates,
    invoices,
    contracts,
    costs,
    files,
  ] = await Promise.all([
    supabase.from('customers').select('id, name, deleted_at').eq('organization_id', organizationId).not('deleted_at', 'is', null),
    supabase.from('projects').select('id, name, client_name, deleted_at').eq('organization_id', organizationId).not('deleted_at', 'is', null),
    supabase.from('tasks').select('id, title, deleted_at').eq('organization_id', organizationId).not('deleted_at', 'is', null),
    supabase.from('activities').select('id, title, deleted_at').eq('organization_id', organizationId).not('deleted_at', 'is', null),
    supabase.from('estimates').select('id, title, deleted_at').eq('organization_id', organizationId).not('deleted_at', 'is', null),
    supabase.from('invoices').select('id, title, deleted_at').eq('organization_id', organizationId).not('deleted_at', 'is', null),
    supabase.from('contracts').select('id, title, deleted_at').eq('organization_id', organizationId).not('deleted_at', 'is', null),
    supabase.from('project_costs').select('id, title, deleted_at').eq('organization_id', organizationId).not('deleted_at', 'is', null),
    supabase.from('project_files').select('id, name, storage_path, deleted_at').eq('organization_id', organizationId).not('deleted_at', 'is', null),
  ])

  const items: TrashItem[] = []

  for (const row of (customers.data ?? [])) {
    items.push({ id: row.id, type: 'customer', name: row.name, deletedAt: row.deleted_at })
  }
  for (const row of (projects.data ?? [])) {
    items.push({ id: row.id, type: 'project', name: row.name, meta: row.client_name, deletedAt: row.deleted_at })
  }
  for (const row of (tasks.data ?? [])) {
    items.push({ id: row.id, type: 'task', name: row.title, deletedAt: row.deleted_at })
  }
  for (const row of (activities.data ?? [])) {
    items.push({ id: row.id, type: 'activity', name: row.title, deletedAt: row.deleted_at })
  }
  for (const row of (estimates.data ?? [])) {
    items.push({ id: row.id, type: 'estimate', name: row.title, deletedAt: row.deleted_at })
  }
  for (const row of (invoices.data ?? [])) {
    items.push({ id: row.id, type: 'invoice', name: row.title, deletedAt: row.deleted_at })
  }
  for (const row of (contracts.data ?? [])) {
    items.push({ id: row.id, type: 'contract', name: row.title, deletedAt: row.deleted_at })
  }
  for (const row of (costs.data ?? [])) {
    items.push({ id: row.id, type: 'project_cost', name: row.title, deletedAt: row.deleted_at })
  }
  for (const row of (files.data ?? [])) {
    items.push({ id: row.id, type: 'project_file', name: row.name, storagePath: row.storage_path ?? undefined, deletedAt: row.deleted_at })
  }

  return items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime())
}
