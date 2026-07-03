'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FolderOpen, Search, FileText, Archive, FileCode, File, Image } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { getAllProjectFiles, getProjects } from '@/lib/dataSource'
import type { ProjectFile, Project, FileCategory } from '@/lib/types'
import { demoProjectFiles, demoProjects } from '@/lib/demoData'
import { IS_DEMO_MODE } from '@/lib/demo'

const CATEGORY_LABEL: Record<FileCategory, string> = {
  document: 'ドキュメント',
  image:    '画像',
  pdf:      'PDF',
  design:   'デザイン',
  delivery:  '納品物',
  other:    'その他',
}
const CATEGORY_CLS: Record<FileCategory, string> = {
  document: 'bg-blue-50 text-blue-600',
  image:    'bg-teal-50 text-teal-600',
  pdf:      'bg-red-50 text-red-600',
  design:   'bg-violet-50 text-violet-600',
  delivery: 'bg-emerald-50 text-emerald-600',
  other:    'bg-gray-100 text-gray-500',
}

function FileIcon({ category, fileType }: { category: FileCategory; fileType?: string }) {
  const cls = 'w-8 h-8 shrink-0'
  if (category === 'pdf' || fileType?.includes('pdf'))    return <FileText className={`${cls} text-red-400`} />
  if (category === 'image' || fileType?.startsWith('image/')) return <Image className={`${cls} text-teal-400`} />
  if (category === 'design')                               return <FileCode className={`${cls} text-violet-400`} />
  if (fileType?.includes('zip') || fileType?.includes('archive')) return <Archive className={`${cls} text-amber-400`} />
  return <File className={`${cls} text-gray-400`} />
}

function fmtSize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
function fmtDate(d: string) {
  const [y, m, dd] = d.split('-').map(Number)
  return `${y}/${m}/${dd}`
}

export default function FilesPage() {
  const router = useRouter()
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [projectMap, setProjectMap] = useState<Map<string, Project>>(new Map())
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    async function load() {
      const [fs, projs] = await Promise.all([getAllProjectFiles(), getProjects()])
      // デモ: データ0件 → デモデータを表示
      const demo = IS_DEMO_MODE && fs.length === 0
      const f = demo ? demoProjectFiles : fs
      setIsDemo(demo)
      setFiles([...f].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
      setProjectMap(new Map((demo ? demoProjects : projs).map(p => [p.id, p])))
      setLoading(false)
    }
    load()
  }, [])

  const filtered = query.trim()
    ? files.filter(f => {
        const proj = projectMap.get(f.projectId)
        const q = query.toLowerCase()
        return (
          f.name.toLowerCase().includes(q) ||
          proj?.name.toLowerCase().includes(q) ||
          proj?.clientName.toLowerCase().includes(q) ||
          CATEGORY_LABEL[f.category].includes(q) ||
          (f.note ?? '').toLowerCase().includes(q)
        )
      })
    : files

  return (
    <AppShell>
      <main className="max-w-7xl mx-auto px-4 py-6 lg:px-8">

        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-gray-700" />
            ファイル管理
          </h2>
          {!loading && <p className="text-xs text-gray-400 mt-0.5">{filtered.length}件のファイル</p>}
        </div>

        {isDemo && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-2 mb-4">
            <span className="text-xs text-blue-700 font-medium">デモデータを表示中</span>
            <span className="text-xs text-blue-500">— クラウドモードでファイルを管理できます</span>
          </div>
        )}

        {/* 検索バー */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ファイル名・顧客名・案件名・カテゴリで検索"
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-xs text-gray-400">読み込み中...</div>
        ) : files.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-sm font-medium text-gray-500 mb-1">ファイルがありません</p>
            <p className="text-xs">案件ページからファイルを添付できます</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400">
                    <th className="text-left px-4 py-3 font-medium">ファイル名</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">顧客 / 案件</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">カテゴリ</th>
                    <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">サイズ</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">更新日</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(f => {
                    const proj = projectMap.get(f.projectId)
                    const url = f.externalUrl || f.publicUrl
                    return (
                      <tr
                        key={f.id}
                        onClick={() => url ? window.open(url, '_blank') : router.push(`/projects/${f.projectId}`)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <FileIcon category={f.category} fileType={f.fileType} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate max-w-[200px] group-hover:text-blue-600 transition-colors">
                                {f.name}
                              </p>
                              {f.note && <p className="text-xs text-gray-400 truncate max-w-[200px]">{f.note}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <p className="text-xs text-gray-400 truncate">{proj?.clientName ?? '—'}</p>
                          <p className="text-xs text-gray-600 truncate max-w-[160px]">{proj?.name ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${CATEGORY_CLS[f.category]}`}>
                            {CATEGORY_LABEL[f.category]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-gray-400 tabular-nums hidden lg:table-cell">
                          {fmtSize(f.fileSize)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">
                          {fmtDate(f.updatedAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && query && (
              <div className="text-center py-12 text-gray-400">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">「{query}」に一致するファイルがありません</p>
              </div>
            )}
          </div>
        )}

      </main>
    </AppShell>
  )
}
