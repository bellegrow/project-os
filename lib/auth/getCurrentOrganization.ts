/**
 * 現在のユーザーが所属する organization の ID を返す。
 *
 * 【現在の実装】
 *   - Supabase モード → user.id を organizationId として代替使用
 *     （現時点では 1 ユーザー = 1 組織 相当）
 *   - localStorage モード → 'local' を返す
 *
 * TODO: v1.4+ — organizations / organization_members テーブルを実装後、
 *   ユーザーが所属する組織を動的に解決するよう変更する。
 *   例: supabase.from('organization_members').select('organization_id').eq('user_id', user.id)
 *
 * 想定する将来の組織階層:
 *   Organization
 *     ├─ customers
 *     ├─ projects
 *     ├─ tasks
 *     ├─ meetings (activities)
 *     ├─ estimates / invoices
 *     ├─ contracts
 *     ├─ project_costs
 *     └─ project_files
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
    // TODO: v1.4+ — organization_members テーブルから所属 organizationId を取得
    return user?.id ?? 'anonymous'
  } catch {
    return 'anonymous'
  }
}
