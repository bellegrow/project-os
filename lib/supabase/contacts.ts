import { createClient } from './client'
import { Contact } from '../types'

type ContactRow = {
  id: string
  customer_id: string
  name: string
  role: string | null
  email: string | null
  phone: string | null
  created_at: string
}

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

function fromRow(row: ContactRow): Contact {
  return {
    id: row.id,
    customerId: row.customer_id,
    name: row.name,
    role: row.role ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    createdAt: row.created_at,
  }
}

export async function getContacts(customerId: string): Promise<Contact[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return (data as ContactRow[]).map(fromRow)
}

export async function createContact(
  input: Omit<Contact, 'id' | 'createdAt'>
): Promise<Contact | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contacts')
    .insert({
      customer_id: input.customerId,
      name: input.name,
      role: input.role ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
    })
    .select()
    .single()
  if (error || !data) return undefined
  return fromRow(data as ContactRow)
}

export async function updateContact(
  id: string,
  input: Partial<Pick<Contact, 'name' | 'role' | 'email' | 'phone'>>
): Promise<Contact | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()

  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch.name = input.name
  if (input.role !== undefined) patch.role = input.role || null
  if (input.email !== undefined) patch.email = input.email || null
  if (input.phone !== undefined) patch.phone = input.phone || null

  const { data, error } = await supabase
    .from('contacts')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error || !data) return undefined
  return fromRow(data as ContactRow)
}

export async function deleteContact(id: string): Promise<void> {
  if (!isConfigured()) return
  const supabase = createClient()
  await supabase.from('contacts').delete().eq('id', id)
}
