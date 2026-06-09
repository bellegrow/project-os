import { createClient, SupabaseClient } from '@supabase/supabase-js'

type OrgRow = {
  id: string
  name: string
  created_at: string
}

type MemberRow = {
  organization_id: string
}

/**
 * service_role クライアントで組織を作成し、owner メンバーを追加する。
 * 招待APIルートでのみ呼び出す（サーバー専用）。
 */
export async function createOrganizationWithOwner(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceRoleClient: SupabaseClient<any>,
  name: string,
  ownerUserId: string
): Promise<string> {
  const { data: org, error: orgError } = await serviceRoleClient
    .from('organizations')
    .insert({ name })
    .select('id')
    .single<OrgRow>()

  if (orgError || !org) {
    throw new Error(orgError?.message ?? 'Failed to create organization')
  }

  const { error: memberError } = await serviceRoleClient
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: ownerUserId,
      role: 'owner',
    })

  if (memberError) {
    throw new Error(memberError.message)
  }

  return org.id
}

/**
 * ユーザーが所属する最初の organization_id を返す。
 * 所属なしの場合は null を返す。
 * 通常の anon クライアントで呼び出す（RLS が必要）。
 *
 * TODO: v1.4.2 — organization_members に RLS ポリシーを追加する
 */
export async function getMemberOrganizationId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle<MemberRow>()

  if (error || !data) return null
  return data.organization_id
}
