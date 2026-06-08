'use client'

import { useState, useEffect } from 'react'

/** null = loading, true = Supabaseログイン済み, false = ローカルモード */
export function useCloudMode(): boolean | null {
  const [isCloud, setIsCloud] = useState<boolean | null>(null)

  useEffect(() => {
    const check = async () => {
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        setIsCloud(false)
        return
      }
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setIsCloud(!!session)
      } catch {
        setIsCloud(false)
      }
    }
    check()
  }, [])

  return isCloud
}
