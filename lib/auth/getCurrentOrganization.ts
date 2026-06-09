/**
 * 現在のユーザーが所属する organization の ID を返す。
 *
 * - Supabase モード → organization_members テーブルから解決
 *   （所属なしの場合は user.id をフォールバックとして使用）
 * - localStorage モード → 'local' を返す
 *
 * TODO: v1.4.1 — 全データモデルに organization_id を付与する
 * TODO: v1.4.2 — organization_members に RLS ポリシーを追加する
 */
export async function getCurrentOrganizationId(): Promise<string> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return 'local'
  }

  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return 'anonymous'

    const { getMemberOrganizationId } = await import('@/lib/supabase/organizations')
    const orgId = await getMemberOrganizationId(supabase, user.id)

    // 組織未所属の場合は user.id を代替使用（後方互換）
    return orgId ?? user.id
  } catch {
    return 'anonymous'
  }
}
