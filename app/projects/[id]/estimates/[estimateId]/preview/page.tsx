'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Printer } from 'lucide-react'
import { Estimate, Project, Customer } from '@/lib/types'
import { getEstimate, getProject, getCustomer } from '@/lib/dataSource'
import { formatCurrency, formatEstimateNumber } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'
import { getSettings, isIssuerConfigured, BusinessSettings, SETTINGS_DEFAULTS } from '@/lib/settingsSource'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}


export default function EstimatePreviewPage() {
  const params = useParams()
  const projectId = params.id as string
  const estimateId = params.estimateId as string
  const router = useRouter()

  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [settings, setSettings] = useState<BusinessSettings>(SETTINGS_DEFAULTS)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    Promise.all([
      getEstimate(estimateId),
      getProject(projectId),
      getSettings(),
    ]).then(([est, proj, s]) => {
      if (!est || !proj) { router.push(`/projects/${projectId}`); return }
      setEstimate(est)
      setProject(proj)
      setSettings(s)
      if (proj.customerId) {
        getCustomer(proj.customerId).then((c) => setCustomer(c ?? null))
      }
    })
  }, [estimateId, projectId, router])

  if (!mounted || !estimate || !project) return null

  const issueDate = estimate.createdAt
  const taxRateDisplay = estimate.subtotal > 0
    ? Math.round((estimate.tax / estimate.subtotal) * 100)
    : settings.taxRate
  const recipientName = customer?.name ?? project.clientName
  const issuerOk = isIssuerConfigured(settings)

  return (
    <>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 15mm;
        }
        @media print {
          body { background: white; }
        }
      `}</style>

      {/* 操作バー（印刷時非表示） */}
      <div className="print:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[860px] mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            案件詳細に戻る
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            PDF保存 / 印刷
          </button>
        </div>
        {!issuerOk && (
          <div className="max-w-[860px] mx-auto px-4 pb-3">
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              事業者名が未設定です。
              <a href="/settings" className="underline font-medium hover:text-amber-900">設定する →</a>
            </div>
          </div>
        )}
      </div>

      {/* 背景 */}
      <div className="print:bg-white bg-gray-100 min-h-screen py-8 print:py-0">
        {/* モバイル向け注意 */}
        <div className="print:hidden sm:hidden px-4 pb-3">
          <p className="text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2 text-center">
            横にスクロールして確認できます。印刷・PDF保存はPC表示を推奨します。
          </p>
        </div>
        {/* 横スクロールラッパー */}
        <div className="overflow-x-auto print:overflow-visible">
        {/* A4用紙 */}
        <div className="max-w-[794px] mx-auto bg-white print:shadow-none shadow-lg print:p-0 p-[15mm] min-w-[580px] print:min-w-0">

          {/* タイトル行 */}
          <div className="flex items-start justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-wide">見　積　書</h1>
            <div className="text-right text-xs text-gray-500 space-y-0.5">
              <p>見積番号：{formatEstimateNumber(estimate.id, estimate.createdAt)}</p>
              <p>発行日：{formatDate(issueDate)}</p>
              <p>有効期限：{addDays(issueDate, settings.estimateValidDays)}</p>
            </div>
          </div>

          {/* 宛先 / 発行者 */}
          <div className="flex items-start justify-between mb-8 gap-8">
            {/* 宛先 */}
            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-900 border-b-2 border-gray-900 pb-1 inline-block">
                {recipientName}　御中
              </p>
            </div>
            {/* 発行者 */}
            <div className="text-right text-sm text-gray-700 space-y-0.5 shrink-0 max-w-[220px]">
              {settings.issuerLogoUrl && (
                <div className="flex justify-end mb-2">
                  <img
                    src={settings.issuerLogoUrl}
                    alt="ロゴ"
                    className="h-12 max-w-[120px] object-contain"
                  />
                </div>
              )}
              <p className={`font-bold text-base ${!settings.issuerName ? 'text-gray-400' : ''}`}>
                {settings.issuerName || '（事業者名未設定）'}
              </p>
              {settings.issuerRepresentativeName && (
                <p className="text-gray-600">{settings.issuerRepresentativeName}</p>
              )}
              {settings.issuerDepartment && (
                <p className="text-gray-500">{settings.issuerDepartment}</p>
              )}
              {settings.issuerPostalCode && (
                <p className="text-gray-500">〒{settings.issuerPostalCode}</p>
              )}
              {settings.issuerAddress && (
                <p className="text-gray-500">{settings.issuerAddress}</p>
              )}
              {settings.issuerPhone && (
                <p className="text-gray-500">TEL: {settings.issuerPhone}</p>
              )}
              {settings.issuerEmail && (
                <p className="text-gray-500">{settings.issuerEmail}</p>
              )}
            </div>
          </div>

          {/* 件名 */}
          <div className="mb-8 bg-gray-50 rounded px-4 py-3">
            <span className="text-xs text-gray-500 mr-2">件名</span>
            <span className="text-sm font-semibold text-gray-900">{estimate.title}</span>
          </div>

          {/* 合計金額 */}
          <div className="flex items-center justify-end mb-6">
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-0.5">お見積金額（税込）</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(estimate.total)}</p>
            </div>
          </div>

          {/* 明細テーブル */}
          <table className="w-full text-sm border-collapse mb-8">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="text-left px-3 py-2 font-medium w-[40%]">項目</th>
                <th className="text-right px-3 py-2 font-medium w-[15%]">数量</th>
                <th className="text-right px-3 py-2 font-medium w-[20%]">単価</th>
                <th className="text-right px-3 py-2 font-medium w-[25%]">金額</th>
              </tr>
            </thead>
            <tbody>
              {estimate.items.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`border-b border-gray-200 break-inside-avoid ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}
                >
                  <td className="px-3 py-2.5 align-top">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right align-top text-gray-700">
                    {item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right align-top text-gray-700">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-3 py-2.5 text-right align-top font-medium text-gray-900">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200">
                <td colSpan={3} className="px-3 py-2 text-right text-xs text-gray-500">小計</td>
                <td className="px-3 py-2 text-right text-sm text-gray-700">{formatCurrency(estimate.subtotal)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="px-3 py-2 text-right text-xs text-gray-500">消費税（{taxRateDisplay}%）</td>
                <td className="px-3 py-2 text-right text-sm text-gray-700">{formatCurrency(estimate.tax)}</td>
              </tr>
              <tr className="bg-gray-900 text-white">
                <td colSpan={3} className="px-3 py-3 text-right font-semibold">合計（税込）</td>
                <td className="px-3 py-3 text-right font-bold text-base">{formatCurrency(estimate.total)}</td>
              </tr>
            </tfoot>
          </table>

          {/* 備考 */}
          {(estimate.note || settings.estimateNote) && (
            <div className="mb-8">
              <p className="text-xs font-semibold text-gray-500 mb-2 border-b border-gray-200 pb-1">備考</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{estimate.note || settings.estimateNote}</p>
            </div>
          )}

          {/* フッター */}
          <div className="border-t border-gray-200 pt-4 text-xs text-gray-400 text-center mt-8">
            <p>本見積書の有効期限は発行日より{settings.estimateValidDays}日間です。ご不明な点はお気軽にお問い合わせください。</p>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}
