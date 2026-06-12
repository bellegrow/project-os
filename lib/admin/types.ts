// ─── ProjectOS テナント（契約顧客）管理 ───────────────────────
import type { OrgPlanId, SubscriptionStatus } from '@/lib/planLimits'

export type { SubscriptionStatus }

// pending   = 招待待ち（まだメールを送っていない）
// invited   = 招待済み（招待メール送信済み・初回ログイン待ち）
// active    = 利用中（ログイン済み or 利用開始済み）
// suspended = 停止中
export type TenantStatus = 'pending' | 'invited' | 'active' | 'suspended'
export type TenantPlan   = 'β' | 'Basic' | 'Standard' | 'Team'

export interface Tenant {
  id:              string
  companyName:     string
  contactName:     string
  email:           string
  plan:            TenantPlan
  status:          TenantStatus
  createdAt:       string
  updatedAt:       string
  authUserId?:     string
  invitedAt?:      string
  lastLoginAt?:    string
  organizationId?: string
  // organizations テーブルから取得するサブスクリプション情報
  orgPlan?:            OrgPlanId
  subscriptionStatus?: SubscriptionStatus
  trialEndsAt?:        string | null
}

export interface TenantInput {
  companyName:  string
  contactName:  string
  email:        string
  plan:         TenantPlan
  // サブスクリプション（EditTenantModal から変更可）
  orgPlan?:            OrgPlanId
  subscriptionStatus?: SubscriptionStatus
  trialEndsAt?:        string | null
}
