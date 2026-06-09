'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Building2, Shield, Ban, Send, LogOut, RotateCcw,
  Users, CheckCircle2, Clock, XCircle,
} from 'lucide-react'
import { Tenant, TenantInput, TenantStatus } from '@/lib/admin/types'
import { getTenants, createTenant, updateTenantStatus } from '@/lib/admin/storage'
import { isAdminEmail } from '@/lib/admin/guard'
import NewTenantModal from '@/components/admin/NewTenantModal'

const SUPABASE_CONFIGURED = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ─── ステータスバッジ設定 ─────────────────────────────────────

const STATUS_CFG: Record<TenantStatus, { label: string; cls: string }> = {
  active:    { label: '利用中',   cls: 'bg-green-50 text-green-700 border border-green-200' },
  invited:   { label: '招待待ち', cls: 'bg-amber-50 text-amber-700 border border-amber-200'  },
  suspended: { label: '停止中',   cls: 'bg-red-50 text-red-700 border border-red-200'        },
}

const PLAN_CLS: Record<string, string> = {
  Basic:    'bg-gray-100 text-gray-600',
  Standard: 'bg-blue-50 text-blue-700',
  Pro:      'bg-purple-50 text-purple-700',
}

// ─── Toast ────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
      <span>{message}</span>
    </div>
  )
}

function formatDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '/')
}

// ─── Page ─────────────────────────────────────────────────────

export default function AdminPage() {
  const router    = useRouter()
  const [tenants,   setTenants]   = useState<Tenant[]>([])
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [toast,     setToast]     = useState<string | null>(null)

  const showToast = useCallback((msg: string) => setToast(msg), [])

  // ── 管理者ガード + データ初期化 ────────────────────────────

  useEffect(() => {
    async function init() {
      if (!SUPABASE_CONFIGURED) {
        // localStorage モード: 開発・デモ用のため制限なし
        setUserEmail('dev@localhost')
        setTenants(getTenants())
        setLoading(false)
        return
      }

      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user?.email) {
          router.replace('/login')
          return
        }

        if (!isAdminEmail(user.email)) {
          // 管理者でないユーザーはダッシュボードへ
          router.replace('/dashboard')
          return
        }

        setUserEmail(user.email)
        setTenants(getTenants())
      } catch {
        router.replace('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  // ── ハンドラ ───────────────────────────────────────────────

  const handleLogout = async () => {
    if (!SUPABASE_CONFIGURED) { router.replace('/login'); return }
    const { createClient } = await import('@/lib/supabase/client')
    await createClient().auth.signOut()
    router.replace('/login')
  }

  const handleAdd = (input: TenantInput) => {
    const tenant = createTenant(input)
    setTenants(prev => [tenant, ...prev])
    setShowModal(false)
    showToast(`${input.companyName} を追加しました`)
  }

  const handleStatusChange = (id: string, next: TenantStatus) => {
    updateTenantStatus(id, next)
    setTenants(prev =>
      prev.map(t =>
        t.id === id ? { ...t, status: next, updatedAt: new Date().toISOString() } : t
      )
    )
  }

  // ── 集計 ──────────────────────────────────────────────────

  const counts = {
    total:     tenants.length,
    active:    tenants.filter(t => t.status === 'active').length,
    invited:   tenants.filter(t => t.status === 'invited').length,
    suspended: tenants.filter(t => t.status === 'suspended').length,
  }

  // ── ローディング ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── UI ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-7 h-7 bg-blue-600 rounded-lg shrink-0">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="text-sm font-bold text-gray-900">ProjectOS</span>
            <span className="text-gray-300 select-none">/</span>
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5">
              <Shield className="w-3 h-3 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">管理コンソール</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="text-xs text-gray-400 hidden sm:inline">{userEmail}</span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* タイトル + 追加ボタン */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-base font-semibold text-gray-900">契約顧客管理</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              ProjectOS を利用する顧客組織を管理します
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            顧客を追加
          </button>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: '総顧客数', value: counts.total,     icon: Users,         color: 'text-gray-700',  bg: 'bg-gray-100'   },
            { label: '利用中',   value: counts.active,    icon: CheckCircle2,  color: 'text-green-700', bg: 'bg-green-100'  },
            { label: '招待待ち', value: counts.invited,   icon: Clock,         color: 'text-amber-700', bg: 'bg-amber-100'  },
            { label: '停止中',   value: counts.suspended, icon: XCircle,       color: 'text-red-600',   bg: 'bg-red-100'    },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`${s.bg} rounded-lg p-1.5`}>
                  <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                </div>
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* テーブル */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-auto">会社名</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-28">担当者</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-48">メールアドレス</th>
                  <th className="text-center text-xs font-medium text-gray-500 px-4 py-3 w-20">プラン</th>
                  <th className="text-center text-xs font-medium text-gray-500 px-4 py-3 w-24">ステータス</th>
                  <th className="text-center text-xs font-medium text-gray-500 px-4 py-3 w-24">登録日</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3 w-40">アクション</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tenants.map(tenant => {
                  const sc = STATUS_CFG[tenant.status]
                  return (
                    <tr key={tenant.id} className="hover:bg-gray-50/60 transition-colors">

                      {/* 会社名 */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-blue-500" />
                          </div>
                          <span className="font-medium text-gray-900 whitespace-nowrap">
                            {tenant.companyName}
                          </span>
                        </div>
                      </td>

                      {/* 担当者 */}
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                        {tenant.contactName}
                      </td>

                      {/* メール */}
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {tenant.email}
                      </td>

                      {/* プラン */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-md ${PLAN_CLS[tenant.plan] ?? ''}`}>
                          {tenant.plan}
                        </span>
                      </td>

                      {/* ステータス */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-md ${sc.cls}`}>
                          {sc.label}
                        </span>
                      </td>

                      {/* 登録日 */}
                      <td className="px-4 py-3 text-center text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(tenant.createdAt)}
                      </td>

                      {/* アクション */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 招待送信（常に表示・ダミー） */}
                          <button
                            onClick={() => showToast('招待メール送信（未接続）')}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 rounded-md px-2 py-1 transition-colors whitespace-nowrap"
                          >
                            <Send className="w-3 h-3" />
                            招待送信
                          </button>

                          {/* 利用停止 or 再開 */}
                          {tenant.status !== 'suspended' ? (
                            <button
                              onClick={() => handleStatusChange(tenant.id, 'suspended')}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-300 rounded-md px-2 py-1 transition-colors whitespace-nowrap"
                            >
                              <Ban className="w-3 h-3" />
                              利用停止
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(tenant.id, 'active')}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600 border border-gray-200 hover:border-green-300 rounded-md px-2 py-1 transition-colors whitespace-nowrap"
                            >
                              <RotateCcw className="w-3 h-3" />
                              再開
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {tenants.length === 0 && (
            <div className="py-16 text-center text-sm text-gray-400">
              顧客が登録されていません
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          ProjectOS 管理コンソール — 運営者専用
        </p>
      </main>

      {/* 顧客追加モーダル */}
      {showModal && (
        <NewTenantModal
          onClose={() => setShowModal(false)}
          onSaved={handleAdd}
        />
      )}

      {/* トースト通知 */}
      {toast && (
        <Toast message={toast} onDismiss={() => setToast(null)} />
      )}
    </div>
  )
}
