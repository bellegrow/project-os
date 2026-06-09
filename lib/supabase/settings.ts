import { createClient } from './client'
import { BusinessSettings, SETTINGS_DEFAULTS } from '../settings'

type SettingsRow = {
  id: string
  user_id: string
  issuer_name: string
  issuer_representative_name: string | null
  issuer_department: string
  issuer_email: string
  issuer_phone: string
  issuer_postal_code: string
  issuer_address: string
  issuer_invoice_number: string
  issuer_logo_url: string | null
  bank_name: string
  bank_branch: string
  bank_account_type: string
  bank_account_number: string
  bank_account_holder: string
  tax_rate: number
  estimate_valid_days: number
  invoice_due_days: number
  document_note: string
  estimate_note: string | null
  invoice_note: string | null
  neglected_check_days: number
  neglected_action_days: number
  profit_rate_threshold: number
  cost_only_as_check: boolean
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

function fromRow(row: SettingsRow): BusinessSettings {
  const documentNote = row.document_note ?? ''
  return {
    issuerName: row.issuer_name,
    issuerRepresentativeName: row.issuer_representative_name ?? '',
    issuerDepartment: row.issuer_department,
    issuerEmail: row.issuer_email,
    issuerPhone: row.issuer_phone ?? '',
    issuerPostalCode: row.issuer_postal_code ?? '',
    issuerAddress: row.issuer_address ?? '',
    issuerInvoiceNumber: row.issuer_invoice_number ?? '',
    issuerLogoUrl: row.issuer_logo_url ?? '',
    bankName: row.bank_name,
    bankBranch: row.bank_branch,
    bankAccountType: row.bank_account_type,
    bankAccountNumber: row.bank_account_number,
    bankAccountHolder: row.bank_account_holder,
    taxRate: row.tax_rate ?? SETTINGS_DEFAULTS.taxRate,
    estimateValidDays: row.estimate_valid_days ?? SETTINGS_DEFAULTS.estimateValidDays,
    invoiceDueDays: row.invoice_due_days ?? SETTINGS_DEFAULTS.invoiceDueDays,
    documentNote,
    // 旧 documentNote を estimateNote/invoiceNote の初期値として引き継ぐ
    estimateNote: row.estimate_note ?? documentNote,
    invoiceNote: row.invoice_note ?? documentNote,
    neglectedCheckDays: row.neglected_check_days ?? SETTINGS_DEFAULTS.neglectedCheckDays,
    neglectedActionDays: row.neglected_action_days ?? SETTINGS_DEFAULTS.neglectedActionDays,
    profitRateThreshold: row.profit_rate_threshold ?? SETTINGS_DEFAULTS.profitRateThreshold,
    costOnlyAsCheck: row.cost_only_as_check ?? SETTINGS_DEFAULTS.costOnlyAsCheck,
    onboardingCompleted: row.onboarding_completed ?? false,
  }
}

export async function getSettings(): Promise<BusinessSettings> {
  if (!isConfigured()) return SETTINGS_DEFAULTS
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return SETTINGS_DEFAULTS

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data) return SETTINGS_DEFAULTS
  return fromRow(data as SettingsRow)
}

export async function saveSettings(settings: BusinessSettings): Promise<void> {
  if (!isConfigured()) return
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase.from('user_settings').upsert(
    {
      user_id: user.id,
      issuer_name: settings.issuerName,
      issuer_representative_name: settings.issuerRepresentativeName,
      issuer_department: settings.issuerDepartment,
      issuer_email: settings.issuerEmail,
      issuer_phone: settings.issuerPhone,
      issuer_postal_code: settings.issuerPostalCode,
      issuer_address: settings.issuerAddress,
      issuer_invoice_number: settings.issuerInvoiceNumber,
      issuer_logo_url: settings.issuerLogoUrl,
      bank_name: settings.bankName,
      bank_branch: settings.bankBranch,
      bank_account_type: settings.bankAccountType,
      bank_account_number: settings.bankAccountNumber,
      bank_account_holder: settings.bankAccountHolder,
      tax_rate: settings.taxRate,
      estimate_valid_days: settings.estimateValidDays,
      invoice_due_days: settings.invoiceDueDays,
      document_note: settings.documentNote,
      estimate_note: settings.estimateNote,
      invoice_note: settings.invoiceNote,
      neglected_check_days: settings.neglectedCheckDays,
      neglected_action_days: settings.neglectedActionDays,
      profit_rate_threshold: settings.profitRateThreshold,
      cost_only_as_check: settings.costOnlyAsCheck,
      onboarding_completed: settings.onboardingCompleted,
    },
    { onConflict: 'user_id' }
  )
  if (error) throw new Error(error.message)
}
