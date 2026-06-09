import { createClient } from './client'
import { Estimate, EstimateItem, EstimateStatus, EstimateInput } from '../types'

type EstimateItemRow = {
  id: string
  estimate_id: string
  name: string
  description: string | null
  quantity: number
  unit_price: number
  amount: number
  sort_order: number
}

type EstimateRow = {
  id: string
  user_id: string
  project_id: string
  customer_id: string | null
  title: string
  status: string
  subtotal: number
  tax: number
  total: number
  note: string | null
  created_at: string
  updated_at: string
  estimate_items?: EstimateItemRow[]
}

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

function itemFromRow(row: EstimateItemRow): EstimateItem {
  return {
    id: row.id,
    estimateId: row.estimate_id,
    name: row.name,
    description: row.description ?? undefined,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    amount: row.amount,
    sortOrder: row.sort_order,
  }
}

function fromRow(row: EstimateRow): Estimate {
  return {
    id: row.id,
    projectId: row.project_id,
    customerId: row.customer_id ?? undefined,
    title: row.title,
    status: row.status as EstimateStatus,
    subtotal: row.subtotal,
    tax: row.tax,
    total: row.total,
    note: row.note ?? undefined,
    items: (row.estimate_items ?? [])
      .map(itemFromRow)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function computeTotals(items: EstimateInput['items'], taxRate = 10) {
  const subtotal = items.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.unitPrice),
    0
  )
  const tax = Math.round(subtotal * (taxRate / 100))
  return { subtotal, tax, total: subtotal + tax }
}

export async function getAllEstimates(): Promise<Estimate[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  // TODO: v1.4+ — .eq('organization_id', organizationId) でテナント分離フィルタを追加
  const { data, error } = await supabase
    .from('estimates')
    .select('*, estimate_items(*)')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as EstimateRow[]).map(fromRow)
}

export async function getEstimates(projectId: string): Promise<Estimate[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('estimates')
    .select('*, estimate_items(*)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as EstimateRow[]).map(fromRow)
}

export async function getEstimate(id: string): Promise<Estimate | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const { data, error } = await supabase
    .from('estimates')
    .select('*, estimate_items(*)')
    .eq('id', id)
    .single()
  if (error || !data) return undefined
  return fromRow(data as EstimateRow)
}

export async function createEstimate(input: EstimateInput): Promise<Estimate | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return undefined

  const { subtotal, tax, total } = computeTotals(input.items, input.taxRate)

  const { data: estimateData, error: estimateError } = await supabase
    .from('estimates')
    .insert({
      user_id: user.id,
      project_id: input.projectId,
      customer_id: input.customerId ?? null,
      title: input.title,
      status: input.status ?? 'draft',
      subtotal,
      tax,
      total,
      note: input.note ?? null,
    })
    .select()
    .single()
  if (estimateError || !estimateData) return undefined

  const estimateId = (estimateData as EstimateRow).id

  if (input.items.length > 0) {
    const { error: itemsError } = await supabase.from('estimate_items').insert(
      input.items.map((item, i) => ({
        estimate_id: estimateId,
        name: item.name,
        description: item.description ?? null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        amount: Math.round(item.quantity * item.unitPrice),
        sort_order: item.sortOrder ?? i + 1,
      }))
    )
    if (itemsError) {
      // ヘッダーは作成済みだが明細挿入に失敗 → 補償として削除を試みる
      await supabase.from('estimates').delete().eq('id', estimateId)
      throw new Error('見積明細の保存に失敗しました。時間をおいて再度お試しください。')
    }
  }

  return getEstimate(estimateId)
}

export async function updateEstimate(
  id: string,
  input: Partial<EstimateInput>
): Promise<Estimate | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()

  const patch: Record<string, unknown> = {}
  if (input.title !== undefined) patch.title = input.title
  if ('note' in input) patch.note = input.note ?? null
  if ('customerId' in input) patch.customer_id = input.customerId ?? null
  if (input.status !== undefined) patch.status = input.status

  if (input.items !== undefined) {
    const { subtotal, tax, total } = computeTotals(input.items, input.taxRate)
    patch.subtotal = subtotal
    patch.tax = tax
    patch.total = total
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from('estimates').update(patch).eq('id', id)
    if (error) return undefined
  }

  if (input.items !== undefined) {
    const { error: rpcError } = await supabase.rpc('replace_estimate_items', {
      p_estimate_id: id,
      p_items: input.items.map((item, i) => ({
        name: item.name,
        description: item.description ?? null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        amount: Math.round(item.quantity * item.unitPrice),
        sort_order: item.sortOrder ?? i + 1,
      })),
    })
    if (rpcError) throw new Error(`見積明細の保存に失敗しました: ${rpcError.message}`)
  }

  return getEstimate(id)
}

export async function updateEstimateStatus(id: string, status: EstimateStatus): Promise<void> {
  if (!isConfigured()) return
  const supabase = createClient()
  await supabase.from('estimates').update({ status }).eq('id', id)
}

export async function deleteEstimate(id: string): Promise<void> {
  if (!isConfigured()) return
  const supabase = createClient()
  // estimate_items は ON DELETE CASCADE で自動削除
  await supabase.from('estimates').delete().eq('id', id)
}
