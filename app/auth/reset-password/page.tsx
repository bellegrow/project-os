'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/auth/confirm?type=recovery&next=/auth/update-password` }
      )
      if (resetError) throw resetError
      setDone(true)
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
          <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-900 rounded-xl mb-3">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">ProjectOS</h1>
          <p className="text-xs text-gray-400 mt-1">情報を探す時間は、仕事じゃない。</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {done ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-2">メールを送信しました</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                <span className="font-medium">{email}</span> にパスワードリセット用のリンクを送りました。
                メール内のリンクをクリックしてください。
              </p>
              <Link
                href="/login"
                className="mt-5 inline-block text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                ログインページへ戻る
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-gray-900 mb-1">パスワードをリセット</h2>
              <p className="text-xs text-gray-500 mb-5">
                登録済みのメールアドレスを入力してください。リセット用のリンクをお送りします。
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    autoComplete="email"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />送信中...</>
                  ) : 'リセットリンクを送信'}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-gray-100 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeft className="w-3 h-3" />
                  ログインに戻る
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
