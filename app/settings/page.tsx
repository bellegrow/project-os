'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, Cloud, HardDrive, AlertTriangle, CheckCircle2, XCircle, Download, ImageIcon, Trash2, Loader2, Crown } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { useCloudMode } from '@/lib/hooks/useCloudMode'
import {
  getSettings,
  saveSettings,
  isIssuerConfigured,
  isBankConfigured,
  BusinessSettings,
  SETTINGS_DEFAULTS,
} from '@/lib/settingsSource'
import { exportProjectsCsv, exportInvoicesCsv, exportCostsCsv } from '@/lib/csv'
import { PLAN_LABELS, SUB_STATUS_LABEL, SUB_STATUS_CLS, trialDaysLeft, OrgPlanInfo, isSubscriptionActive } from '@/lib/planLimits'
import CsvImportModal from '@/components/CsvImportModal'

const PLAN_CLS: Record<string, string> = {
  'β':       'bg-amber-50 text-amber-700 border border-amber-200',
  'Basic':    'bg-blue-50 text-blue-700 border border-blue-200',
  'Standard': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  'Team':     'bg-purple-50 text-purple-700 border border-purple-200',
}

export default function SettingsPage() {
  const isCloud = useCloudMode()
  const [form, setForm] = useState<BusinessSettings>(SETTINGS_DEFAULTS)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [exporting, setExporting] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState<'customer' | 'project' | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // ── アカウント設定 ────────────────────────────────────────────
  const [profilePlan,   setProfilePlan]   = useState<string | null>(null)
  const [orgPlanInfo,   setOrgPlanInfo]   = useState<OrgPlanInfo | null>(null)
  const [currentEmail,  setCurrentEmail]  = useState('')
  const [newEmail,      setNewEmail]      = useState('')
  const [emailSaving,   setEmailSaving]   = useState(false)
  const [emailMsg,      setEmailMsg]      = useState('')
  const [newPassword,   setNewPassword]   = useState('')
  const [pwSaving,      setPwSaving]      = useState(false)
  const [pwMsg,         setPwMsg]         = useState('')

  useEffect(() => {
    setMounted(true)
    // コールバックからの message / error を URL パラメータで受け取る
    const params = new URLSearchParams(window.location.search)
    const msg = params.get('message')
    const err = params.get('error')
    if (msg) setEmailMsg(msg)
    if (err) setEmailMsg(err)
    if (msg || err) {
      // パラメータをURLから除去
      const url = new URL(window.location.href)
      url.searchParams.delete('message')
      url.searchParams.delete('error')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (isCloud === null) return
    getSettings().then((s) => setForm(s))
    if (isCloud) {
      ;(async () => {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        const authEmail = session.user.email ?? ''
        setCurrentEmail(authEmail)
        const res = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setProfilePlan(data.plan)
          if (data.orgPlan) setOrgPlanInfo(data.orgPlan)
          // auth のメールと tenant のメールが食い違う場合は同期する
          // （確認リンクをクリックして auth 側が変わった後のケース）
          if (authEmail && data.email && data.email !== authEmail) {
            await fetch('/api/profile', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
              body: JSON.stringify({ email: authEmail }),
            })
          }
        }
      })()
    }
  }, [mounted, isCloud])

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newEmail.trim()
    if (!trimmed) return
    setEmailSaving(true)
    setEmailMsg('')
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('ログインが必要です')
      const { error } = await supabase.auth.updateUser(
        { email: trimmed },
        { emailRedirectTo: `${window.location.origin}/auth/callback` }
      )
      if (error) throw error
      // tenants.email の更新は確認リンククリック後に auth 側で変更が確定してから行う。
      // ここでは行わない（確認前に更新すると auth と不整合になるため）。
      setEmailMsg(`確認メールを ${trimmed} に送信しました。メール内のリンクをクリックすると変更が完了します。現在のアドレスにも通知が届く場合があります。`)
      setNewEmail('')
    } catch (err) {
      setEmailMsg(err instanceof Error ? err.message : 'メールアドレスの変更に失敗しました')
    } finally {
      setEmailSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) return
    setPwSaving(true)
    setPwMsg('')
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const { error } = await createClient().auth.updateUser({ password: newPassword })
      if (error) throw error
      setPwMsg('パスワードを変更しました')
      setNewPassword('')
    } catch (err) {
      setPwMsg(err instanceof Error ? err.message : 'パスワードの変更に失敗しました')
    } finally {
      setPwSaving(false)
    }
  }

  const set = <K extends keyof BusinessSettings>(key: K, value: BusinessSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
    setSaveError(null)
  }

  const handleExport = async (key: string, fn: () => Promise<void>) => {
    setExporting(key)
    setExportError(null)
    try {
      await fn()
    } catch {
      setExportError('CSVの出力に失敗しました。')
    } finally {
      setExporting(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setSaveError(null)
    try {
      await saveSettings(form)
      setSaved(true)
    } catch {
      setSaveError('設定の保存に失敗しました。時間をおいて再試行してください。')
    } finally {
      setSaving(false)
    }
  }

  if (!mounted) return null

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError(null)
    if (file.size > 500 * 1024) {
      setLogoError('ロゴ画像は500KB以下にしてください。')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      set('issuerLogoUrl', reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const issuerOk = isIssuerConfigured(form)
  const bankOk = isBankConfigured(form)
  const invoiceNumberOk = form.issuerInvoiceNumber.trim() !== ''

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  const numberInputCls = 'w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

  const isGracePeriod = isCloud && !!orgPlanInfo && !isSubscriptionActive(orgPlanInfo)

  return (
    <AppShell>
      <main className="max-w-2xl mx-auto px-4 py-6 lg:px-8">
        <h2 className="text-base font-semibold text-gray-900 mb-6 hidden lg:block">設定</h2>

        {/* 猶予期間バナー */}
        {isGracePeriod && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                <Download className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  ご契約が終了しました — データをエクスポートしてください
                </p>
                <p className="text-xs text-amber-700 mb-3">
                  現在、データの持ち出し期間中です。下記のエクスポートボタンから全データをCSVで保存できます。
                  期間終了後はアクセスできなくなりますので、お早めにお持ち出しください。
                </p>
                <div className="space-y-2">
                  {[
                    { key: 'projects-grace', label: '案件CSVをダウンロード', fn: exportProjectsCsv },
                    { key: 'invoices-grace', label: '請求CSVをダウンロード', fn: exportInvoicesCsv },
                    { key: 'costs-grace',    label: '原価CSVをダウンロード', fn: exportCostsCsv },
                  ].map(({ key, label, fn }) => (
                    <button
                      key={key}
                      onClick={() => handleExport(key, fn)}
                      disabled={exporting !== null}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-amber-200 rounded-lg text-sm font-medium text-amber-800 hover:bg-amber-50 transition-colors disabled:opacity-50"
                    >
                      <span>{exporting === key ? 'ダウンロード中...' : label}</span>
                      <Download className="w-4 h-4 text-amber-500" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* アカウント設定（クラウドモード時のみ） */}
        {isCloud && (
          <section className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">アカウント設定</h2>

            {/* プラン表示 */}
            <div className="mb-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-sm text-gray-700">契約プラン</span>
                {orgPlanInfo ? (
                  <span className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {PLAN_LABELS[orgPlanInfo.plan] ?? orgPlanInfo.plan}
                  </span>
                ) : profilePlan ? (
                  <span className={`ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full ${PLAN_CLS[profilePlan] ?? 'bg-gray-100 text-gray-600'}`}>
                    {profilePlan}
                  </span>
                ) : (
                  <span className="ml-auto text-xs text-gray-400">読み込み中...</span>
                )}
              </div>
              {orgPlanInfo && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${SUB_STATUS_CLS[orgPlanInfo.subscriptionStatus]}`}>
                    {SUB_STATUS_LABEL[orgPlanInfo.subscriptionStatus]}
                  </span>
                  {orgPlanInfo.subscriptionStatus === 'trialing' && orgPlanInfo.trialEndsAt && (
                    <span className="text-xs text-gray-500">
                      トライアル終了: {orgPlanInfo.trialEndsAt.slice(0, 10).replace(/-/g, '/')}
                      （残{trialDaysLeft(orgPlanInfo.trialEndsAt) ?? 0}日）
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* メールアドレス変更 */}
            <div className="mb-5 pb-4 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-700 mb-1">メールアドレス</p>
              <p className="text-xs text-gray-500 mb-3">
                現在: <span className="font-medium text-gray-700">{currentEmail || '—'}</span>
              </p>
              <form onSubmit={handleEmailChange} className="flex gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="新しいメールアドレス"
                  autoComplete="off"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={emailSaving || !newEmail.trim() || newEmail.trim() === currentEmail}
                  className="bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                >
                  {emailSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  変更
                </button>
              </form>
              {emailMsg && (
                <p className={`text-xs mt-2 leading-relaxed ${
                  emailMsg.startsWith('確認メールを') || emailMsg.startsWith('メールアドレスを変更しました')
                    ? 'text-blue-600'
                    : 'text-red-500'
                }`}>
                  {emailMsg}
                </p>
              )}
            </div>

            {/* パスワード変更 */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-3">パスワード変更</p>
              <form onSubmit={handlePasswordChange} className="flex gap-2">
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="新しいパスワード（6文字以上）"
                  autoComplete="new-password"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={pwSaving || newPassword.length < 6}
                  className="bg-gray-800 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                >
                  {pwSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  変更
                </button>
              </form>
              {pwMsg && (
                <p className={`text-xs mt-2 ${pwMsg.includes('変更しました') ? 'text-emerald-600' : 'text-red-500'}`}>
                  {pwMsg}
                </p>
              )}
            </div>
          </section>
        )}

        {/* 初期設定チェック */}
        <section className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">初期設定チェック</h2>
          <div className="space-y-2">
            <CheckItem ok={issuerOk} label="事業者名" note={issuerOk ? undefined : '見積書・請求書・契約書のPDFに発行者が表示されません'} />
            <CheckItem ok={bankOk} label="振込先情報" note={bankOk ? undefined : '請求書PDFに振込先が表示されません'} />
            <CheckItem ok={invoiceNumberOk} label="インボイス登録番号" optional note={invoiceNumberOk ? undefined : '未設定（インボイス対応不要なら省略可）'} />
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 保存モード */}
          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">保存モード</h2>
            {isCloud === null ? (
              <p className="text-sm text-gray-400">読み込み中...</p>
            ) : isCloud ? (
              <div className="flex items-start gap-3">
                <Cloud className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">クラウド保存（Supabase）</p>
                  <p className="text-xs text-gray-500 mt-0.5">ログイン中のアカウントにデータが同期されます。複数端末から同じデータを利用できます。</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <HardDrive className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">ローカル保存（このブラウザのみ）</p>
                  <p className="text-xs text-gray-500 mt-0.5">データはこのブラウザにのみ保存されます。ログインするとクラウドに同期できます。</p>
                </div>
              </div>
            )}
          </section>

          {/* 事業者情報 */}
          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">会社情報</h2>
            <div className="space-y-4">

              {/* ロゴ */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">会社ロゴ（任意）</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 shrink-0 overflow-hidden">
                    {form.issuerLogoUrl ? (
                      <img src={form.issuerLogoUrl} alt="ロゴ" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      画像を選択
                    </button>
                    {form.issuerLogoUrl && (
                      <button
                        type="button"
                        onClick={() => { set('issuerLogoUrl', ''); if (logoInputRef.current) logoInputRef.current.value = '' }}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        削除
                      </button>
                    )}
                    <p className="text-xs text-gray-400">PNG / JPG / SVG・500KB以下</p>
                  </div>
                </div>
                {logoError && <p className="text-xs text-red-500 mt-1">{logoError}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  会社名・屋号
                  {!issuerOk && <span className="ml-1 text-amber-500">※未設定</span>}
                </label>
                <input
                  type="text"
                  value={form.issuerName}
                  onChange={(e) => set('issuerName', e.target.value)}
                  placeholder="例：株式会社〇〇"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">代表者名（任意）</label>
                  <input
                    type="text"
                    value={form.issuerRepresentativeName}
                    onChange={(e) => set('issuerRepresentativeName', e.target.value)}
                    placeholder="例：山田 太郎"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">部署名・担当者名（任意）</label>
                  <input
                    type="text"
                    value={form.issuerDepartment}
                    onChange={(e) => set('issuerDepartment', e.target.value)}
                    placeholder="例：Web制作事業部"
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">電話番号（任意）</label>
                  <input
                    type="tel"
                    value={form.issuerPhone}
                    onChange={(e) => set('issuerPhone', e.target.value)}
                    placeholder="例：03-1234-5678"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">メールアドレス（任意）</label>
                  <input
                    type="email"
                    value={form.issuerEmail}
                    onChange={(e) => set('issuerEmail', e.target.value)}
                    placeholder="例：info@example.com"
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">郵便番号（任意）</label>
                  <input
                    type="text"
                    value={form.issuerPostalCode}
                    onChange={(e) => set('issuerPostalCode', e.target.value)}
                    placeholder="例：100-0001"
                    className={inputCls}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">住所（任意）</label>
                  <input
                    type="text"
                    value={form.issuerAddress}
                    onChange={(e) => set('issuerAddress', e.target.value)}
                    placeholder="例：東京都千代田区〇〇1-2-3"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">インボイス登録番号（任意）</label>
                <input
                  type="text"
                  value={form.issuerInvoiceNumber}
                  onChange={(e) => set('issuerInvoiceNumber', e.target.value)}
                  placeholder="例：T1234567890123"
                  className={inputCls}
                />
              </div>
            </div>
          </section>

          {/* 振込先情報 */}
          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">
              振込先情報
              {!bankOk && <span className="ml-2 text-xs font-normal text-amber-500">※未設定</span>}
            </h2>
            <p className="text-xs text-gray-400 mb-4">請求書PDFの振込先欄に表示されます。</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">銀行名</label>
                  <input
                    type="text"
                    value={form.bankName}
                    onChange={(e) => set('bankName', e.target.value)}
                    placeholder="例：〇〇銀行"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">支店名</label>
                  <input
                    type="text"
                    value={form.bankBranch}
                    onChange={(e) => set('bankBranch', e.target.value)}
                    placeholder="例：〇〇支店"
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">口座種別</label>
                  <select
                    value={form.bankAccountType}
                    onChange={(e) => set('bankAccountType', e.target.value)}
                    className={`${inputCls} bg-white`}
                  >
                    <option value="普通">普通</option>
                    <option value="当座">当座</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">口座番号</label>
                  <input
                    type="text"
                    value={form.bankAccountNumber}
                    onChange={(e) => set('bankAccountNumber', e.target.value)}
                    placeholder="例：1234567"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">口座名義（カタカナ）</label>
                <input
                  type="text"
                  value={form.bankAccountHolder}
                  onChange={(e) => set('bankAccountHolder', e.target.value)}
                  placeholder="例：カブシキガイシャ〇〇"
                  className={inputCls}
                />
              </div>
            </div>
          </section>

          {/* 見積・請求設定 */}
          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">見積・請求設定</h2>
            <p className="text-xs text-gray-400 mb-4">見積書・請求書PDFのデフォルト値として使われます。</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">消費税率</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.taxRate}
                    onChange={(e) => set('taxRate', Number(e.target.value))}
                    className={numberInputCls}
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">見積書の有効期限</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={form.estimateValidDays}
                    onChange={(e) => set('estimateValidDays', Number(e.target.value))}
                    className={numberInputCls}
                  />
                  <span className="text-sm text-gray-500">日</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">請求書のデフォルト支払期限</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={form.invoiceDueDays}
                    onChange={(e) => set('invoiceDueDays', Number(e.target.value))}
                    className={numberInputCls}
                  />
                  <span className="text-sm text-gray-500">日</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">見積書 備考（任意）</label>
                <textarea
                  value={form.estimateNote}
                  onChange={(e) => set('estimateNote', e.target.value)}
                  placeholder="例：本見積書の有効期限は発行日より30日間です。"
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">請求書 備考（任意）</label>
                <textarea
                  value={form.invoiceNote}
                  onChange={(e) => set('invoiceNote', e.target.value)}
                  placeholder="例：お振込の際は振込手数料をご負担ください。"
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </section>

          {/* 案件状況チェック設定 */}
          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">案件状況チェック設定</h2>
            <p className="text-xs text-gray-400 mb-4">案件一覧・ダッシュボードの🔴🟡判定に使われます。</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">🟡 要確認とする放置日数</p>
                  <p className="text-xs text-gray-400">更新が途絶えた日数がこの値以上で要確認</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={form.neglectedCheckDays}
                    onChange={(e) => set('neglectedCheckDays', Number(e.target.value))}
                    className={numberInputCls}
                  />
                  <span className="text-sm text-gray-500">日</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">🔴 要対応とする放置日数</p>
                  <p className="text-xs text-gray-400">更新が途絶えた日数がこの値以上で要対応</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={form.neglectedActionDays}
                    onChange={(e) => set('neglectedActionDays', Number(e.target.value))}
                    className={numberInputCls}
                  />
                  <span className="text-sm text-gray-500">日</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">🟡 要確認とする利益率</p>
                  <p className="text-xs text-gray-400">利益率がこの値を下回ると要確認</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.profitRateThreshold}
                    onChange={(e) => set('profitRateThreshold', Number(e.target.value))}
                    className={numberInputCls}
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.costOnlyAsCheck}
                  onChange={(e) => set('costOnlyAsCheck', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm text-gray-700">売上未発生・原価先行を🟡要確認にする</p>
                  <p className="text-xs text-gray-400">原価が発生しているのに売上がない案件を要確認とする</p>
                </div>
              </label>
            </div>
          </section>

          {/* 保存ボタン */}
          <div className="space-y-2 pb-8">
            {saveError && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {saveError}
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                  <Check className="w-4 h-4" />
                  保存しました
                </span>
              )}
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? '保存中...' : '設定を保存する'}
              </button>
            </div>
          </div>
        </form>

        {/* データ出力・取り込み */}
        <section className="bg-white border border-gray-200 rounded-xl p-5 mt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">データ出力・取り込み</h2>
          <p className="text-xs text-gray-400 mb-4">CSVで書き出し{isCloud ? '・取り込み' : ''}ができます。ExcelやNotionからの移行にも使えます。</p>
          {exportError && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {exportError}
            </div>
          )}

          {/* 取り込み（クラウドモードのみ） */}
          {isCloud && (
            <>
              <p className="text-xs font-medium text-gray-600 mb-2">取り込み</p>
              <div className="space-y-2 mb-4">
                {[
                  { key: 'customer', label: '顧客CSVを取り込む' },
                  { key: 'project',  label: '案件CSVを取り込む' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setShowImportModal(key as 'customer' | 'project')}
                    className="w-full flex items-center justify-between px-4 py-2.5 border border-blue-200 bg-blue-50 rounded-lg text-sm text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <span>{label}</span>
                    <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* 書き出し */}
          <p className="text-xs font-medium text-gray-600 mb-2">書き出し</p>
          <div className="space-y-2">
            {[
              { key: 'projects', label: '案件CSVを出力', fn: exportProjectsCsv },
              { key: 'invoices', label: '請求CSVを出力', fn: exportInvoicesCsv },
              { key: 'costs',    label: '原価CSVを出力', fn: exportCostsCsv },
            ].map(({ key, label, fn }) => (
              <button
                key={key}
                onClick={() => handleExport(key, fn)}
                disabled={exporting !== null}
                className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{exporting === key ? '出力中...' : label}</span>
                <Download className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </section>

        {showImportModal && (
          <CsvImportModal
            defaultType={showImportModal}
            onClose={() => setShowImportModal(null)}
          />
        )}

        {isCloud === false && (
          <p className="text-xs text-gray-400 text-center mt-4 pb-6">
            現在ローカル保存モードです。ログインするとクラウドに同期され、複数端末から利用できます。
          </p>
        )}
      </main>
    </AppShell>
  )
}

function CheckItem({
  ok,
  label,
  note,
  optional,
}: {
  ok: boolean
  label: string
  note?: string
  optional?: boolean
}) {
  return (
    <div className="flex items-start gap-2.5">
      {ok ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
      ) : (
        <XCircle className={`w-4 h-4 mt-0.5 shrink-0 ${optional ? 'text-gray-300' : 'text-amber-400'}`} />
      )}
      <div>
        <span className={`text-sm ${ok ? 'text-gray-700' : optional ? 'text-gray-400' : 'text-gray-700'}`}>
          {label}
          {optional && !ok && <span className="ml-1 text-xs text-gray-400">（任意）</span>}
        </span>
        {note && (
          <p className={`text-xs mt-0.5 ${optional ? 'text-gray-400' : 'text-amber-600'}`}>{note}</p>
        )}
      </div>
    </div>
  )
}
