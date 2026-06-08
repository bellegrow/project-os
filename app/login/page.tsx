'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Loader2 } from 'lucide-react'

const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-gray-900">ProjectOS</h1>
          <p className="text-xs text-gray-400 mt-1">情報を探す時間は、仕事じゃない。</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {!supabaseConfigured ? (
            <div className="text-center py-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Supabase 未設定</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                  .env.local
                </code>{' '}
                に Supabase の環境変数を設定してください。
              </p>
              <p className="text-xs text-gray-400 mt-3">
                設定方法は README を確認してください。
              </p>
            </div>
          ) : sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-2">
                メールを送信しました
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                <span className="font-medium">{email}</span> に届いたリンクを
                クリックしてログインしてください。
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                別のメールアドレスで試す
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-gray-900 mb-1">ログイン</h2>
              <p className="text-xs text-gray-500 mb-5">
                メールアドレスにログインリンクを送ります。
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
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      送信中...
                    </>
                  ) : (
                    'ログインリンクを送る'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
