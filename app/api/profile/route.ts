import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { OrgPlanId, SubscriptionStatus } from '@/lib/planLimits'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

function serviceClient() {
  return createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function getAuthUser(request: NextRequest) {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const anon = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: { user } } = await anon.auth.getUser(token)
  return user ?? null
}

// GET /api/profile — ログインユーザーのテナント情報 + 組織プランを返す
export async function GET(request: NextRequest) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = serviceClient()

  // テナント情報
  const { data: tenant } = await admin
    .from('tenants')
    .select('plan, email, company_name, contact_name, status')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  // 組織プラン（organizations テーブル）
  let orgPlan: { plan: OrgPlanId; subscriptionStatus: SubscriptionStatus; trialEndsAt: string | null } | null = null

  const { data: member } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (member?.organization_id) {
    const { data: org } = await admin
      .from('organizations')
      .select('plan, subscription_status, trial_ends_at')
      .eq('id', member.organization_id)
      .maybeSingle()

    if (org) {
      orgPlan = {
        plan:               (org.plan ?? 'standard') as OrgPlanId,
        subscriptionStatus: (org.subscription_status ?? 'trialing') as SubscriptionStatus,
        trialEndsAt:        org.trial_ends_at ?? null,
      }
    }
  }

  return NextResponse.json({
    plan:        tenant?.plan        ?? null,
    email:       tenant?.email       ?? user.email,
    companyName: tenant?.company_name ?? null,
    contactName: tenant?.contact_name ?? null,
    status:      tenant?.status       ?? null,
    orgPlan,
  })
}

// PATCH /api/profile — テナントのメールアドレスを更新
export async function PATCH(request: NextRequest) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.email !== undefined) updates.email = body.email

  const { error } = await serviceClient()
    .from('tenants')
    .update(updates)
    .eq('auth_user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
