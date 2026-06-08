'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Loader2, FileText, Users, Briefcase, MessageSquare, CheckSquare, Receipt, ScrollText, Mic, Banknote, Paperclip, Calendar } from 'lucide-react'
import AppNavTabs from '@/components/AppNavTabs'
import { searchAll } from '@/lib/search'
import { SearchResult, SearchResultType } from '@/lib/types'

const TYPE_LABEL: Record<SearchResultType, string> = {
  project: '案件',
  customer: '顧客',
  contact: '担当者',
  hearing: '打ち合わせメモ',
  estimate: '見積書',
  invoice: '請求書',
  contract: '契約',
  task: 'タスク',
  activity: 'メモ',
  meeting: '打ち合わせ',
  cost: '原価',
  file: 'ファイル',
}

const TYPE_COLOR: Record<SearchResultType, string> = {
  project: 'bg-blue-100 text-blue-700',
  customer: 'bg-purple-100 text-purple-700',
  contact: 'bg-violet-100 text-violet-700',
  hearing: 'bg-teal-100 text-teal-700',
  estimate: 'bg-amber-100 text-amber-700',
  invoice: 'bg-orange-100 text-orange-700',
  contract: 'bg-indigo-100 text-indigo-700',
  task: 'bg-rose-100 text-rose-700',
  activity: 'bg-gray-100 text-gray-700',
  meeting: 'bg-sky-100 text-sky-700',
  cost: 'bg-red-100 text-red-700',
  file: 'bg-green-100 text-green-700',
}

function TypeIcon({ type }: { type: SearchResultType }) {
  const cls = 'w-3.5 h-3.5'
  switch (type) {
    case 'project':   return <Briefcase className={cls} />
    case 'customer':  return <Users className={cls} />
    case 'contact':   return <Users className={cls} />
    case 'hearing':   return <Mic className={cls} />
    case 'estimate':  return <FileText className={cls} />
    case 'invoice':   return <Receipt className={cls} />
    case 'contract':  return <ScrollText className={cls} />
    case 'task':      return <CheckSquare className={cls} />
    case 'activity':  return <MessageSquare className={cls} />
    case 'meeting':   return <Calendar className={cls} />
    case 'cost':      return <Banknote className={cls} />
    case 'file':      return <Paperclip className={cls} />
  }
}

function ResultCard({ result }: { result: SearchResult }) {
  return (
    <Link
      href={result.href}
      className="block bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${TYPE_COLOR[result.type]}`}>
          <TypeIcon type={result.type} />
          {TYPE_LABEL[result.type]}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
          {result.subtitle && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{result.subtitle}</p>
          )}
          {result.snippet && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{result.snippet}</p>
          )}
        </div>
      </div>
    </Link>
  )
}

function SearchInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQ = searchParams.get('q') ?? ''

  const [query, setQuery] = useState(initialQ)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) {
      setResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    try {
      const res = await searchAll(trimmed)
      setResults(res)
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialQ) runSearch(initialQ)
    inputRef.current?.focus()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.replace(`/search${value.trim() ? `?q=${encodeURIComponent(value.trim())}` : ''}`, { scroll: false })
      runSearch(value)
    }, 300)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    router.replace(`/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`, { scroll: false })
    runSearch(query)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-0">
          <h1 className="text-base font-semibold text-gray-900 mb-3">検索</h1>
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="案件名・顧客名・メモなどで検索…"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
              )}
            </div>
          </form>
          <div className="mt-3">
            <AppNavTabs current="search" />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {!searched && !loading && (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">キーワードを入力してください</p>
            <p className="text-xs mt-1">案件・顧客・見積書・タスクなどを横断検索できます</p>
          </div>
        )}

        {searched && !loading && results.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm font-medium">「{query}」に一致するデータが見つかりませんでした</p>
            <p className="text-xs mt-1">別のキーワードでお試しください</p>
          </div>
        )}

        {results.length > 0 && (
          <>
            <p className="text-xs text-gray-400 mb-3">
              {results.length}件の結果{results.length >= 50 ? '（上位50件）' : ''}
            </p>
            <div className="space-y-2">
              {results.map((r) => (
                <ResultCard key={`${r.type}-${r.id}`} result={r} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchInner />
    </Suspense>
  )
}
