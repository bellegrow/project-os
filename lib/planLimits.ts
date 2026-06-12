// ─── プランID（organizations.plan に格納） ───────────────────
export type OrgPlanId = 'basic' | 'standard' | 'team'

// ─── サブスクリプション状態 ──────────────────────────────────
export type SubscriptionStatus = 'trialing' | 'active' | 'canceled' | 'expired'

// ─── organizations から取得するプラン情報 ────────────────────
export interface OrgPlanInfo {
  plan:               OrgPlanId
  subscriptionStatus: SubscriptionStatus
  trialEndsAt:        string | null
}

// ─── 表示ラベル ─────────────────────────────────────────────
export const PLAN_LABELS: Record<OrgPlanId, string> = {
  basic:    'ベーシック',
  standard: 'スタンダード',
  team:     'Team',
}

export const PLAN_PRICE: Record<OrgPlanId, string> = {
  basic:    '¥1,480/月',
  standard: '¥2,980/月',
  team:     '¥9,800/月',
}

export const SUB_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trialing: 'トライアル中',
  active:   '利用中',
  canceled: 'キャンセル済',
  expired:  '期限切れ',
}

export const SUB_STATUS_CLS: Record<SubscriptionStatus, string> = {
  trialing: 'bg-blue-50 text-blue-700 border border-blue-200',
  active:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  canceled: 'bg-gray-100 text-gray-500 border border-gray-200',
  expired:  'bg-red-50 text-red-600 border border-red-200',
}

// ─── プラン別制限 ────────────────────────────────────────────
export const PLAN_LIMITS: Record<OrgPlanId, { maxActiveProjects: number | null }> = {
  basic:    { maxActiveProjects: 5    },
  standard: { maxActiveProjects: null },
  team:     { maxActiveProjects: null },
}

// ─── ユーティリティ ──────────────────────────────────────────

/** サブスクが有効か（trialing かつ期限内、または active） */
export function isSubscriptionActive(info: OrgPlanInfo): boolean {
  if (info.subscriptionStatus === 'active') return true
  if (info.subscriptionStatus === 'trialing') {
    if (!info.trialEndsAt) return true
    return new Date(info.trialEndsAt) > new Date()
  }
  return false
}

/** 進行中案件の最大数（null = 無制限、0 = サブスク無効） */
export function maxActiveProjects(info: OrgPlanInfo): number | null {
  if (!isSubscriptionActive(info)) return 0
  return PLAN_LIMITS[info.plan]?.maxActiveProjects ?? null
}

/** トライアル残り日数（null = トライアル外） */
export function trialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null
  const diff = new Date(trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}
