'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Printer, AlertTriangle } from 'lucide-react'
import { Contract, Project, Customer, Estimate, Invoice } from '@/lib/types'
import { getContract, getProject, getCustomer, getEstimate, getInvoice } from '@/lib/dataSource'
import { formatCurrency, formatContractNumber, formatEstimateNumber, formatInvoiceNumber, formatYMD } from '@/lib/utils'
import { getSettings, BusinessSettings, isIssuerConfigured, SETTINGS_DEFAULTS } from '@/lib/settingsSource'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function ContractPreviewPage() {
  const params = useParams()
  const projectId = params.id as string
  const contractId = params.contractId as string
  const router = useRouter()

  const [contract, setContract] = useState<Contract | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [relEstimate, setRelEstimate] = useState<Estimate | null>(null)
  const [relInvoice, setRelInvoice] = useState<Invoice | null>(null)
  const [settings, setSettings] = useState<BusinessSettings>(SETTINGS_DEFAULTS)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    Promise.all([
      getContract(contractId),
      getProject(projectId),
      getSettings(),
    ]).then(([con, proj, s]) => {
      if (!con || !proj) { router.push(`/projects/${projectId}`); return }
      setContract(con)
      setProject(proj)
      setSettings(s)
      if (proj.customerId) {
        getCustomer(proj.customerId).then((c) => setCustomer(c ?? null))
      }
      if (con.estimateId) {
        getEstimate(con.estimateId).then((e) => setRelEstimate(e ?? null))
      }
      if (con.invoiceId) {
        getInvoice(con.invoiceId).then((i) => setRelInvoice(i ?? null))
      }
    })
  }, [contractId, projectId, router])

  if (!mounted || !contract || !project) return null

  const issuerOk = isIssuerConfigured(settings)
  const clientName = customer?.name ?? project.clientName
  const contractNum = formatContractNumber(contract.id, contract.createdAt)

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
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            戻る
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
              事業者名（乙）が未設定です。
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
            <h1 className="text-2xl font-bold text-gray-900 tracking-wide">業　務　委　託　契　約　書</h1>
            <div className="text-right text-xs text-gray-500 space-y-0.5">
              <p>契約番号：{contractNum}</p>
              <p>作成日：{formatDate(contract.createdAt)}</p>
              {contract.contractDate && (
                <p className="font-medium text-gray-700">契約日：{formatYMD(contract.contractDate)}</p>
              )}
            </div>
          </div>

          {/* 甲・乙 */}
          <div className="flex items-start justify-between mb-8 gap-8">
            {/* 甲（発注者） */}
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">甲（発注者）</p>
              <p className="text-lg font-semibold text-gray-900 border-b-2 border-gray-900 pb-1 inline-block">
                {clientName}
              </p>
            </div>
            {/* 乙（受託者） */}
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
              <p className="text-xs text-gray-400">乙（受託者）</p>
              <p className={`font-bold text-base ${!issuerOk ? 'text-gray-400' : ''}`}>
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
          <div className="mb-6 bg-gray-50 rounded px-4 py-3">
            <span className="text-xs text-gray-500 mr-2">件名</span>
            <span className="text-sm font-semibold text-gray-900">{contract.title}</span>
          </div>

          {/* 契約金額（設定時のみ） */}
          {contract.amount != null && (
            <div className="flex items-end justify-end mb-6">
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-0.5">契約金額（税込）</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(contract.amount)}</p>
              </div>
            </div>
          )}

          {/* 契約詳細テーブル */}
          <table className="w-full text-sm border-collapse mb-8">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="text-left px-3 py-2 font-medium w-[35%]">項目</th>
                <th className="text-left px-3 py-2 font-medium">内容</th>
              </tr>
            </thead>
            <tbody>
              {contract.contractDate && (
                <tr className="border-b border-gray-200 bg-white">
                  <td className="px-3 py-2.5 text-gray-500">契約日</td>
                  <td className="px-3 py-2.5 text-gray-900">{formatYMD(contract.contractDate)}</td>
                </tr>
              )}
              {(contract.startDate || contract.endDate) && (
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="px-3 py-2.5 text-gray-500">契約期間</td>
                  <td className="px-3 py-2.5 text-gray-900">
                    {contract.startDate ? formatYMD(contract.startDate) : '未定'}
                    　〜
                    {contract.endDate ? formatYMD(contract.endDate) : '未定'}
                  </td>
                </tr>
              )}
              <tr className={`border-b border-gray-200 ${(contract.startDate || contract.endDate) ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-3 py-2.5 text-gray-500">案件名</td>
                <td className="px-3 py-2.5 text-gray-900">{project.name}</td>
              </tr>
            </tbody>
          </table>

          {/* 関連書類（見積書・請求書） */}
          {(relEstimate || relInvoice) && (
            <div className="mb-8 border border-gray-200 rounded p-4">
              <p className="text-xs font-semibold text-gray-600 mb-3">関連書類</p>
              <div className="text-sm text-gray-700 space-y-1.5">
                {relEstimate && (
                  <div className="flex gap-4">
                    <span className="text-xs text-gray-400 w-20 shrink-0">見積書</span>
                    <span>
                      {formatEstimateNumber(relEstimate.id, relEstimate.createdAt)}
                      　{relEstimate.title}
                    </span>
                  </div>
                )}
                {relInvoice && (
                  <div className="flex gap-4">
                    <span className="text-xs text-gray-400 w-20 shrink-0">請求書</span>
                    <span>
                      {formatInvoiceNumber(relInvoice.id, relInvoice.createdAt)}
                      　{relInvoice.title}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 備考 */}
          {contract.note && (
            <div className="mb-8">
              <p className="text-xs font-semibold text-gray-500 mb-2 border-b border-gray-200 pb-1">備考・特記事項</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{contract.note}</p>
            </div>
          )}

          {/* 署名欄 */}
          <div className="mt-12 flex gap-8">
            <div className="flex-1 border-t-2 border-gray-900 pt-3">
              <p className="text-xs text-gray-500 mb-1">甲（発注者）</p>
              <p className="text-sm font-semibold text-gray-900">{clientName}</p>
              <p className="text-xs text-gray-400 mt-6">署名 / 捺印</p>
              <div className="h-12 border-b border-gray-300 mt-1" />
            </div>
            <div className="flex-1 border-t-2 border-gray-900 pt-3">
              <p className="text-xs text-gray-500 mb-1">乙（受託者）</p>
              <p className={`text-sm font-semibold ${!issuerOk ? 'text-gray-400' : 'text-gray-900'}`}>
                {settings.issuerName || '（事業者名未設定）'}
              </p>
              {settings.issuerRepresentativeName && (
                <p className="text-xs text-gray-600 mt-0.5">代表者　{settings.issuerRepresentativeName}</p>
              )}
              <p className="text-xs text-gray-400 mt-6">署名 / 捺印</p>
              <div className="h-12 border-b border-gray-300 mt-1" />
            </div>
          </div>

          {/* フッター */}
          <div className="border-t border-gray-200 pt-4 text-xs text-gray-400 text-center mt-8">
            <p>本契約書は甲乙各1通を保管するものとします。</p>
            <p className="mt-0.5">契約番号：{contractNum}</p>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}
