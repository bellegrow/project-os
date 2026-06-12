'use client'

import { useState, useRef, useCallback } from 'react'
import { X, Upload, Download, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import {
  parseCSV,
  validateCustomerRows,
  validateProjectRows,
  importCustomers,
  importProjects,
  downloadCustomerSampleCSV,
  downloadProjectSampleCSV,
  CustomerImportRow,
  ProjectImportRow,
} from '@/lib/csvImport'

type ImportType = 'customer' | 'project'
type Step = 'select' | 'preview' | 'done'

interface Props {
  defaultType?: ImportType
  onClose: () => void
  onImported?: () => void
}

export default function CsvImportModal({ defaultType, onClose, onImported }: Props) {
  const [importType, setImportType] = useState<ImportType>(defaultType ?? 'customer')
  const [step, setStep] = useState<Step>('select')
  const [customerRows, setCustomerRows] = useState<CustomerImportRow[]>([])
  const [projectRows,  setProjectRows]  = useState<ProjectImportRow[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null)
  const [fileError, setFileError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validCustomerRows = customerRows.filter(r => !r.error)
  const invalidCustomerRows = customerRows.filter(r => r.error)
  const validProjectRows = projectRows.filter(r => !r.error)
  const invalidProjectRows = projectRows.filter(r => r.error)
  const validCount  = importType === 'customer' ? validCustomerRows.length  : validProjectRows.length
  const invalidCount = importType === 'customer' ? invalidCustomerRows.length : invalidProjectRows.length

  const handleFile = useCallback((file: File) => {
    setFileError('')
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setFileError('CSVファイル（.csv）を選択してください')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = parseCSV(text)
      if (rows.length < 2) {
        setFileError('データが1件もありません（ヘッダー行のみのファイルです）')
        return
      }
      if (importType === 'customer') {
        setCustomerRows(validateCustomerRows(rows))
      } else {
        setProjectRows(validateProjectRows(rows))
      }
      setStep('preview')
    }
    reader.readAsText(file, 'UTF-8')
  }, [importType])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleImport = async () => {
    setImporting(true)
    setProgress(0)
    try {
      const res = importType === 'customer'
        ? await importCustomers(validCustomerRows, (done, total) => setProgress(Math.round(done / total * 100)))
        : await importProjects(validProjectRows,  (done, total) => setProgress(Math.round(done / total * 100)))
      setResult(res)
      setStep('done')
      onImported?.()
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setStep('select')
    setCustomerRows([])
    setProjectRows([])
    setFileName('')
    setFileError('')
    setResult(null)
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl flex flex-col max-h-[90vh]">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-sm font-semibold text-gray-900">CSVで取り込む</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">

          {/* Step 1: ファイル選択 */}
          {step === 'select' && (
            <div className="p-5 space-y-4">

              {/* 種別タブ */}
              <div className="flex gap-2">
                {(['customer', 'project'] as ImportType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setImportType(t)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      importType === t
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {t === 'customer' ? '顧客' : '案件'}
                  </button>
                ))}
              </div>

              {/* 列フォーマット説明 */}
              <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 space-y-1.5">
                <p className="font-medium text-gray-700 mb-2">
                  {importType === 'customer' ? '顧客CSVの列構成' : '案件CSVの列構成'}
                </p>
                {importType === 'customer' ? (
                  <>
                    <p><span className="font-medium text-gray-800">顧客名</span> <span className="text-red-500">※必須</span></p>
                    <p><span className="font-medium text-gray-800">業種</span> — 任意</p>
                    <p><span className="font-medium text-gray-800">Webサイト</span> — 任意</p>
                    <p><span className="font-medium text-gray-800">備考</span> — 任意</p>
                  </>
                ) : (
                  <>
                    <p><span className="font-medium text-gray-800">案件名</span> <span className="text-red-500">※必須</span></p>
                    <p><span className="font-medium text-gray-800">顧客名</span> <span className="text-red-500">※必須</span></p>
                    <p><span className="font-medium text-gray-800">ステータス</span> — 任意（商談中／提案済／受注／進行中／完了／失注）</p>
                    <p><span className="font-medium text-gray-800">概算予算</span> — 任意（数値のみ）</p>
                  </>
                )}
                <button
                  onClick={() => importType === 'customer' ? downloadCustomerSampleCSV() : downloadProjectSampleCSV()}
                  className="flex items-center gap-1 mt-2 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  サンプルCSVをダウンロード
                </button>
              </div>

              {/* ドロップゾーン */}
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">クリックまたはドラッグ&ドロップ</p>
                <p className="text-xs text-gray-400 mt-1">.csv ファイル</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              {fileError && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {fileError}
                </div>
              )}
            </div>
          )}

          {/* Step 2: プレビュー */}
          {step === 'preview' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">{fileName}</span>
                <button onClick={reset} className="text-xs text-blue-600 hover:underline ml-auto">
                  ファイルを変更
                </button>
              </div>

              {/* 件数サマリー */}
              <div className="flex gap-3">
                <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-emerald-700">{validCount}</p>
                  <p className="text-xs text-emerald-600 mt-0.5">取り込み可能</p>
                </div>
                {invalidCount > 0 && (
                  <div className="flex-1 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-red-600">{invalidCount}</p>
                    <p className="text-xs text-red-500 mt-0.5">スキップ</p>
                  </div>
                )}
              </div>

              {/* データプレビュー */}
              {importType === 'customer' ? (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-500 font-medium">顧客名</th>
                        <th className="text-left px-3 py-2 text-gray-500 font-medium">業種</th>
                        <th className="text-left px-3 py-2 text-gray-500 font-medium w-16">状態</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {customerRows.slice(0, 20).map((r, i) => (
                        <tr key={i} className={r.error ? 'bg-red-50' : ''}>
                          <td className="px-3 py-2 text-gray-800">{r.name || '—'}</td>
                          <td className="px-3 py-2 text-gray-500">{r.industry || '—'}</td>
                          <td className="px-3 py-2">
                            {r.error
                              ? <span className="text-red-500" title={r.error}>✕</span>
                              : <span className="text-emerald-600">✓</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {customerRows.length > 20 && (
                    <p className="text-xs text-gray-400 px-3 py-2 border-t border-gray-100">
                      …他 {customerRows.length - 20} 件
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-500 font-medium">案件名</th>
                        <th className="text-left px-3 py-2 text-gray-500 font-medium">顧客名</th>
                        <th className="text-left px-3 py-2 text-gray-500 font-medium">ステータス</th>
                        <th className="text-left px-3 py-2 text-gray-500 font-medium w-16">状態</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {projectRows.slice(0, 20).map((r, i) => (
                        <tr key={i} className={r.error ? 'bg-red-50' : ''}>
                          <td className="px-3 py-2 text-gray-800 max-w-[120px] truncate">{r.name || '—'}</td>
                          <td className="px-3 py-2 text-gray-500 max-w-[100px] truncate">{r.clientName || '—'}</td>
                          <td className="px-3 py-2 text-gray-500">{r.status}</td>
                          <td className="px-3 py-2">
                            {r.error
                              ? <span className="text-red-500" title={r.error}>✕</span>
                              : <span className="text-emerald-600">✓</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {projectRows.length > 20 && (
                    <p className="text-xs text-gray-400 px-3 py-2 border-t border-gray-100">
                      …他 {projectRows.length - 20} 件
                    </p>
                  )}
                </div>
              )}

              {invalidCount > 0 && (
                <p className="text-xs text-gray-400">
                  ✕ のある行はスキップされます（顧客名・案件名が空の行など）
                </p>
              )}

              {/* プログレスバー */}
              {importing && (
                <div className="space-y-1.5">
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">{progress}%</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: 完了 */}
          {step === 'done' && result && (
            <div className="p-8 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <div>
                <p className="text-lg font-bold text-gray-900">{result.success}件を取り込みました</p>
                {result.failed > 0 && (
                  <p className="text-sm text-red-500 mt-1">{result.failed}件のエラーがありました</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="bg-blue-600 text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
              >
                閉じる
              </button>
            </div>
          )}
        </div>

        {/* フッター */}
        {step === 'preview' && (
          <div className="px-5 py-4 border-t border-gray-100 flex gap-2 shrink-0">
            <button
              onClick={reset}
              disabled={importing}
              className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              戻る
            </button>
            <button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {importing ? '取り込み中...' : `${validCount}件を取り込む`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
