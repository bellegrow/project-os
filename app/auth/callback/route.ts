import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code       = searchParams.get('code')
  const tokenHash  = searchParams.get('token_hash')
  const type       = searchParams.get('type')
  const next       = searchParams.get('next') ?? '/dashboard'

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // PKCE flow (signup email confirmation)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Invite / password reset / email change flow
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'invite' | 'recovery' | 'email' | 'email_change',
    })
    if (!error) {
      if (type === 'invite' || type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/update-password`)
      }
      if (type === 'email_change') {
        return NextResponse.redirect(`${origin}/settings?message=メールアドレスを変更しました`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
    // OTP期限切れ・無効リンクの場合は専用エラーページへ
    if (type === 'email_change') {
      return NextResponse.redirect(`${origin}/settings?error=確認リンクの有効期限が切れています。設定ページからもう一度メールアドレス変更を送信してください。`)
    }
  }

  // code も token_hash もない = Supabase の追加リダイレクトや直接アクセス
  // エラーを出さずにダッシュボードへ（ログイン済みならそのまま、未ログインならミドルウェアが /login へ飛ばす）
  if (!code && !tokenHash) {
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // code / token_hash はあったが検証失敗 = 本当の認証エラー
  return NextResponse.redirect(`${origin}/login?error=認証に失敗しました`)
}
