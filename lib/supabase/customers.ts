import { createClient } from './client'
import { Customer } from '../types'

type CustomerRow = {
  id: string
  user_id: string
  name: string
  industry: string | null
  website: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

function fromRow(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry ?? undefined,
    website: row.website ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getCustomers(): Promise<Customer[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error || !data) return []
  return (data as CustomerRow[]).map(fromRow)
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return undefined
  return fromRow(data as CustomerRow)
}

export async function createCustomer(
  input: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Customer | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return undefined

  const { data, error } = await supabase
    .from('customers')
    .insert({
      user_id: user.id,
      name: input.name,
      industry: input.industry ?? null,
      website: input.website ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single()
  if (error || !data) return undefined
  return fromRow(data as CustomerRow)
}

export async function updateCustomer(
  id: string,
  input: Partial<Pick<Customer, 'name' | 'industry' | 'website' | 'notes'>>
): Promise<Customer | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()

  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch.name = input.name
  if (input.industry !== undefined) patch.industry = input.industry || null
  if (input.website !== undefined) patch.website = input.website || null
  if (input.notes !== undefined) patch.notes = input.notes || null

  const { data, error } = await supabase
    .from('customers')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error || !data) return undefined
  return fromRow(data as CustomerRow)
}

export async function deleteCustomer(id: string): Promise<void> {
  if (!isConfigured()) return
  const supabase = createClient()
  // contacts は ON DELETE CASCADE で自動削除
  // projects.customer_id は ON DELETE SET NULL
  await supabase.from('customers').delete().eq('id', id)
}
