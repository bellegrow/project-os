'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Briefcase, ListTodo, MessageSquare,
  FileText, ScrollText, TrendingUp, FolderOpen, Settings, Search,
} from 'lucide-react'
import AppNavTabs from './AppNavTabs'
import StorageModeBadge from './StorageModeBadge'

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

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const activeKey = getActiveKey(pathname)
  const mobileTab = getMobileTab(pathname)

  const navCls = (key: NavKey) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
      activeKey === key
        ? 'bg-blue-50 text-blue-700 font-semibold'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
    }`

  const iconCls = (key: NavKey) =>
    `w-[15px] h-[15px] shrink-0 ${activeKey === key ? 'text-blue-600' : 'text-gray-400'}`

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── PC サイドバー (lg+) ────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[260px] flex-col bg-white border-r border-gray-200 z-30">
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="text-[15px] font-bold text-gray-900 tracking-tight leading-none">ProjectOS</div>
          <div className="text-[11px] text-gray-400 mt-1.5 leading-none">情報を探す時間は、仕事じゃない。</div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {NAV_MAIN.map((item) => (
            <Link key={item.key} href={item.href} className={navCls(item.key as NavKey)}>
              <item.icon className={iconCls(item.key as NavKey)} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="shrink-0 px-3 pb-4 border-t border-gray-100 pt-3 space-y-0.5">
          <Link href="/settings" className={navCls('settings')}>
            <Settings className={iconCls('settings')} />
            設定
          </Link>
          <div className="px-3 pt-2">
            <StorageModeBadge />
          </div>
        </div>
      </aside>

      {/* ── PC 上部検索バー (lg+) ────────────────────────────────────── */}
      <div className="hidden lg:flex fixed top-0 left-[260px] right-0 h-14 bg-white border-b border-gray-200 z-20 items-center px-6">
        <Link
          href="/search"
          className="flex items-center gap-2.5 w-full max-w-xl bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 text-[13px] text-gray-400 hover:bg-white hover:border-blue-300 hover:text-gray-500 transition-colors"
        >
          <Search className="w-4 h-4 shrink-0 text-gray-400" />
          <span className="flex-1">顧客・案件・見積・契約書・ファイルを検索</span>
          <kbd className="text-[10px] font-mono bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded shrink-0">⌘K</kbd>
        </Link>
      </div>

      {/* ── モバイルヘッダー (<lg) ────────────────────────────────────── */}
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

      {/* ── コンテンツ ────────────────────────────────────────────────── */}
      <div className="lg:pl-[260px] lg:pt-14">
        {children}
      </div>

    </div>
  )
}
