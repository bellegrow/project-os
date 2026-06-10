'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { IS_DEMO_MODE } from '@/lib/demo'

const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function LoginForm() {
  const router  = useRouter()
  const params  = useSearchParams()
  const next    = params.get('next') || '/dashboard'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  // 既にログイン済みなら即リダイレクト
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace(next)
    })
  }, [next, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (authError) throw authError
      router.replace(next)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ログインに失敗しました'
      if (msg.includes('Invalid login credentials')) {
        setError('メールアドレスまたはパスワードが正しくありません')
      } else if (msg.includes('Email not confirmed')) {
        setError('メールアドレスの確認が完了していません。受信トレイをご確認ください。')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-sm font-semibold text-gray-900 mb-1">ログイン</h2>
      <p className="text-xs text-gray-500 mb-5">
        メールアドレスとパスワードを入力してください。
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            メールアドレス
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
            autoComplete="email"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            パスワード
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim() || !password}
          className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              ログイン中...
            </>
          ) : 'ログイン'}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          アカウントをお持ちでない方は{' '}
          <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
            新規登録
          </Link>
        </p>
      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl mb-3">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">ProjectOS</h1>
          <p className="text-xs text-gray-400 mt-1">情報を探す時間は、仕事じゃない。</p>
        </div>

        {IS_DEMO_MODE && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <p className="text-xs font-semibold text-amber-800 mb-2">ログイン不要でお試しできます</p>
            <Link
              href="/dashboard"
              className="inline-block w-full bg-amber-400 hover:bg-amber-500 text-amber-900 font-bold text-sm py-2.5 rounded-xl transition-colors"
            >
              デモを試す →
            </Link>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {!supabaseConfigured ? (
            <div className="text-center py-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Supabase 未設定</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">.env.local</code>{' '}
                に Supabase の環境変数を設定してください。
              </p>
            </div>
          ) : (
            <Suspense fallback={
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              </div>
            }>
              <LoginForm />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  )
}
