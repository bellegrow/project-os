'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function SignupForm() {
  const router = useRouter()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [done,     setDone]     = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      return
    }
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (authError) throw authError

      // メール確認不要の場合（auto-confirm）はセッションが即生成される
      if (data.session) {
        router.replace('/dashboard')
      } else {
        // メール確認が必要
        setDone(true)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'アカウント作成に失敗しました'
      if (msg.includes('already registered') || msg.includes('User already registered')) {
        setError('このメールアドレスはすでに登録されています。ログインしてください。')
      } else if (msg.includes('Password should be')) {
        setError('パスワードは6文字以上で入力してください')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-blue-500" />
        </div>
        <p className="text-sm font-medium text-gray-900 mb-2">確認メールを送信しました</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-medium">{email}</span> に確認メールを送りました。
          メール内のリンクをクリックしてアカウントを有効化してください。
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          ログインページへ
        </Link>
      </div>
    )
  }

  return (
    <>
      <h2 className="text-sm font-semibold text-gray-900 mb-1">新規登録</h2>
      <p className="text-xs text-gray-500 mb-5">
        メールアドレスとパスワードを設定してください。
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
            <span className="text-gray-400 font-normal ml-1">（6文字以上）</span>
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
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
              作成中...
            </>
          ) : 'アカウントを作成'}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          すでにアカウントをお持ちの方は{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
            ログイン
          </Link>
        </p>
      </div>
    </>
  )
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-900 rounded-xl mb-3">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">ProjectOS</h1>
          <p className="text-xs text-gray-400 mt-1">情報を探す時間は、仕事じゃない。</p>
        </div>

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
              <SignupForm />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  )
}
