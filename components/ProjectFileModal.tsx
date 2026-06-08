'use client'

import { useState } from 'react'
import { X, Upload, Link } from 'lucide-react'
import { ProjectFile, ProjectFileInput, ProjectFileUpdateInput, FileCategory } from '@/lib/types'
import { createProjectFile, updateProjectFile, uploadProjectFile } from '@/lib/dataSource'

const CATEGORY_LABELS: Record<FileCategory, string> = {
  document: '文書',
  image: '画像',
  pdf: 'PDF',
  design: 'デザイン',
  delivery: '納品物',
  other: 'その他',
}

interface Props {
  file?: ProjectFile
  projectId: string
  customerId?: string
  isCloud: boolean
  onClose: () => void
  onSaved: (file: ProjectFile) => void
}

export default function ProjectFileModal({ file, projectId, customerId, isCloud, onClose, onSaved }: Props) {
  const isEdit = !!file
  const [name, setName] = useState(file?.name ?? '')
  const [category, setCategory] = useState<FileCategory>((file?.category as FileCategory) ?? 'other')
  const [externalUrl, setExternalUrl] = useState(file?.externalUrl ?? '')
  const [note, setNote] = useState(file?.note ?? '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setSelectedFile(f)
    if (!name) setName(f.name)
    setExternalUrl('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('ファイル名を入力してください'); return }
    if (!isEdit && !selectedFile && !externalUrl.trim()) {
      setError('ファイルまたは外部URLを入力してください')
      return
    }
    setSaving(true)
    setError('')
    try {
      let saved: ProjectFile | undefined
      if (isEdit) {
        const input: ProjectFileUpdateInput = {
          name: name.trim(),
          category,
          externalUrl: externalUrl.trim() || null,
          note: note.trim() || null,
        }
        saved = await updateProjectFile(file!.id, input)
      } else if (selectedFile && isCloud) {
        saved = await uploadProjectFile(projectId, selectedFile, {
          name: name.trim(),
          customerId,
          category,
          note: note.trim() || undefined,
        })
      } else {
        const input: ProjectFileInput = {
          projectId,
          customerId,
          name: name.trim(),
          category,
          externalUrl: externalUrl.trim() || undefined,
          note: note.trim() || undefined,
        }
        saved = await createProjectFile(input)
      }
      if (!saved) { setError('保存に失敗しました'); return }
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            {isEdit ? 'ファイルを編集' : 'ファイルを追加'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">

          {/* ファイルアップロード（Supabaseモード・新規のみ） */}
          {isCloud && !isEdit && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                ファイルをアップロード
              </label>
              <label className="flex items-center gap-2 w-full border border-dashed border-gray-300 rounded-xl p-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <Upload className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500 truncate">
                  {selectedFile ? selectedFile.name : 'ファイルを選択...'}
                </span>
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
              {selectedFile && (
                <p className="text-xs text-gray-400 mt-1">
                  {(selectedFile.size / 1024).toFixed(0)} KB
                </p>
              )}
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">または外部URLを登録</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </div>
          )}

          {/* 外部URL */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              外部URL
              {!isCloud && (
                <span className="ml-1 font-normal text-gray-400">（Google Drive・Dropbox など）</span>
              )}
            </label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                disabled={isCloud && !!selectedFile && !isEdit}
                className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          </div>

          {/* ファイル名 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              ファイル名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="例：仕様書_v2.pdf"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 種別 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">種別</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FileCategory)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {(Object.entries(CATEGORY_LABELS) as [FileCategory, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* メモ */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">メモ</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="バージョン・補足情報など"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl disabled:opacity-60 transition-colors"
            >
              {saving ? '保存中...' : isEdit ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
