'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { IS_DEMO_MODE } from '@/lib/demo'
import {
  LayoutDashboard, Users, Briefcase, ListTodo, MessageSquare,
  FileText, ScrollText, TrendingUp, FolderOpen, Settings, Search,
  ChevronLeft, ChevronRight, LogOut, Trash2,
} from 'lucide-react'
import AppNavTabs from './AppNavTabs'
import StorageModeBadge from './StorageModeBadge'
import { usePlan } from '@/lib/hooks/usePlan'
import { isSubscriptionActive } from '@/lib/planLimits'

const COLLAPSE_KEY = 'pos_sidebar_collapsed'

const NAV_MAIN = [
  { href: '/dashboard',  label: '概況',        icon: LayoutDashboard, key: 'dashboard'  },
  { href: '/customers',  label: '顧客管理',     icon: Users,           key: 'customers'  },
  { href: '/projects',   label: '案件管理',     icon: Briefcase,       key: 'projects'   },
  { href: '/tasks',      label: 'タスク管理',   icon: ListTodo,        key: 'tasks'      },
  { href: '/meetings',   label: '打ち合わせ',   icon: MessageSquare,   key: 'meetings'   },
  { href: '/billing',    label: '見積・請求',   icon: FileText,        key: 'billing'    },
  { href: '/contracts',  label: '契約書',       icon: ScrollText,      key: 'contracts'  },
  { href: '/finance',    label: '利益管理',     icon: TrendingUp,      key: 'finance'    },
  { href: '/files',      label: 'ファイル管理', icon: FolderOpen,      key: 'files'      },
] as const

const NAV_COLORS: Record<string, { activeBg: string; activeIcon: string; mutedBg: string; mutedIcon: string }> = {
  dashboard:  { activeBg: 'bg-blue-100',    activeIcon: 'text-blue-600',    mutedBg: 'bg-blue-50',    mutedIcon: 'text-blue-400'    },
  customers:  { activeBg: 'bg-violet-100',  activeIcon: 'text-violet-600',  mutedBg: 'bg-violet-50',  mutedIcon: 'text-violet-400'  },
  projects:   { activeBg: 'bg-indigo-100',  activeIcon: 'text-indigo-600',  mutedBg: 'bg-indigo-50',  mutedIcon: 'text-indigo-400'  },
  tasks:      { activeBg: 'bg-rose-100',    activeIcon: 'text-rose-600',    mutedBg: 'bg-rose-50',    mutedIcon: 'text-rose-400'    },
  meetings:   { activeBg: 'bg-sky-100',     activeIcon: 'text-sky-600',     mutedBg: 'bg-sky-50',     mutedIcon: 'text-sky-400'     },
  billing:    { activeBg: 'bg-orange-100',  activeIcon: 'text-orange-600',  mutedBg: 'bg-orange-50',  mutedIcon: 'text-orange-400'  },
  contracts:  { activeBg: 'bg-purple-100',  activeIcon: 'text-purple-600',  mutedBg: 'bg-purple-50',  mutedIcon: 'text-purple-400'  },
  finance:    { activeBg: 'bg-emerald-100', activeIcon: 'text-emerald-600', mutedBg: 'bg-emerald-50', mutedIcon: 'text-emerald-400' },
  files:      { activeBg: 'bg-amber-100',   activeIcon: 'text-amber-600',   mutedBg: 'bg-amber-50',   mutedIcon: 'text-amber-400'   },
  settings:   { activeBg: 'bg-gray-100',    activeIcon: 'text-gray-700',    mutedBg: 'bg-gray-50',    mutedIcon: 'text-gray-400'    },
  trash:      { activeBg: 'bg-gray-100',    activeIcon: 'text-gray-700',    mutedBg: 'bg-gray-50',    mutedIcon: 'text-gray-400'    },
}

type NavKey = typeof NAV_MAIN[number]['key'] | 'settings' | 'search' | 'trash'

function getActiveKey(pathname: string): NavKey | null {
  if (pathname === '/dashboard')         return 'dashboard'
  if (pathname.startsWith('/customers')) return 'customers'
  if (pathname.startsWith('/projects'))  return 'projects'
  if (pathname === '/tasks')             return 'tasks'
  if (pathname === '/meetings')          return 'meetings'
  if (pathname === '/billing')           return 'billing'
  if (pathname === '/contracts')         return 'contracts'
  if (pathname === '/finance')           return 'finance'
  if (pathname === '/files')             return 'files'
  if (pathname === '/settings')          return 'settings'
  if (pathname === '/search')            return 'search'
  if (pathname === '/trash')             return 'trash'
  return null
}

function getMobileTab(pathname: string): 'dashboard' | 'projects' | 'tasks' | 'customers' | 'more' | undefined {
  if (pathname === '/dashboard')         return 'dashboard'
  if (pathname.startsWith('/projects'))  return 'projects'
  if (pathname === '/tasks')             return 'tasks'
  if (pathname.startsWith('/customers')) return 'customers'
  if (pathname === '/meetings')          return 'more'
  if (pathname === '/billing')           return 'more'
  if (pathname === '/contracts')         return 'more'
  if (pathname === '/finance')           return 'more'
  if (pathname === '/files')             return 'more'
  if (pathname === '/settings')          return 'more'
  return undefined
}

const SIDEBAR_W_OPEN   = 260
const SIDEBAR_W_CLOSED =  64

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname()
  const router     = useRouter()
  const activeKey  = getActiveKey(pathname)
  const mobileTab  = getMobileTab(pathname)
  const [collapsed,   setCollapsed]   = useState(false)
  const [isLoggedIn,  setIsLoggedIn]  = useState(false)
  const planInfo   = usePlan()

  useEffect(() => {
    try {
      if (localStorage.getItem(COLLAPSE_KEY) === 'true') setCollapsed(true)
    } catch {}
  }, [])

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
    const GUARD_EXEMPT = ['/settings', '/admin', '/onboarding', '/login', '/signup', '/auth']
    if (GUARD_EXEMPT.some(p => pathname === p || pathname.startsWith(p + '/'))) return
    import('@/lib/settingsSource').then(({ getSettings }) => {
      getSettings().then(settings => {
        if (!settings.onboardingCompleted) router.replace('/onboarding')
      })
    })
  }, [pathname, router])

  // 解約・期限切れ → 設定ページ（データ持ち出し猶予）以外はリダイレクト
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
    if (!planInfo) return
    if (isSubscriptionActive(planInfo)) return
    if (pathname === '/settings' || pathname.startsWith('/settings/')) return
    router.replace('/settings')
  }, [planInfo, pathname, router])

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsLoggedIn(!!session)
      })
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
        setIsLoggedIn(!!session)
      })
      return () => subscription.unsubscribe()
    })
  }, [])

  const handleLogout = async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const toggle = () => {
    setCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem(COLLAPSE_KEY, String(next)) } catch {}
      return next
    })
  }

  const isActive = (key: NavKey) => activeKey === key

  const itemCls = (key: NavKey) =>
    `flex items-center rounded-lg text-sm transition-colors whitespace-nowrap ${
      collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-2.5 py-1.5'
    } ${
      isActive(key)
        ? 'bg-white text-gray-900 font-semibold shadow-sm'
        : 'text-slate-600 hover:bg-slate-300/60 hover:text-gray-900 font-medium'
    }`

  const iconBadge = (key: NavKey) => {
    const c = NAV_COLORS[key] ?? NAV_COLORS['settings']
    const active = isActive(key)
    return {
      wrap: `flex items-center justify-center shrink-0 rounded-md transition-colors ${
        collapsed ? 'w-8 h-8' : 'w-[26px] h-[26px]'
      } ${active ? c.activeBg : c.mutedBg}`,
      icon: `${collapsed ? 'w-[18px] h-[18px]' : 'w-[14px] h-[14px]'} ${active ? c.activeIcon : c.mutedIcon}`,
    }
  }

  const sidebarW  = collapsed ? SIDEBAR_W_CLOSED : SIDEBAR_W_OPEN
  const transition = 'width 200ms ease-in-out'

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── PC サイドバー (lg+) ──────────────────────────────────── */}
      <aside
        style={{ width: `${sidebarW}px`, transition }}
        className="hidden lg:flex fixed left-0 top-0 bottom-0 flex-col bg-slate-200 border-r border-slate-300 z-30 overflow-hidden"
      >
        {/* ロゴ + 折りたたみトグル */}
        {collapsed ? (
          <div className="shrink-0 h-14 flex flex-col items-center justify-center gap-1 border-b border-slate-300">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-sm leading-none">P</span>
            </div>
            <button
              onClick={toggle}
              className="p-0.5 rounded text-slate-400 hover:text-slate-700 transition-colors"
              title="サイドバーを展開"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="shrink-0 px-4 py-4 border-b border-slate-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-white font-black text-sm leading-none">P</span>
              </div>
              <span className="text-[15px] font-bold text-slate-900 tracking-tight">ProjectOS</span>
            </div>
            <button
              onClick={toggle}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-300 transition-colors shrink-0"
              title="サイドバーを折りたたむ"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* メインナビ */}
        <nav className={`flex-1 py-3 space-y-0.5 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'}`}>
          {NAV_MAIN.map((item) => {
            const badge = iconBadge(item.key as NavKey)
            return (
              <Link
                key={item.key}
                href={item.href}
                className={itemCls(item.key as NavKey)}
                title={collapsed ? item.label : undefined}
              >
                <div className={badge.wrap}>
                  <item.icon className={badge.icon} />
                </div>
                {!collapsed && item.label}
              </Link>
            )
          })}
        </nav>

        {/* 下部：設定 + ストレージ */}
        <div className={`shrink-0 pb-4 border-t border-slate-300 pt-3 space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
          <Link
            href="/settings"
            className={itemCls('settings')}
            title={collapsed ? '設定' : undefined}
          >
            <div className={iconBadge('settings').wrap}>
              <Settings className={iconBadge('settings').icon} />
            </div>
            {!collapsed && '設定'}
          </Link>
          <Link
            href="/trash"
            className={itemCls('trash')}
            title={collapsed ? 'ゴミ箱' : undefined}
          >
            <div className={iconBadge('trash').wrap}>
              <Trash2 className={iconBadge('trash').icon} />
            </div>
            {!collapsed && 'ゴミ箱'}
          </Link>
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className={`flex items-center rounded-lg text-sm transition-colors text-slate-500 hover:bg-slate-300/60 hover:text-red-500 font-medium ${
                collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-2.5 py-1.5'
              }`}
              title={collapsed ? 'ログアウト' : undefined}
            >
              <div className={`flex items-center justify-center shrink-0 rounded-md bg-slate-300/60 ${collapsed ? 'w-8 h-8' : 'w-[26px] h-[26px]'}`}>
                <LogOut className={`${collapsed ? 'w-[18px] h-[18px]' : 'w-[14px] h-[14px]'} text-slate-500`} />
              </div>
              {!collapsed && 'ログアウト'}
            </button>
          )}
          {!collapsed && (
            <div className="px-3 pt-2">
              <StorageModeBadge />
            </div>
          )}
        </div>
      </aside>

      {/* ── PC 上部検索バー (lg+) ────────────────────────────────── */}
      <div
        style={{ left: `${sidebarW}px`, transition: 'left 200ms ease-in-out' }}
        className="hidden lg:flex fixed top-0 right-0 h-14 bg-white border-b border-slate-300 z-20 items-center px-6"
      >
        <Link
          href="/search"
          className="flex items-center gap-2.5 w-full max-w-xl bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 text-[13px] text-gray-400 hover:bg-white hover:border-blue-300 hover:text-gray-500 transition-colors"
        >
          <Search className="w-4 h-4 shrink-0 text-gray-400" />
          <span className="flex-1">顧客・案件・見積・契約書・ファイルを検索</span>
          <kbd className="text-[10px] font-mono bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded shrink-0">⌘K</kbd>
        </Link>
      </div>

      {/* ── モバイルヘッダー (<lg) ───────────────────────────────── */}
      <header className="lg:hidden bg-white border-b border-slate-300 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-0">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="mb-2 sm:mb-0">
              <h1 className="text-base font-bold text-gray-900">ProjectOS</h1>
              <p className="text-xs text-gray-400">情報を探す時間は、仕事じゃない。</p>
            </div>
            <StorageModeBadge />
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4">
          <AppNavTabs current={mobileTab} />
        </div>
      </header>

      {/* ── デモバナー ──────────────────────────────────────────── */}
      {IS_DEMO_MODE && (
        <div
          style={{ left: collapsed ? 64 : 260, transition: 'left 200ms ease-in-out' }}
          className="hidden lg:flex fixed top-14 right-0 z-10 items-center justify-center gap-2 bg-amber-400 px-4 py-1.5 text-xs font-semibold text-amber-900"
        >
          🎯 これはデモ環境です。データはブラウザにのみ保存され、他のユーザーと共有されません。
          <a href="https://project-os-app.vercel.app/signup" className="underline hover:text-amber-700">本番環境はこちら →</a>
        </div>
      )}

      {/* ── コンテンツ（children は一度だけ） ───────────────────── */}
      <div className={`${IS_DEMO_MODE ? 'lg:pt-[3.25rem]' : ''} lg:pt-14 ${collapsed ? 'lg:pl-16' : 'lg:pl-[260px]'}`}>
        {children}
      </div>

    </div>
  )
}
