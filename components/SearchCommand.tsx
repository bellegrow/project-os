'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search, X, Loader2, ArrowRight,
  Briefcase, Users, Mic, FileText, Receipt, ScrollText,
  CheckSquare, MessageSquare, Calendar, Banknote, Paperclip,
} from 'lucide-react'
import { searchAll } from '@/lib/search'
import { SearchResult, SearchResultType } from '@/lib/types'

const TYPE_LABEL: Record<SearchResultType, string> = {
  project:  '案件',
  customer: '顧客',
  contact:  '担当者',
  hearing:  '打ち合わせメモ',
  estimate: '見積書',
  invoice:  '請求書',
  contract: '契約',
  task:     'タスク',
  activity: 'メモ',
  meeting:  '打ち合わせ',
  cost:     '原価',
  file:     'ファイル',
}

const TYPE_COLOR: Record<SearchResultType, string> = {
  project:  'bg-blue-100 text-blue-700',
  customer: 'bg-purple-100 text-purple-700',
  contact:  'bg-violet-100 text-violet-700',
  hearing:  'bg-teal-100 text-teal-700',
  estimate: 'bg-amber-100 text-amber-700',
  invoice:  'bg-orange-100 text-orange-700',
  contract: 'bg-indigo-100 text-indigo-700',
  task:     'bg-rose-100 text-rose-700',
  activity: 'bg-gray-100 text-gray-700',
  meeting:  'bg-sky-100 text-sky-700',
  cost:     'bg-red-100 text-red-700',
  file:     'bg-green-100 text-green-700',
}

function TypeIcon({ type }: { type: SearchResultType }) {
  const cls = 'w-3 h-3'
  switch (type) {
    case 'project':  return <Briefcase className={cls} />
    case 'customer': return <Users className={cls} />
    case 'contact':  return <Users className={cls} />
    case 'hearing':  return <Mic className={cls} />
    case 'estimate': return <FileText className={cls} />
    case 'invoice':  return <Receipt className={cls} />
    case 'contract': return <ScrollText className={cls} />
    case 'task':     return <CheckSquare className={cls} />
    case 'activity': return <MessageSquare className={cls} />
    case 'meeting':  return <Calendar className={cls} />
    case 'cost':     return <Banknote className={cls} />
    case 'file':     return <Paperclip className={cls} />
  }
}

function TypeBadge({ type }: { type: SearchResultType }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap ${TYPE_COLOR[type]}`}>
      <TypeIcon type={type} />
      {TYPE_LABEL[type]}
    </span>
  )
}

const MAX_RESULTS = 12

export default function SearchCommand() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const selectedItemRef = useRef<HTMLButtonElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  const close = useCallback(() => setOpen(false), [])

  // Reset state when modal closes; focus input when it opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 30)
      return () => clearTimeout(t)
    } else {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [open])

  // Scroll selected item into view
  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setSelectedIndex(0)
      return
    }
    setLoading(true)
    try {
      const res = await searchAll(q.trim())
      setResults(res.slice(0, MAX_RESULTS))
      setSelectedIndex(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(value), 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Escape':
        close()
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]) {
          router.push(results[selectedIndex].href)
          close()
        }
        break
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
      onClick={close}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: 'min(600px, 80vh)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="案件名・顧客名・金額などで検索…"
            className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
          />
          {loading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin shrink-0" />
          ) : (
            query && (
              <button
                onClick={() => handleChange('')}
                className="text-gray-300 hover:text-gray-500 shrink-0 transition-colors"
                tabIndex={-1}
                aria-label="クリア"
              >
                <X className="w-4 h-4" />
              </button>
            )
          )}
        </div>

        {/* Empty state — no query */}
        {!query.trim() && (
          <div className="px-4 py-7 text-center space-y-3">
            <p className="text-xs text-gray-400">
              案件・顧客・見積書・タスク・金額などを横断検索できます
            </p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-[11px] text-gray-300">
                <kbd className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono text-[10px]">↑↓</kbd>
                {' '}移動
              </span>
              <span className="text-[11px] text-gray-300">
                <kbd className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono text-[10px]">↩</kbd>
                {' '}遷移
              </span>
              <span className="text-[11px] text-gray-300">
                <kbd className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono text-[10px]">Esc</kbd>
                {' '}閉じる
              </span>
            </div>
          </div>
        )}

        {/* No results */}
        {query.trim() && !loading && results.length === 0 && (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-gray-400">
              「{query}」に一致するデータが見つかりませんでした
            </p>
            <p className="text-xs text-gray-300 mt-1">別のキーワードでお試しください</p>
          </div>
        )}

        {/* Results list */}
        {results.length > 0 && (
          <div className="overflow-y-auto flex-1">
            {results.map((result, i) => (
              <button
                key={`${result.type}-${result.id}`}
                ref={i === selectedIndex ? selectedItemRef : null}
                className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors border-b border-gray-50 last:border-0 ${
                  i === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  router.push(result.href)
                  close()
                }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <div className="mt-0.5 shrink-0">
                  <TypeBadge type={result.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate leading-snug">
                    {result.title}
                  </p>
                  {result.subtitle && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{result.subtitle}</p>
                  )}
                  {result.snippet && (
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{result.snippet}</p>
                  )}
                </div>
                {i === selectedIndex && (
                  <ArrowRight className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-1" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Footer: "すべての結果を見る" */}
        {query.trim() && results.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5">
            <Link
              href={`/search?q=${encodeURIComponent(query.trim())}`}
              className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium"
              onClick={close}
            >
              <Search className="w-3 h-3 shrink-0" />
              すべての結果を見る
              <ArrowRight className="w-3 h-3 ml-auto" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
