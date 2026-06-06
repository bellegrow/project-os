'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, ChevronDown } from 'lucide-react'
import { Project } from '@/lib/types'
import { getProjects, getHearings } from '@/lib/storage'
import { getHearingPreview } from '@/lib/utils'
import ProjectCard from '@/components/ProjectCard'
import NewProjectModal from '@/components/NewProjectModal'

type StatusFilter = 'アクティブ' | 'すべて' | '商談中' | '提案済' | '受注' | '進行中' | '完了' | '失注'
type SortOrder = '更新が新しい順' | '最終ヒアリングが古い順' | '放置日数が長い順'

const STATUS_OPTIONS: StatusFilter[] = ['アクティブ', 'すべて', '商談中', '提案済', '受注', '進行中', '完了', '失注']
const SORT_OPTIONS: { label: string; value: SortOrder }[] = [
  { label: '更新順', value: '更新が新しい順' },
  { label: 'ヒアリング古い順', value: '最終ヒアリングが古い順' },
  { label: '放置順', value: '放置日数が長い順' },
]
const INACTIVE_STATUSES = ['完了', '失注'] as const

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [latestHearings, setLatestHearings] = useState<Record<string, string>>({})
  const [latestHearingDates, setLatestHearingDates] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('アクティブ')
  const [sortOrder, setSortOrder] = useState<SortOrder>('更新が新しい順')
  const [mounted, setMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  const filteredProjects = projects
    .filter((p) => {
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch = !q || p.clientName.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
      const matchesStatus =
        statusFilter === 'すべて' ? true :
        statusFilter === 'アクティブ' ? !INACTIVE_STATUSES.includes(p.status as typeof INACTIVE_STATUSES[number]) :
        p.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortOrder === '更新が新しい順') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
      if (sortOrder === '最終ヒアリングが古い順') {
        const aDate = latestHearingDates[a.id]
        const bDate = latestHearingDates[b.id]
        if (!aDate && !bDate) return 0
        if (!aDate) return 1
        if (!bDate) return -1
        return new Date(aDate).getTime() - new Date(bDate).getTime()
      }
      // 放置日数が長い順：商談中・提案済を優先、完了・失注は末尾
      const aDate = latestHearingDates[a.id]
      const bDate = latestHearingDates[b.id]
      const isInactive = (s: string) => s === '完了' || s === '失注'
      const aExcluded = isInactive(a.status) || !aDate
      const bExcluded = isInactive(b.status) || !bDate
      if (aExcluded && bExcluded) return 0
      if (aExcluded) return 1
      if (bExcluded) return -1
      // どちらも有効：商談中・提案済を先頭グループに
      const isUrgent = (s: string) => s === '商談中' || s === '提案済'
      const aPriority = isUrgent(a.status) ? 1 : 2
      const bPriority = isUrgent(b.status) ? 1 : 2
      if (aPriority !== bPriority) return aPriority - bPriority
      return new Date(aDate).getTime() - new Date(bDate).getTime()
    })

  useEffect(() => {
    setMounted(true)
    const ps = getProjects()
    setProjects(ps)
    const map: Record<string, string> = {}
    const dateMap: Record<string, string> = {}
    ps.forEach((p) => {
      const hs = getHearings(p.id)
      if (hs.length > 0) {
        map[p.id] = getHearingPreview(hs[0].memo)
        dateMap[p.id] = hs[0].date
      }
    })
    setLatestHearings(map)
    setLatestHearingDates(dateMap)
  }, [])

  const handleCreated = (project: Project) => {
    setShowModal(false)
    router.push(`/projects/${project.id}`)
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">ProjectOS</h1>
            <p className="text-xs text-gray-400">情報を探す時間は、仕事じゃない。</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新規案件
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-3xl mb-4">📁</p>
            <h2 className="text-base font-semibold text-gray-700 mb-2">案件がまだありません</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
              最初の案件を作成して、ヒアリング記録を残しましょう。
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              最初の案件を作成する
            </button>
          </div>
        ) : (
          <>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="クライアント名・案件名で検索"
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2 mb-4">
              <div className="relative flex-1 min-w-0">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className={`w-full appearance-none border rounded-lg pl-3 pr-7 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    statusFilter !== 'アクティブ'
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${
                  statusFilter !== 'アクティブ' ? 'text-blue-400' : 'text-gray-400'
                }`} />
              </div>
              <div className="relative flex-1 min-w-0">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className={`w-full appearance-none border rounded-lg pl-3 pr-7 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    sortOrder !== '更新が新しい順'
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${
                  sortOrder !== '更新が新しい順' ? 'text-blue-400' : 'text-gray-400'
                }`} />
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-12">
                該当する案件がありません
              </p>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    lastHearingMemo={latestHearings[project.id]}
                    lastHearingDate={latestHearingDates[project.id]}
                    onClick={() => router.push(`/projects/${project.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {showModal && (
        <NewProjectModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}
