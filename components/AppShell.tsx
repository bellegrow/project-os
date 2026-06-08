'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Briefcase, ListTodo, MessageSquare,
  FileText, ScrollText, TrendingUp, FolderOpen, Settings, Search,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import AppNavTabs from './AppNavTabs'
import StorageModeBadge from './StorageModeBadge'

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

type NavKey = typeof NAV_MAIN[number]['key'] | 'settings' | 'search'

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
  return null
}

function getMobileTab(pathname: string): 'dashboard' | 'projects' | 'tasks' | 'customers' | 'settings' | 'search' | undefined {
  if (pathname === '/dashboard')         return 'dashboard'
  if (pathname.startsWith('/projects'))  return 'projects'
  if (pathname === '/tasks')             return 'tasks'
  if (pathname.startsWith('/customers')) return 'customers'
  if (pathname === '/settings')          return 'settings'
  if (pathname === '/search')            return 'search'
  return undefined
}

const SIDEBAR_W_OPEN   = 260
const SIDEBAR_W_CLOSED =  64

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname()
  const activeKey  = getActiveKey(pathname)
  const mobileTab  = getMobileTab(pathname)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(COLLAPSE_KEY) === 'true') setCollapsed(true)
    } catch {}
  }, [])

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
      collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2'
    } ${
      isActive(key)
        ? 'bg-blue-50 text-blue-700 font-semibold'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
    }`

  const iconCls = (key: NavKey) =>
    `shrink-0 ${collapsed ? 'w-5 h-5' : 'w-[15px] h-[15px]'} ${
      isActive(key) ? 'text-blue-600' : 'text-gray-400'
    }`

  const sidebarW  = collapsed ? SIDEBAR_W_CLOSED : SIDEBAR_W_OPEN
  const transition = 'width 200ms ease-in-out'

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── PC サイドバー (lg+) ──────────────────────────────────── */}
      <aside
        style={{ width: `${sidebarW}px`, transition }}
        className="hidden lg:flex fixed left-0 top-0 bottom-0 flex-col bg-white border-r border-gray-200 z-30 overflow-hidden"
      >
        {/* ロゴ + 折りたたみトグル */}
        {collapsed ? (
          <div className="shrink-0 h-14 flex items-center justify-center border-b border-gray-100">
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="サイドバーを展開"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="shrink-0 px-5 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-2">
            <div>
              <div className="text-[15px] font-bold text-gray-900 tracking-tight leading-none">ProjectOS</div>
              <div className="text-[11px] text-gray-400 mt-1.5 leading-none">情報を探す時間は、仕事じゃない。</div>
            </div>
            <button
              onClick={toggle}
              className="mt-0.5 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
              title="サイドバーを折りたたむ"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* メインナビ */}
        <nav className={`flex-1 py-3 space-y-0.5 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'}`}>
          {NAV_MAIN.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={itemCls(item.key as NavKey)}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={iconCls(item.key as NavKey)} />
              {!collapsed && item.label}
            </Link>
          ))}
        </nav>

        {/* 下部：設定 + ストレージ */}
        <div className={`shrink-0 pb-4 border-t border-gray-100 pt-3 space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
          <Link
            href="/settings"
            className={itemCls('settings')}
            title={collapsed ? '設定' : undefined}
          >
            <Settings className={iconCls('settings')} />
            {!collapsed && '設定'}
          </Link>
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
        className="hidden lg:flex fixed top-0 right-0 h-14 bg-white border-b border-gray-200 z-20 items-center px-6"
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
      <header className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
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

      {/* ── コンテンツ（children は一度だけ） ───────────────────── */}
      <div className={`lg:pt-14 ${collapsed ? 'lg:pl-16' : 'lg:pl-[260px]'}`}>
        {children}
      </div>

    </div>
  )
}
