'use client'

import { useState, useEffect } from 'react'
import { Cloud, HardDrive, LogOut } from 'lucide-react'

export default function StorageModeBadge() {
  const [mode, setMode] = useState<'loading' | 'local' | 'cloud'>('loading')

  useEffect(() => {
    const check = async () => {
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        setMode('local')
        return
      }
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setMode(session ? 'cloud' : 'local')
      } catch {
        setMode('local')
      }
    }
    check()
  }, [])

  const handleSignOut = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.reload()
    } catch {
      window.location.reload()
    }
  }

  if (mode === 'loading') return <div className="w-20 h-6" />

  if (mode === 'cloud') {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
          <Cloud className="w-3 h-3" />
          クラウド保存
        </div>
        <button
          onClick={handleSignOut}
          title="ログアウト"
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-1 rounded-full">
      <HardDrive className="w-3 h-3" />
      ローカル保存
    </div>
  )
}
