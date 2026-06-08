import { createClient } from './client'
import { Invoice, InvoiceItem, InvoiceStatus, InvoiceInput, PaymentInput } from '../types'

type InvoiceItemRow = {
  id: string
  invoice_id: string
  name: string
  description: string | null
  quantity: number
  unit_price: number
  amount: number
  sort_order: number
}

type InvoiceRow = {
  id: string
  user_id: string
  project_id: string
  customer_id: string | null
  estimate_id: string | null
  title: string
  status: string
  subtotal: number
  tax: number
  total: number
  due_date: string | null
  note: string | null
  paid_at: string | null
  paid_amount: number | null
  payment_note: string | null
  created_at: string
  updated_at: string
  invoice_items?: InvoiceItemRow[]
}

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

function itemFromRow(row: InvoiceItemRow): InvoiceItem {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    name: row.name,
    description: row.description ?? undefined,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    amount: row.amount,
    sortOrder: row.sort_order,
  }
}

function fromRow(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    projectId: row.project_id,
    customerId: row.customer_id ?? undefined,
    estimateId: row.estimate_id ?? undefined,
    title: row.title,
    status: row.status as InvoiceStatus,
    subtotal: row.subtotal,
    tax: row.tax,
    total: row.total,
    dueDate: row.due_date ?? undefined,
    note: row.note ?? undefined,
    paidAt: row.paid_at ?? undefined,
    paidAmount: row.paid_amount ?? undefined,
    paymentNote: row.payment_note ?? undefined,
    items: (row.invoice_items ?? [])
      .map(itemFromRow)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function computeTotals(items: InvoiceInput['items'], taxRate = 10) {
  const subtotal = items.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.unitPrice),
    0
  )
  const tax = Math.round(subtotal * (taxRate / 100))
  return { subtotal, tax, total: subtotal + tax }
}

export async function getInvoices(projectId: string): Promise<Invoice[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as InvoiceRow[]).map(fromRow)
}

export async function getAllInvoices(): Promise<Invoice[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as InvoiceRow[]).map(fromRow)
}

export async function getInvoice(id: string): Promise<Invoice | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('id', id)
    .single()
  if (error || !data) return undefined
  return fromRow(data as InvoiceRow)
}

export async function createInvoice(input: InvoiceInput): Promise<Invoice | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return undefined

  const { subtotal, tax, total } = computeTotals(input.items, input.taxRate)

  const { data: invData, error: invError } = await supabase
    .from('invoices')
    .insert({
      user_id: user.id,
      project_id: input.projectId,
      customer_id: input.customerId ?? null,
      estimate_id: input.estimateId ?? null,
      title: input.title,
      status: input.status ?? 'draft',
      subtotal,
      tax,
      total,
      due_date: input.dueDate ?? null,
      note: input.note ?? null,
    })
    .select()
    .single()
  if (invError || !invData) return undefined

  const invoiceId = (invData as InvoiceRow).id

  if (input.items.length > 0) {
    const { error: itemsError } = await supabase.from('invoice_items').insert(
      input.items.map((item, i) => ({
        invoice_id: invoiceId,
        name: item.name,
        description: item.description ?? null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        amount: Math.round(item.quantity * item.unitPrice),
        sort_order: item.sortOrder ?? i + 1,
      }))
    )
    if (itemsError) {
      await supabase.from('invoices').delete().eq('id', invoiceId)
      throw new Error('請求明細の保存に失敗しました。時間をおいて再度お試しください。')
    }
  }

  return getInvoice(invoiceId)
}

export async function updateInvoice(
  id: string,
  input: Partial<InvoiceInput>
): Promise<Invoice | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()

  const patch: Record<string, unknown> = {}
  if (input.title !== undefined) patch.title = input.title
  if ('note' in input) patch.note = input.note ?? null
  if ('customerId' in input) patch.customer_id = input.customerId ?? null
  if ('estimateId' in input) patch.estimate_id = input.estimateId ?? null
  if (input.status !== undefined) patch.status = input.status
  if ('dueDate' in input) patch.due_date = input.dueDate ?? null

  if (input.items !== undefined) {
    const { subtotal, tax, total } = computeTotals(input.items, input.taxRate)
    patch.subtotal = subtotal
    patch.tax = tax
    patch.total = total
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from('invoices').update(patch).eq('id', id)
    if (error) return undefined
  }

  if (input.items !== undefined) {
    const { error: rpcError } = await supabase.rpc('replace_invoice_items', {
      p_invoice_id: id,
      p_items: input.items.map((item, i) => ({
        name: item.name,
        description: item.description ?? null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        amount: Math.round(item.quantity * item.unitPrice),
        sort_order: item.sortOrder ?? i + 1,
      })),
    })
    if (rpcError) throw new Error(`請求明細の保存に失敗しました: ${rpcError.message}`)
  }

  return getInvoice(id)
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<void> {
  if (!isConfigured()) return
  const supabase = createClient()
  const { error } = await supabase.from('invoices').update({ status }).eq('id', id)
  if (error) throw new Error(`請求書ステータスの更新に失敗しました: ${error.message}`)
}

export async function recordPayment(id: string, input: PaymentInput): Promise<Invoice | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const { error } = await supabase.from('invoices').update({
    status: 'paid',
    paid_at: input.paidAt,
    paid_amount: input.paidAmount,
    payment_note: input.paymentNote ?? null,
  }).eq('id', id)
  if (error) return undefined
  return getInvoice(id)
}

export async function cancelPayment(id: string): Promise<Invoice | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const invoice = await getInvoice(id)
  if (!invoice) return undefined
  const todayStr = new Date().toISOString().split('T')[0]
  // dueDate なし（下書きのまま入金された可能性）→ draft に戻す
  // dueDate あり → 超過なら overdue、未超過なら sent
  const newStatus: InvoiceStatus = !invoice.dueDate
    ? 'draft'
    : invoice.dueDate < todayStr ? 'overdue' : 'sent'
  const { error } = await supabase.from('invoices').update({
    status: newStatus,
    paid_at: null,
    paid_amount: null,
    payment_note: null,
  }).eq('id', id)
  if (error) throw new Error(`入金取り消しに失敗しました: ${error.message}`)
  return getInvoice(id)
}

export async function deleteInvoice(id: string): Promise<void> {
  if (!isConfigured()) return
  const supabase = createClient()
  // invoice_items は ON DELETE CASCADE で自動削除
  await supabase.from('invoices').delete().eq('id', id)
}
