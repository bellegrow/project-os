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

function toTenant(row: Record<string, unknown>, orgData?: Record<string, unknown> | null) {
  return {
    id:                 row.id,
    companyName:        row.company_name,
    contactName:        row.contact_name,
    email:              row.email,
    plan:               row.plan,
    status:             row.status,
    invitedAt:          row.invited_at      ?? undefined,
    authUserId:         row.auth_user_id    ?? undefined,
    organizationId:     row.organization_id ?? undefined,
    createdAt:          row.created_at,
    updatedAt:          row.updated_at,
    // organizations テーブルのサブスクリプション情報
    orgPlan:            orgData?.plan               ?? null,
    subscriptionStatus: orgData?.subscription_status ?? null,
    trialEndsAt:        orgData?.trial_ends_at       ?? null,
  }
}

export async function GET(request: NextRequest) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = serviceClient()

  const { data: tenants, error } = await admin
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!tenants?.length) return NextResponse.json([])

  // organization_id を持つテナントの組織データを取得
  const orgIds = tenants
    .map((t: Record<string, unknown>) => t.organization_id as string)
    .filter(Boolean)

  const orgMap = new Map<string, Record<string, unknown>>()
  if (orgIds.length > 0) {
    const { data: orgs } = await admin
      .from('organizations')
      .select('id, plan, subscription_status, trial_ends_at')
      .in('id', orgIds)
    if (orgs) {
      orgs.forEach((o: Record<string, unknown>) => orgMap.set(o.id as string, o))
    }
  }

  return NextResponse.json(
    tenants.map((t: Record<string, unknown>) =>
      toTenant(t, t.organization_id ? orgMap.get(t.organization_id as string) : null)
    )
  )
}

export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { companyName?: string; contactName?: string; email?: string; plan?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.companyName || !body.email) {
    return NextResponse.json({ error: 'companyName and email are required' }, { status: 400 })
  }

  const { data, error } = await serviceClient()
    .from('tenants')
    .insert({
      company_name: body.companyName.trim(),
      contact_name: (body.contactName ?? '').trim(),
      email:        body.email.trim().toLowerCase(),
      plan:         body.plan ?? 'Basic',
      status:       'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(toTenant(data as Record<string, unknown>))
}
