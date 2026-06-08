import { createClient } from './client'

export type HealthResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'not_configured' | 'not_logged_in' | 'error'; message?: string }

/**
 * Supabase 接続 + 認証状態を確認する診断関数。
 * 開発時のデバッグや v2.2 完了確認に使用する。
 */
export async function checkSupabaseHealth(): Promise<HealthResult> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { ok: false, reason: 'not_configured' }
  }

  try {
    const supabase = createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) return { ok: false, reason: 'error', message: error.message }
    if (!user) return { ok: false, reason: 'not_logged_in' }

    return { ok: true, userId: user.id }
  } catch (e) {
    return {
      ok: false,
      reason: 'error',
      message: e instanceof Error ? e.message : String(e),
    }
  }
}
