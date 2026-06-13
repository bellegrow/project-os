'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Cloud, MoreHorizontal, X,
  MessageSquare, FileText, ScrollText, TrendingUp, FolderOpen, Settings, Search,
} from 'lucide-react'
import { useCloudMode } from '@/lib/hooks/useCloudMode'

type Tab = 'dashboard' | 'projects' | 'tasks' | 'customers' | 'more'

interface Props {
  current?: Tab
}

const MORE_ITEMS = [
  { href: '/search',    label: '検索',       icon: Search        },
  { href: '/meetings',  label: '打ち合わせ', icon: MessageSquare },
  { href: '/billing',   label: '見積・請求', icon: FileText      },
  { href: '/contracts', label: '契約書',     icon: ScrollText    },
  { href: '/finance',   label: '利益管理',   icon: TrendingUp    },
  { href: '/files',     label: 'ファイル管理', icon: FolderOpen  },
  { href: '/settings',  label: '設定',       icon: Settings      },
]

function tabCls(active: boolean) {
  return `flex-1 py-2 text-xs font-medium border-b-2 transition-colors text-center ${
    active
      ? 'border-blue-600 text-blue-600'
      : 'border-transparent text-gray-400 hover:text-gray-600'
  }`
}

export default function AppNavTabs({ current }: Props) {
  const isCloud = useCloudMode()
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="flex border-t border-gray-100">
        <Link href="/dashboard" className={tabCls(current === 'dashboard')}>概況</Link>
        <Link href="/projects"  className={tabCls(current === 'projects')}>案件</Link>
        <Link href="/tasks"     className={tabCls(current === 'tasks')}>タスク</Link>

        {isCloud ? (
          <Link href="/customers" className={tabCls(current === 'customers')}>顧客</Link>
        ) : (
          <span
            className="flex-1 py-2 text-xs font-medium border-b-2 border-transparent text-gray-300 cursor-not-allowed flex items-center justify-center gap-0.5"
            title="ログインするとクラウドで顧客管理ができます"
          >
            顧客<Cloud className="w-2.5 h-2.5" />
          </span>
        )}

        <button
          onClick={() => setOpen(true)}
          className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-0.5 ${
            current === 'more'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
          その他
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* bottom sheet */}
          <div className="relative bg-white rounded-t-2xl shadow-xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <span className="text-sm font-semibold text-gray-800">メニュー</span>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 px-4 pb-10 pt-1">
              {MORE_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <item.icon className="w-5 h-5 text-gray-500" />
                  <span className="text-xs text-gray-600 font-medium text-center leading-tight">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
