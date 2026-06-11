// ─── ProjectOS テナント（契約顧客）管理 ───────────────────────
// TODO: v1.4+ — Supabase の tenants テーブルへ移行

// pending  = 招待待ち（まだメールを送っていない）
// invited  = 招待済み（招待メール送信済み・初回ログイン待ち）
// active   = 利用中（ログイン済み or 利用開始済み）
// suspended = 停止中
export type TenantStatus = 'pending' | 'invited' | 'active' | 'suspended'
export type TenantPlan   = 'β' | 'Basic' | 'Standard' | 'Pro'

export interface Tenant {
  id: string
  companyName: string
  contactName: string
  email: string
  plan: TenantPlan
  status: TenantStatus
  createdAt: string
  updatedAt: string
  authUserId?: string      // Supabase Auth user.id（招待後に設定）
  invitedAt?: string       // 招待メール送信日時
  lastLoginAt?: string     // 最終ログイン日時
  organizationId?: string  // v1.4+ — organizations テーブルの ID
}

export interface TenantInput {
  companyName: string
  contactName: string
  email: string
  plan: TenantPlan
}
