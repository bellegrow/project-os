'use client'

import Link from 'next/link'
import { Settings, Cloud, Search } from 'lucide-react'
import { useCloudMode } from '@/lib/hooks/useCloudMode'

interface Props {
  current?: 'dashboard' | 'projects' | 'tasks' | 'customers' | 'settings' | 'search'
}

export default function AppNavTabs({ current }: Props) {
  const isCloud = useCloudMode()

  return (
    <div className="flex gap-0 border-t border-gray-100">
      <Link
        href="/dashboard"
        className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
          current === 'dashboard'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-400 hover:text-gray-600'
        }`}
      >
        概況
      </Link>
      <Link
        href="/projects"
        className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
          current === 'projects'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-400 hover:text-gray-600'
        }`}
      >
        案件
      </Link>
      <Link
        href="/tasks"
        className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
          current === 'tasks'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-400 hover:text-gray-600'
        }`}
      >
        タスク
      </Link>

      {isCloud ? (
        <Link
          href="/customers"
          className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            current === 'customers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          顧客
        </Link>
      ) : (
        <span
          className="px-4 py-2 text-xs font-medium border-b-2 border-transparent text-gray-300 cursor-not-allowed flex items-center gap-1"
          title="ログインするとクラウドで顧客管理ができます"
        >
          顧客
          <Cloud className="w-2.5 h-2.5" />
        </span>
      )}

      <Link
        href="/search"
        className={`ml-auto px-3 py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
          current === 'search'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-400 hover:text-gray-600'
        }`}
        title="検索 (⌘K)"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-[10px] font-mono opacity-60 tracking-tight">⌘K</span>
      </Link>

      <Link
        href="/settings"
        className={`px-3 py-2 border-b-2 transition-colors flex items-center gap-1 ${
          current === 'settings'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-400 hover:text-gray-600'
        }`}
        title="設定"
      >
        <Settings className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
