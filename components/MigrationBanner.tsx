'use client'

import { useState, useEffect } from 'react'
import { ArrowUpFromLine, CheckCircle, AlertTriangle, Loader2, X } from 'lucide-react'
import { useCloudMode } from '@/lib/hooks/useCloudMode'
import {
  hasLocalData,
  isMigrationDone,
  getLocalSummary,
  migrateToSupabase,
  clearLocalData,
  MigrationResult,
  MigrationSummary,
} from '@/lib/migration'

const DISMISSED_KEY = 'pos_migration_banner_dismissed'

function SummaryLine({ s }: { s: MigrationSummary }) {
  const parts: string[] = []
  if (s.projects   > 0) parts.push(`案件 ${s.projects}件`)
  if (s.hearings   > 0) parts.push(`ヒアリング ${s.hearings}件`)
  if (s.estimates  > 0) parts.push(`見積書 ${s.estimates}件`)
  if (s.invoices   > 0) parts.push(`請求書 ${s.invoices}件`)
  if (s.contracts  > 0) parts.push(`契約 ${s.contracts}件`)
  if (s.tasks      > 0) parts.push(`タスク ${s.tasks}件`)
  if (s.activities > 0) parts.push(`活動履歴 ${s.activities}件`)
  if (s.costs      > 0) parts.push(`原価 ${s.costs}件`)
  if (s.files      > 0) parts.push(`ファイル ${s.files}件`)
  if (s.settings)       parts.push('事業者設定')
  return <>{parts.join(' · ')}</>
}

export default function MigrationBanner({ onMigrated }: { onMigrated?: () => void }) {
  const isCloud = useCloudMode()
  const [show, setShow] = useState(false)
  const [summary, setSummary] = useState<MigrationSummary>({
    projects: 0, hearings: 0,
    estimates: 0, invoices: 0, contracts: 0, settings: false,
    tasks: 0, activities: 0, costs: 0, files: 0,
  })
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<MigrationResult | null>(null)

  useEffect(() => {
    if (isCloud === null) return
    if (!isCloud) return
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(DISMISSED_KEY) === 'true') return
    if (isMigrationDone()) return
    if (!hasLocalData()) return

    setSummary(getLocalSummary())
    setShow(true)
  }, [isCloud])

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, 'true')
    setShow(false)
  }

  if (!show) return null

  // 移行完了後の表示
  if (result) {
    const canDelete = result.success

    return (
      <div className={`border rounded-xl p-4 mb-4 flex items-start gap-3 ${
        result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
      }`}>
        {result.success
          ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          : <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        }
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${result.success ? 'text-emerald-800' : 'text-amber-800'}`}>
            {result.success ? '移行が完了しました' : '移行が一部完了しました'}
          </p>
          <p className={`text-xs mt-0.5 ${result.success ? 'text-emerald-600' : 'text-amber-600'}`}>
            <SummaryLine s={result.migrated} />
          </p>
          {result.errors.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {result.errors.slice(0, 5).map((e, i) => (
                <p key={i} className="text-xs text-red-600">{e}</p>
              ))}
              {result.errors.length > 5 && (
                <p className="text-xs text-red-500">他 {result.errors.length - 5} 件のエラー</p>
              )}
            </div>
          )}
          {!canDelete && (
            <p className="text-xs text-amber-700 mt-2">
              エラーが発生したため、ローカルデータはそのまま保持されます。
            </p>
          )}
        </div>
        {canDelete ? (
          <button
            onClick={() => {
              clearLocalData()
              dismiss()
              onMigrated?.()
            }}
            className="text-xs text-emerald-600 hover:text-emerald-800 font-medium shrink-0 transition-colors whitespace-nowrap"
          >
            ローカルデータを削除して閉じる
          </button>
        ) : (
          <button
            onClick={dismiss}
            className="text-amber-400 hover:text-amber-600 transition-colors shrink-0"
            aria-label="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  // 移行前の表示
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <ArrowUpFromLine className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-900">
            ローカルに保存されたデータをクラウドへ移行できます
          </p>
          <p className="text-xs text-blue-600 mt-0.5">
            <SummaryLine s={summary} />
          </p>
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={async () => {
                setRunning(true)
                const r = await migrateToSupabase()
                setResult(r)
                setRunning(false)
                if (r.success) onMigrated?.()
              }}
              disabled={running}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {running ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  移行中...
                </>
              ) : (
                <>
                  <ArrowUpFromLine className="w-3.5 h-3.5" />
                  クラウドへ移行する
                </>
              )}
            </button>
            <button
              onClick={dismiss}
              className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
            >
              あとで
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-blue-400 hover:text-blue-600 transition-colors shrink-0"
          aria-label="閉じる"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
