/**
 * 設定ルーター
 * - Supabase設定済み かつ セッションあり → Supabase user_settings テーブル（クラウド同期）
 * - それ以外 → localStorage（pos_settings、ブラウザ固有）
 *
 * UI側はこのモジュールのみを使うことで保存先を意識しない。
 */
import {
  BusinessSettings,
  getSettings as getLocalSettings,
  saveSettings as saveLocalSettings,
} from './settings'
import * as sbSettings from './supabase/settings'

async function isCloudMode(): Promise<boolean> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) return false
  try {
    const { createClient } = await import('./supabase/client')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  } catch {
    return false
  }
}

export async function getSettings(): Promise<BusinessSettings> {
  if (await isCloudMode()) return sbSettings.getSettings()
  return getLocalSettings()
}

export async function saveSettings(settings: BusinessSettings): Promise<void> {
  if (await isCloudMode()) return sbSettings.saveSettings(settings)
  saveLocalSettings(settings)
}

export { isIssuerConfigured, isBankConfigured, SETTINGS_DEFAULTS } from './settings'
export type { BusinessSettings } from './settings'
