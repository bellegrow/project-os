// ─── ProjectOS テナント（契約顧客）管理 ───────────────────────
// TODO: v1.4+ — Supabase の tenants テーブルへ移行

export type TenantStatus = 'active' | 'invited' | 'suspended'
export type TenantPlan   = 'Basic' | 'Standard' | 'Pro'

export interface Tenant {
  id: string
  companyName: string
  contactName: string
  email: string
  plan: TenantPlan
  status: TenantStatus
  createdAt: string
  updatedAt: string
}

export interface TenantInput {
  companyName: string
  contactName: string
  email: string
  plan: TenantPlan
}
