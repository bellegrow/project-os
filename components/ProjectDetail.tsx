'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  Sparkles,
  Copy,
  Check,
  FileText,
  Receipt,
  Folder,
  RefreshCw,
  Trash2,
  ChevronDown,
  Pencil,
} from 'lucide-react'
import { Project, Hearing, ProposalDraft, ProjectStatus } from '@/lib/types'
import {
  getProject, getHearings, getDrafts, saveDraft,
  deleteHearing, updateProjectStatus, updateProject, deleteProject, updateHearing,
} from '@/lib/storage'
import { formatRelativeDate, formatFullDate, formatCurrency, getHearingPreview } from '@/lib/utils'
import EditProjectModal from './EditProjectModal'

const STATUS_CLS: Record<ProjectStatus, string> = {
  商談中: 'bg-amber-100 text-amber-700',
  提案済: 'bg-blue-100 text-blue-700',
  受注: 'bg-emerald-100 text-emerald-700',
  進行中: 'bg-violet-100 text-violet-700',
  完了: 'bg-gray-100 text-gray-600',
  失注: 'bg-red-100 text-red-600',
}

export default function ProjectDetail() {
  const params = useParams()
  const projectId = params.id as string
  const router = useRouter()

  const [project, setProject] = useState<Project | null>(null)
  const [hearings, setHearings] = useState<Hearing[]>([])
  const [drafts, setDrafts] = useState<ProposalDraft[]>([])
  const [expandedDraftIds, setExpandedDraftIds] = useState<Set<string>>(new Set())
  const [copiedDraftId, setCopiedDraftId] = useState<string | null>(null)
  const [copyErrorDraftId, setCopyErrorDraftId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingHearingId, setEditingHearingId] = useState<string | null>(null)
  const [editingMemo, setEditingMemo] = useState('')
  const [showAllHearings, setShowAllHearings] = useState(false)
  const [showAllDrafts, setShowAllDrafts] = useState(false)
  const draftSectionRef = useRef<HTMLElement>(null)

  const load = useCallback(() => {
    const p = getProject(projectId)
    if (!p) { router.push('/projects'); return }
    setProject(p)
    const h = getHearings(projectId)
    setHearings(h)
    if (h.length > 0) setExpanded(new Set([h[0].id]))
    const ds = getDrafts(projectId)
    setDrafts(ds)
    if (ds.length > 0) setExpandedDraftIds(new Set([ds[0].id]))
  }, [projectId, router])

  useEffect(() => {
    setMounted(true)
    load()
  }, [load])

  const toggleHearing = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleGenerate = async () => {
    if (!project || hearings.length === 0) return
    setGenerating(true)
    setGenerateError('')
    try {
      const res = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: project.clientName,
          projectName: project.name,
          hearings: hearings.map((h) => ({
            date: formatFullDate(h.date),
            memo: h.memo,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '生成に失敗しました')
      const saved = saveDraft(projectId, data.content)
      setDrafts((prev) => [saved, ...prev])
      setExpandedDraftIds((prev) => new Set([saved.id, ...prev]))
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : '生成に失敗しました')
    } finally {
      setGenerating(false)
    }
  }

  const toggleDraft = (id: string) => {
    setExpandedDraftIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleCopy = async (draftId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedDraftId(draftId)
      setCopyErrorDraftId(null)
      setTimeout(() => setCopiedDraftId(null), 2000)
    } catch {
      setCopyErrorDraftId(draftId)
      setTimeout(() => setCopyErrorDraftId(null), 2000)
    }
  }

  const handleDeleteHearing = (id: string) => {
    if (!window.confirm('このヒアリング記録を削除しますか？')) return
    deleteHearing(id)
    setHearings((prev) => prev.filter((h) => h.id !== id))
    setExpanded((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ProjectStatus
    updateProjectStatus(projectId, newStatus)
    setProject((prev) => prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : prev)
  }

  const handleSaveEdit = (updated: Project) => {
    setProject(updated)
    setShowEditModal(false)
  }

  const handleDeleteProject = () => {
    if (!window.confirm('この案件を削除しますか？\nヒアリング記録・提案書骨子もすべて削除されます。')) return
    deleteProject(projectId)
    router.push('/projects')
  }

  const handleSaveHearing = (id: string) => {
    if (!editingMemo.trim()) return
    updateHearing(id, editingMemo.trim())
    setHearings((prev) => prev.map((h) => h.id === id ? { ...h, memo: editingMemo.trim() } : h))
    setEditingHearingId(null)
  }

  if (!mounted || !project) return null

  const draft = drafts[0] ?? null
  const visibleHearings = showAllHearings ? hearings : hearings.slice(0, 2)
  const visibleDrafts = showAllDrafts ? drafts : drafts.slice(0, 2)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="py-3">
            <button
              onClick={() => router.push('/projects')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              案件一覧
            </button>
          </div>
          <div className="pb-4">
            <p className="text-xs text-gray-500 mb-0.5">{project.clientName}</p>
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{project.name}</h1>
              <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="案件を編集"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
                  title="案件を削除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <div className="relative inline-flex items-center">
                <select
                  value={project.status}
                  onChange={handleStatusChange}
                  className={`text-xs font-medium pl-2.5 pr-6 py-0.5 rounded-full border-0 cursor-pointer appearance-none focus:outline-none focus:ring-1 focus:ring-blue-400 ${STATUS_CLS[project.status]}`}
                >
                  <option value="商談中">商談中</option>
                  <option value="提案済">提案済</option>
                  <option value="受注">受注</option>
                  <option value="進行中">進行中</option>
                  <option value="完了">完了</option>
                  <option value="失注">失注</option>
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
              </div>
              {project.budget && (
                <span className="text-sm text-gray-500">{formatCurrency(project.budget)}</span>
              )}
              <span className="text-xs text-gray-400">
                最終更新 {formatRelativeDate(project.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </header>


      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Project summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-400 mb-3">案件サマリー</p>
          {hearings.length === 0 ? (
            <p className="text-sm text-gray-400">まだヒアリング記録がありません</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">
                  第{hearings.length}回ヒアリング
                </span>
                <span className="text-xs text-gray-400">{formatFullDate(hearings[0].date)}</span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                {getHearingPreview(hearings[0].memo)}
              </p>
              <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                {hearings.length}件のヒアリング記録 · 最終ヒアリング：{formatRelativeDate(hearings[0].date)}
              </p>
            </div>
          )}
        </div>

        {/* Next action */}
        {hearings.length === 0 && !draft && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-medium text-blue-600 mb-1">次のアクション</p>
            <p className="text-sm text-blue-800 mb-3">
              ヒアリング記録を追加して、案件の文脈を蓄積しましょう。
            </p>
            <button
              onClick={() => router.push(`/projects/${projectId}/hearings/new`)}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              ヒアリングを記録する
            </button>
          </div>
        )}

        {hearings.length > 0 && !draft && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-medium text-blue-600 mb-1">次のアクション</p>
            <p className="text-sm text-blue-800 mb-3">
              {hearings.length}件のヒアリング記録をもとに、提案書の骨子を生成できます。
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              {generating ? '生成中...' : '提案書骨子を生成する'}
            </button>
            {generateError && (
              <p className="mt-2 text-xs text-red-500">{generateError}</p>
            )}
          </div>
        )}

        {draft && (
          <div className={`border rounded-xl p-4 transition-colors ${
            generating ? 'bg-blue-50 border-blue-100' : 'bg-emerald-50 border-emerald-100'
          }`}>
            <p className={`text-xs font-medium mb-1 ${generating ? 'text-blue-600' : 'text-emerald-600'}`}>
              次のアクション
            </p>
            <p className={`text-sm ${generating ? 'text-blue-800' : 'text-emerald-800'}`}>
              {generating
                ? '提案書骨子を再生成しています...'
                : '提案書骨子を生成しました。内容を確認し、提案資料へ反映してください。'}
            </p>
            {!generating && (
              <button
                type="button"
                onClick={() => draftSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="mt-3 text-xs font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
              >
                提案書骨子を見る →
              </button>
            )}
            {generateError && (
              <p className="mt-2 text-xs text-red-500">{generateError}</p>
            )}
          </div>
        )}

        {/* Proposal draft history */}
        {drafts.length > 0 && (
          <section ref={draftSectionRef}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">提案書骨子</h2>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-3 h-3" />
                {generating ? '生成中...' : '再生成'}
              </button>
            </div>
            <div className="space-y-2">
              {visibleDrafts.map((d, i) => (
                <div key={d.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div
                    onClick={() => toggleDraft(d.id)}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium text-gray-700 shrink-0">
                        第{drafts.length - i}版
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(d.createdAt).toLocaleDateString('ja-JP', {
                          month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      {i === 0 && (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md shrink-0">
                          最新
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleCopy(d.id, d.content) }}
                        className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg border transition-colors ${
                          copiedDraftId === d.id
                            ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
                            : copyErrorDraftId === d.id
                            ? 'text-red-500 border-red-200 bg-red-50'
                            : 'text-gray-500 border-gray-200 bg-white hover:border-gray-300 hover:text-gray-700'
                        }`}
                      >
                        {copiedDraftId === d.id ? (
                          <><Check className="w-3 h-3" />コピーしました</>
                        ) : copyErrorDraftId === d.id ? (
                          <>失敗</>
                        ) : (
                          <><Copy className="w-3 h-3" />コピー</>
                        )}
                      </button>
                      <span className="text-xs text-gray-400">
                        {expandedDraftIds.has(d.id) ? '閉じる' : '開く'}
                      </span>
                    </div>
                  </div>
                  {expandedDraftIds.has(d.id) && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed pt-3">
                        {d.content}
                      </pre>
                      <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                        AI生成 · ご自身のツールで編集・仕上げを行ってください
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {drafts.length > 2 && (
              <button
                onClick={() => setShowAllDrafts(!showAllDrafts)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 py-2.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors mt-2"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAllDrafts ? 'rotate-180' : ''}`} />
                {showAllDrafts ? '折りたたむ' : `過去の提案書骨子を見る（${drafts.length - 2}件）`}
              </button>
            )}
          </section>
        )}

        {/* Timeline */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">ヒアリング記録</h2>
            <button
              onClick={() => router.push(`/projects/${projectId}/hearings/new`)}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              追加
            </button>
          </div>

          {hearings.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-400">まだヒアリング記録がありません</p>
              <button
                onClick={() => router.push(`/projects/${projectId}/hearings/new`)}
                className="mt-2 text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                最初のヒアリングを記録する →
              </button>
            </div>
          ) : (
            <>
            <div className="space-y-2">
              {visibleHearings.map((h, i) => (
                <div
                  key={h.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleHearing(h.id)}
                    className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-gray-500">
                          第{hearings.length - i}回ヒアリング
                        </span>
                        <span className="text-xs text-gray-400">{formatFullDate(h.date)}</span>
                      </div>
                      {!expanded.has(h.id) && (
                        <p className="text-sm text-gray-600 line-clamp-1">{getHearingPreview(h.memo)}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {expanded.has(h.id) ? '閉じる' : '開く'}
                    </span>
                  </button>
                  {expanded.has(h.id) && (
                    <div className="px-4 pb-4 pl-9">
                      {editingHearingId === h.id ? (
                        <>
                          <textarea
                            value={editingMemo}
                            onChange={(e) => setEditingMemo(e.target.value)}
                            rows={8}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none leading-relaxed"
                            autoFocus
                          />
                          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-3">
                            <button
                              onClick={() => setEditingHearingId(null)}
                              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              キャンセル
                            </button>
                            <button
                              onClick={() => handleSaveHearing(h.id)}
                              disabled={!editingMemo.trim()}
                              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-40"
                            >
                              保存
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                            {h.memo}
                          </pre>
                          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-3">
                            <button
                              onClick={() => { setEditingHearingId(h.id); setEditingMemo(h.memo) }}
                              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              編集
                            </button>
                            <button
                              onClick={() => handleDeleteHearing(h.id)}
                              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              削除
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {hearings.length > 2 && (
              <button
                onClick={() => setShowAllHearings(!showAllHearings)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 py-2.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors mt-2"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAllHearings ? 'rotate-180' : ''}`} />
                {showAllHearings ? '折りたたむ' : `過去のヒアリングを見る（${hearings.length - 2}件）`}
              </button>
            )}
            </>
          )}

          <div className="flex items-center gap-2.5 mt-3 px-1">
            <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
            <p className="text-xs text-gray-400">
              案件登録 · {formatFullDate(project.createdAt)}
            </p>
          </div>
        </section>

        {/* Document shelf */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">ドキュメント</h2>
          <div className="grid grid-cols-3 gap-3">
            {/* 提案書骨子 */}
            <div
              className={`bg-white border rounded-xl p-3 text-center transition-all ${
                draft
                  ? 'border-blue-200 cursor-pointer hover:border-blue-300 hover:shadow-sm'
                  : 'border-dashed border-gray-200 opacity-60'
              }`}
              onClick={() => {
                if (draft) draftSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <FileText
                className={`w-5 h-5 mx-auto mb-1.5 ${draft ? 'text-blue-500' : 'text-gray-300'}`}
              />
              <p className="text-xs font-medium text-gray-700">提案書骨子</p>
              <p className={`text-xs mt-0.5 ${draft ? 'text-blue-500' : 'text-gray-400'}`}>
                {draft ? '生成済み' : '未生成'}
              </p>
            </div>

            {/* 見積書（placeholder） */}
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-3 text-center select-none">
              <Receipt className="w-5 h-5 mx-auto mb-1.5 text-gray-300" />
              <p className="text-xs font-medium text-gray-400">見積書</p>
              <p className="text-xs text-gray-300 mt-0.5">近日対応予定</p>
            </div>

            {/* 書類（placeholder） */}
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-3 text-center select-none">
              <Folder className="w-5 h-5 mx-auto mb-1.5 text-gray-300" />
              <p className="text-xs font-medium text-gray-400">書類</p>
              <p className="text-xs text-gray-300 mt-0.5">近日対応予定</p>
            </div>
          </div>
        </section>
      </main>

      {showEditModal && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onSaved={handleSaveEdit}
        />
      )}
    </div>
  )
}
