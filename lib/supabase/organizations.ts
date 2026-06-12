import { SupabaseClient } from '@supabase/supabase-js'

type OrgRow = {
  id: string
  name: string
  plan: string
  subscription_status: string
  trial_ends_at: string | null
  created_at: string
}

type MemberRow = {
  organization_id: string
}

const TRIAL_DAYS = 30

/**
 * service_role クライアントで組織を作成し、owner メンバーを追加する。
 * plan='standard', subscription_status='trialing', trial_ends_at=now()+30日 を自動設定。
 */
export async function createOrganizationWithOwner(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceRoleClient: SupabaseClient<any>,
  name: string,
  ownerUserId: string
): Promise<string> {
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: org, error: orgError } = await serviceRoleClient
    .from('organizations')
    .insert({
      name,
      plan:                'standard',
      subscription_status: 'trialing',
      trial_ends_at:       trialEndsAt,
    })
    .select('id')
    .single<OrgRow>()

  if (orgError || !org) {
    throw new Error(orgError?.message ?? 'Failed to create organization')
  }

  const { error: memberError } = await serviceRoleClient
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id:         ownerUserId,
      role:            'owner',
    })

  if (memberError) {
    throw new Error(memberError.message)
  }

  return org.id
}

/**
 * ユーザーが所属する最初の organization_id を返す。
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
