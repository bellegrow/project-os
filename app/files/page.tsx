'use client'

import { useState } from 'react'
import { FolderOpen, Search, FileText, Archive, FileCode, File } from 'lucide-react'
import AppShell from '@/components/AppShell'

type FileType = 'pdf' | 'zip' | 'figma' | 'doc' | 'image'

interface ProjectFile {
  id: string
  name: string
  type: FileType
  client: string
  project: string
  size: string
  updatedDate: string
  tags: string[]
}

const DEMO_FILES: ProjectFile[] = [
  { id: '1', name: '提案書_株式会社サンプル.pdf',          type: 'pdf',   client: '株式会社サンプル',     project: 'コーポレートサイト制作',    size: '2.4 MB', updatedDate: '2026-06-05', tags: ['提案書'] },
  { id: '2', name: '見積書_LP制作_v2.pdf',                type: 'pdf',   client: '山田デザイン事務所',    project: 'LP制作',               size: '156 KB', updatedDate: '2026-05-20', tags: ['見積書'] },
  { id: '3', name: '契約書_田中工務店_業務委託.pdf',        type: 'pdf',   client: '田中工務店',          project: '採用サイト制作',           size: '890 KB', updatedDate: '2026-06-07', tags: ['契約書', '要署名'] },
  { id: '4', name: 'ロゴデータ_BELLE美容室.zip',           type: 'zip',   client: 'BELLE美容室',         project: 'ホームページ制作',          size: '8.2 MB', updatedDate: '2026-04-22', tags: ['素材'] },
  { id: '5', name: 'ワイヤーフレーム_v3.fig',              type: 'figma', client: '山田建設株式会社',      project: 'コーポレートサイト大規模リニューアル', size: '4.1 MB', updatedDate: '2026-06-01', tags: ['デザイン'] },
  { id: '6', name: '打ち合わせメモ_初回ヒアリング.md',      type: 'doc',   client: '田中工務店',          project: '採用サイト制作',           size: '12 KB',  updatedDate: '2026-06-03', tags: ['メモ'] },
  { id: '7', name: '写真素材_さくら整体院.zip',             type: 'zip',   client: 'さくら整体院',         project: 'ホームページリニューアル',   size: '34.5 MB', updatedDate: '2026-03-15', tags: ['素材'] },
  { id: '8', name: '請求書_BELLE_05月分.pdf',              type: 'pdf',   client: 'BELLE美容室',         project: 'ホームページ制作',          size: '145 KB', updatedDate: '2026-05-01', tags: ['請求書', '入金済み'] },
  { id: '9', name: 'スタイルガイド_山田デザイン.pdf',       type: 'pdf',   client: '山田デザイン事務所',    project: 'LP制作',               size: '3.8 MB', updatedDate: '2026-05-10', tags: ['デザイン'] },
]

const TAG_CLS: Record<string, string> = {
  '提案書':   'bg-blue-50 text-blue-600',
  '見積書':   'bg-amber-50 text-amber-600',
  '契約書':   'bg-indigo-50 text-indigo-600',
  '請求書':   'bg-orange-50 text-orange-600',
  '素材':     'bg-gray-100 text-gray-500',
  'デザイン': 'bg-violet-50 text-violet-600',
  'メモ':     'bg-teal-50 text-teal-600',
  '要署名':   'bg-red-50 text-red-600',
  '入金済み': 'bg-emerald-50 text-emerald-600',
}

function FileIcon({ type }: { type: FileType }) {
  const cls = 'w-8 h-8 shrink-0'
  if (type === 'pdf')   return <FileText className={`${cls} text-red-400`} />
  if (type === 'zip')   return <Archive className={`${cls} text-amber-400`} />
  if (type === 'figma') return <FileCode className={`${cls} text-violet-400`} />
  if (type === 'image') return <File className={`${cls} text-blue-400`} />
  return <File className={`${cls} text-gray-400`} />
}

function formatDate(d: string) {
  const [y, m, dd] = d.split('-').map(Number)
  return `${y}/${m}/${dd}`
}

export default function FilesPage() {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? DEMO_FILES.filter(f =>
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.client.toLowerCase().includes(query.toLowerCase()) ||
        f.project.toLowerCase().includes(query.toLowerCase()) ||
        f.tags.some(t => t.includes(query))
      )
    : DEMO_FILES

  return (
    <AppShell>
      <main className="max-w-5xl mx-auto px-4 py-6 lg:px-8">

        {/* ページタイトル */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-gray-700" />
            ファイル管理
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {filtered.length}件のファイル
          </p>
        </div>

        {/* 検索バー */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ファイル名・顧客名・案件名・タグで検索"
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* ファイル一覧 */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400">
                  <th className="text-left px-4 py-3 font-medium">ファイル名</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">顧客 / 案件</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">タグ</th>
                  <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">サイズ</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">更新日</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(file => (
                  <tr key={file.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileIcon type={file.type} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[200px] group-hover:text-blue-600 transition-colors">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-400 sm:hidden truncate">{file.client}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-xs text-gray-400">{file.client}</p>
                      <p className="text-xs text-gray-600 truncate max-w-[180px]">{file.project}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {file.tags.map(tag => (
                          <span
                            key={tag}
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${TAG_CLS[tag] ?? 'bg-gray-100 text-gray-500'}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-400 tabular-nums hidden lg:table-cell">{file.size}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">{formatDate(file.updatedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">「{query}」に一致するファイルがありません</p>
            </div>
          )}
        </div>

      </main>
    </AppShell>
  )
}
