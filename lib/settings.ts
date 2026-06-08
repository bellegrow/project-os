const SETTINGS_KEY = 'pos_settings'

export interface BusinessSettings {
  // 事業者情報
  issuerName: string
  issuerDepartment: string
  issuerEmail: string
  issuerPhone: string
  issuerPostalCode: string
  issuerAddress: string
  issuerInvoiceNumber: string
  // 振込先情報
  bankName: string
  bankBranch: string
  bankAccountType: string
  bankAccountNumber: string
  bankAccountHolder: string
  // 書類表示設定
  taxRate: number
  estimateValidDays: number
  invoiceDueDays: number
  documentNote: string
  // 案件状況チェック設定
  neglectedCheckDays: number
  neglectedActionDays: number
  profitRateThreshold: number
  costOnlyAsCheck: boolean
}

export const SETTINGS_DEFAULTS: BusinessSettings = {
  issuerName: '',
  issuerDepartment: '',
  issuerEmail: '',
  issuerPhone: '',
  issuerPostalCode: '',
  issuerAddress: '',
  issuerInvoiceNumber: '',
  bankName: '',
  bankBranch: '',
  bankAccountType: '普通',
  bankAccountNumber: '',
  bankAccountHolder: '',
  taxRate: 10,
  estimateValidDays: 30,
  invoiceDueDays: 30,
  documentNote: '',
  neglectedCheckDays: 7,
  neglectedActionDays: 14,
  profitRateThreshold: 20,
  costOnlyAsCheck: true,
}

export function getSettings(): BusinessSettings {
  if (typeof window === 'undefined') return SETTINGS_DEFAULTS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...SETTINGS_DEFAULTS, ...JSON.parse(raw) } : SETTINGS_DEFAULTS
  } catch {
    return SETTINGS_DEFAULTS
  }
}

export function saveSettings(settings: BusinessSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function isIssuerConfigured(s: BusinessSettings): boolean {
  return s.issuerName.trim() !== ''
}

export function isBankConfigured(s: BusinessSettings): boolean {
  return s.bankName.trim() !== '' && s.bankAccountNumber.trim() !== ''
}
