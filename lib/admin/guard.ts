/**
 * 管理者メールアドレスによるアクセス制御
 *
 * 設定方法（.env.local）:
 *   NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com,owner@example.com
 *
 * 動作:
 *   - Supabase モード: NEXT_PUBLIC_ADMIN_EMAILS に含まれるメールのみ /admin にアクセス可
 *   - localStorage モード（Supabase 未設定）: /admin は常にアクセス可（開発・デモ用）
 *
 * TODO: v1.4+ — admin ロールを Supabase の user_roles テーブルで管理
 */

export function getAdminEmails(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? ''
  return raw
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string): boolean {
  const admins = getAdminEmails()
  if (admins.length === 0) return false
  return admins.includes(email.toLowerCase().trim())
}
