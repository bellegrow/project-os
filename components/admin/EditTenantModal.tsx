'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Tenant, TenantInput, TenantPlan, SubscriptionStatus } from '@/lib/admin/types'
import type { OrgPlanId } from '@/lib/planLimits'
import { PLAN_LABELS } from '@/lib/planLimits'

const PLANS: TenantPlan[] = ['β', 'Basic', 'Standard', 'Team']
const ORG_PLANS: OrgPlanId[] = ['basic', 'standard', 'team']
const SUB_STATUSES: { value: SubscriptionStatus; label: string }[] = [
  { value: 'trialing', label: 'トライアル中' },
  { value: 'active',   label: '利用中'       },
  { value: 'canceled', label: 'キャンセル済'  },
  { value: 'expired',  label: '期限切れ'      },
]

interface Props {
  tenant: Tenant
  onClose: () => void
  onSaved: (input: TenantInput) => void
}

export default function EditTenantModal({ tenant, onClose, onSaved }: Props) {
  const [companyName,        setCompanyName]        = useState(tenant.companyName)
  const [contactName,        setContactName]        = useState(tenant.contactName)
  const [email,              setEmail]              = useState(tenant.email)
  const [plan,               setPlan]               = useState<TenantPlan>(tenant.plan)
  const [orgPlan,            setOrgPlan]            = useState<OrgPlanId>(tenant.orgPlan ?? 'standard')
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(tenant.subscriptionStatus ?? 'trialing')
  const [trialEndsAt,        setTrialEndsAt]        = useState<string>(
    tenant.trialEndsAt ? tenant.trialEndsAt.slice(0, 10) : ''
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim() || !email.trim()) return
    onSaved({
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      email:       email.trim(),
      plan,
      orgPlan,
      subscriptionStatus,
      trialEndsAt: trialEndsAt ? new Date(trialEndsAt).toISOString() : null,
    })
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-sm font-semibold text-gray-900">顧客を編集</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">

          {/* 基本情報 */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">基本情報</p>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              会社名 <span className="text-red-400">*</span>
            </label>
            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required autoFocus className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">担当者名</label>
            <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              メールアドレス <span className="text-red-400">*</span>
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="off" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">管理ラベル（プラン）</label>
            <select value={plan} onChange={e => setPlan(e.target.value as TenantPlan)} className={inputCls}>
              {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* サブスクリプション */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">サブスクリプション</p>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">適用プラン</label>
            <select value={orgPlan} onChange={e => setOrgPlan(e.target.value as OrgPlanId)} className={inputCls}>
              {ORG_PLANS.map(p => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">ステータス</label>
            <select value={subscriptionStatus} onChange={e => setSubscriptionStatus(e.target.value as SubscriptionStatus)} className={inputCls}>
              {SUB_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">トライアル終了日</label>
            <input
              type="date"
              value={trialEndsAt}
              onChange={e => setTrialEndsAt(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors">
              キャンセル
            </button>
            <button type="submit" disabled={!companyName.trim() || !email.trim()} className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              保存する
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
