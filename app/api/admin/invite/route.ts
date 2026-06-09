import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/admin/guard'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: NextRequest) {
  // Supabase 未設定（localStorage モード）はこのルートに来ない想定だが念のため
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Supabase is not configured on this server' },
      { status: 503 }
    )
  }

  // ── 1. Bearer トークンで呼び出し元を検証 ─────────────────────────
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.slice(7)

  // anon key で getUser を呼んでトークンを検証
  const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: { user }, error: verifyError } = await supabaseAnon.auth.getUser(token)
  if (verifyError || !user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. 管理者メールか確認 ──────────────────────────────────────────
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 })
  }

  // ── 3. リクエストボディのバリデーション ───────────────────────────
  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { email } = body
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Missing or invalid email' }, { status: 400 })
  }

  // ── 4. redirectTo の決定 ──────────────────────────────────────────
  // NEXT_PUBLIC_APP_URL が設定されている場合はそれを使用
  // 未設定の場合はリクエストの origin ヘッダーにフォールバック
  const origin = request.headers.get('origin') ?? ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin
  const redirectTo = appUrl ? `${appUrl}/auth/callback` : undefined

  // ── 5. service_role で招待メール送信 ──────────────────────────────
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email.trim().toLowerCase(),
    { ...(redirectTo ? { redirectTo } : {}) }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    userId: data.user?.id ?? null,
  })
}
