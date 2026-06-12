'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { getAllHearings, getProjects } from '@/lib/dataSource'
import type { Hearing, Project } from '@/lib/types'

function formatDate(d: string) {
  const dt = new Date(d)
  return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日`
}

export default function MeetingsPage() {
  const router = useRouter()
  const [hearings, setHearings] = useState<Hearing[]>([])
  const [projectMap, setProjectMap] = useState<Map<string, Project>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [hs, projs] = await Promise.all([getAllHearings(), getProjects()])
      setHearings(hs.sort((a, b) => b.date.localeCompare(a.date)))
      setProjectMap(new Map(projs.map(p => [p.id, p])))
      setLoading(false)
    }
    load()
  }, [])

  return (
    <AppShell>
      <main className="max-w-7xl mx-auto px-4 py-6 lg:px-8">

        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-700" />
            打ち合わせ記録
          </h2>
          {!loading && (
            <p className="text-xs text-gray-400 mt-0.5">全{hearings.length}件</p>
          )}
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-xs text-gray-400">
            読み込み中...
          </div>
        ) : hearings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-sm font-medium text-gray-500 mb-1">打ち合わせがありません</p>
            <p className="text-xs">案件ページから打ち合わせを記録できます</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hearings.map(h => {
              const proj = projectMap.get(h.projectId)
              return (
                <div
                  key={h.id}
                  onClick={() => router.push(`/projects/${h.projectId}`)}
                  className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-400">{formatDate(h.date)}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {proj ? `${proj.clientName} / ${proj.name}` : '—'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{h.memo}</p>
                </div>
              )
            })}
          </div>
        )}

      </main>
    </AppShell>
  )
}
