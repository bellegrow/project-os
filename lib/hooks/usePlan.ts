'use client'
import { useState, useEffect } from 'react'
import { OrgPlanInfo } from '@/lib/planLimits'

/** ログインユーザーの組織プラン情報を取得するフック */
export function usePlan(): OrgPlanInfo | null {
  const [plan, setPlan] = useState<OrgPlanInfo | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const { data: { session } } = await createClient().auth.getSession()
        if (!session) return
        const res = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        if (data.orgPlan) setPlan(data.orgPlan as OrgPlanInfo)
      } catch {}
    })()
  }, [])

  return plan
}
