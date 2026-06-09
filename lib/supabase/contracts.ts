import { createClient } from './client'
import { Contract, ContractStatus, ContractInput } from '../types'
import { getCurrentOrganizationId } from '@/lib/auth/getCurrentOrganization'

type ContractRow = {
  id: string
  user_id: string
  organization_id: string | null
  project_id: string
  customer_id: string | null
  estimate_id: string | null
  invoice_id: string | null
  title: string
  status: string
  contract_date: string | null
  start_date: string | null
  end_date: string | null
  amount: number | null
  note: string | null
  created_at: string
  updated_at: string
}

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

function fromRow(row: ContractRow): Contract {
  return {
    id: row.id,
    organizationId: row.organization_id ?? '',
    projectId: row.project_id,
    customerId: row.customer_id ?? undefined,
    estimateId: row.estimate_id ?? undefined,
    invoiceId: row.invoice_id ?? undefined,
    title: row.title,
    status: row.status as ContractStatus,
    contractDate: row.contract_date ?? undefined,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    amount: row.amount ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getAllContracts(): Promise<Contract[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const organizationId = await getCurrentOrganizationId()
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  if (process.env.NODE_ENV === 'development') console.log(`[v1.4.2] getAllContracts org=${organizationId} count=${data.length}`)
  return (data as ContractRow[]).map(fromRow)
}

export async function getContracts(projectId: string): Promise<Contract[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as ContractRow[]).map(fromRow)
}

export async function getContract(id: string): Promise<Contract | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return undefined
  return fromRow(data as ContractRow)
}

export async function createContract(input: ContractInput): Promise<Contract | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return undefined

  const organizationId = await getCurrentOrganizationId()

  const { data, error } = await supabase
    .from('contracts')
    .insert({
      user_id: user.id,
      organization_id: organizationId,
      project_id: input.projectId,
      customer_id: input.customerId ?? null,
      estimate_id: input.estimateId ?? null,
      invoice_id: input.invoiceId ?? null,
      title: input.title,
      status: input.status ?? 'draft',
      contract_date: input.contractDate ?? null,
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
      amount: input.amount ?? null,
      note: input.note ?? null,
    })
    .select()
    .single()
  if (error || !data) return undefined
  return fromRow(data as ContractRow)
}

export async function updateContract(
  id: string,
  input: Partial<ContractInput>
): Promise<Contract | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()

  const patch: Record<string, unknown> = {}
  if (input.title !== undefined) patch.title = input.title
  if (input.status !== undefined) patch.status = input.status
  if ('customerId' in input) patch.customer_id = input.customerId ?? null
  if ('estimateId' in input) patch.estimate_id = input.estimateId ?? null
  if ('invoiceId' in input) patch.invoice_id = input.invoiceId ?? null
  if ('contractDate' in input) patch.contract_date = input.contractDate ?? null
  if ('startDate' in input) patch.start_date = input.startDate ?? null
  if ('endDate' in input) patch.end_date = input.endDate ?? null
  if ('amount' in input) patch.amount = input.amount ?? null
  if ('note' in input) patch.note = input.note ?? null

  if (Object.keys(patch).length === 0) return getContract(id)

  const { data, error } = await supabase
    .from('contracts')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error || !data) return undefined
  return fromRow(data as ContractRow)
}

export async function updateContractStatus(id: string, status: ContractStatus): Promise<void> {
  if (!isConfigured()) return
  const supabase = createClient()
  await supabase.from('contracts').update({ status }).eq('id', id)
}

export async function deleteContract(id: string): Promise<void> {
  if (!isConfigured()) return
  const supabase = createClient()
  await supabase.from('contracts').delete().eq('id', id)
}
