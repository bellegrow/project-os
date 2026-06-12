import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/admin/guard'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

function serviceClient() {
  return createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return false
  const token = auth.slice(7)
  const anon = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: { user } } = await anon.auth.getUser(token)
  return !!(user?.email && isAdminEmail(user.email))
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const admin = serviceClient()

  // ── tenants テーブルの更新 ─────────────────────────────────
  const tenantUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.companyName    !== undefined) tenantUpdates.company_name    = body.companyName
  if (body.contactName    !== undefined) tenantUpdates.contact_name    = body.contactName
  if (body.email          !== undefined) tenantUpdates.email           = body.email
  if (body.plan           !== undefined) tenantUpdates.plan            = body.plan
  if (body.status         !== undefined) tenantUpdates.status          = body.status
  if (body.invitedAt      !== undefined) tenantUpdates.invited_at      = body.invitedAt
  if (body.authUserId     !== undefined) tenantUpdates.auth_user_id    = body.authUserId
  if (body.organizationId !== undefined) tenantUpdates.organization_id = body.organizationId

  const { error: tenantError } = await admin
    .from('tenants')
    .update(tenantUpdates)
    .eq('id', id)

  if (tenantError) return NextResponse.json({ error: tenantError.message }, { status: 500 })

  // ── Supabase Auth のban同期 ────────────────────────────────
  if (body.status === '停止中' || body.status === '利用中') {
    const { data: tenant } = await admin
      .from('tenants')
      .select('auth_user_id')
      .eq('id', id)
      .single()

    if (tenant?.auth_user_id) {
      await admin.auth.admin.updateUserById(tenant.auth_user_id, {
        ban_duration: body.status === '停止中' ? '876000h' : 'none',
      })
    }
  }

  // ── organizations テーブルの更新（サブスクリプション情報） ──
  const hasOrgUpdate = body.orgPlan !== undefined
    || body.subscriptionStatus !== undefined
    || body.trialEndsAt !== undefined

  if (hasOrgUpdate) {
    // テナントの organization_id を取得
    const { data: tenant } = await admin
      .from('tenants')
      .select('organization_id')
      .eq('id', id)
      .single()

    if (tenant?.organization_id) {
      const orgUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (body.orgPlan            !== undefined) orgUpdates.plan                = body.orgPlan
      if (body.subscriptionStatus !== undefined) orgUpdates.subscription_status = body.subscriptionStatus
      if (body.trialEndsAt        !== undefined) orgUpdates.trial_ends_at       = body.trialEndsAt

      await admin
        .from('organizations')
        .update(orgUpdates)
        .eq('id', tenant.organization_id)
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  const { error } = await serviceClient()
    .from('tenants')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
