'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Printer, AlertTriangle } from 'lucide-react'
import { Invoice, Project, Customer } from '@/lib/types'
import { getInvoice, getProject, getCustomer } from '@/lib/dataSource'
import { formatCurrency, formatInvoiceNumber, isInvoiceOverdue, formatYMD } from '@/lib/utils'
import { getSettings, BusinessSettings, isIssuerConfigured, isBankConfigured, SETTINGS_DEFAULTS } from '@/lib/settingsSource'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

// dueDate は YYYY-MM-DD 形式なのでタイムゾーンの影響を受けないよう文字列で処理
function formatDueDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return `${year}年${month}月${day}日`
}

export default function InvoicePreviewPage() {
  const params = useParams()
  const projectId = params.id as string
  const invoiceId = params.invoiceId as string
  const router = useRouter()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [settings, setSettings] = useState<BusinessSettings>(SETTINGS_DEFAULTS)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    Promise.all([
      getInvoice(invoiceId),
      getProject(projectId),
      getSettings(),
    ]).then(([inv, proj, s]) => {
      if (!inv || !proj) { router.push(`/projects/${projectId}`); return }
      setInvoice(inv)
      setProject(proj)
      setSettings(s)
      if (proj.customerId) {
        getCustomer(proj.customerId).then((c) => setCustomer(c ?? null))
      }
    })
  }, [invoiceId, projectId, router])

  if (!mounted || !invoice || !project) return null

  const taxRateDisplay = invoice.subtotal > 0
    ? Math.round((invoice.tax / invoice.subtotal) * 100)
    : settings.taxRate
  const recipientName = customer?.name ?? project.clientName
  const overdue = isInvoiceOverdue(invoice)
  const issuerOk = isIssuerConfigured(settings)
  const bankOk = isBankConfigured(settings)

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

        {/* 警告バナー（操作バー内） */}
        {(overdue || !issuerOk || !bankOk) && (
          <div className="max-w-[860px] mx-auto px-4 pb-3 space-y-1.5">
            {overdue && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                支払期限が超過しています。
              </div>
            )}
            {!issuerOk && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                事業者名が未設定です。
                <a href="/settings" className="underline font-medium hover:text-amber-900">設定する →</a>
              </div>
            )}
            {!bankOk && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                振込先情報が未設定です。
                <a href="/settings" className="underline font-medium hover:text-amber-900">設定する →</a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 背景 */}
      <div className="print:bg-white bg-gray-100 min-h-screen py-8 print:py-0">
        {/* A4用紙 */}
        <div className="max-w-[794px] mx-auto bg-white print:shadow-none shadow-lg print:p-0 p-[15mm]">

          {/* 入金済みバナー */}
          {invoice.status === 'paid' && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded px-4 py-2.5 text-xs text-emerald-700 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-bold text-sm">入金済</span>
              {invoice.paidAt && <span>入金日：{formatYMD(invoice.paidAt)}</span>}
              {invoice.paidAmount != null && <span>入金額：{formatCurrency(invoice.paidAmount)}</span>}
              {invoice.paidAmount != null && invoice.paidAmount !== invoice.total && (
                <span className="text-amber-600 font-medium">
                  差額：{formatCurrency(Math.abs(invoice.paidAmount - invoice.total))}
                  {invoice.paidAmount < invoice.total ? '（不足）' : '（超過）'}
                </span>
              )}
              {invoice.paymentNote && <span className="text-emerald-600">{invoice.paymentNote}</span>}
            </div>
          )}

          {/* タイトル行 */}
          <div className="flex items-start justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-wide">請　求　書</h1>
            <div className="text-right text-xs text-gray-500 space-y-0.5">
              <p>請求番号：{formatInvoiceNumber(invoice.id, invoice.createdAt)}</p>
              <p>発行日：{formatDate(invoice.createdAt)}</p>
              {invoice.dueDate && (
                <p className={`font-medium ${overdue ? 'text-red-600' : 'text-gray-700'}`}>
                  支払期限：{formatDueDate(invoice.dueDate)}
                  {overdue && '　※期限超過'}
                </p>
              )}
            </div>
          </div>

          {/* 宛先 / 発行者 */}
          <div className="flex items-start justify-between mb-8 gap-8">
            {/* 宛先 */}
            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-900 border-b-2 border-gray-900 pb-1 inline-block">
                {recipientName}　御中
              </p>
              <p className="text-xs text-gray-500 mt-2">{project.name}</p>
            </div>
            {/* 発行者 */}
            <div className="text-right text-sm text-gray-700 space-y-0.5 shrink-0">
              <p className={`font-bold text-base ${!issuerOk ? 'text-gray-400' : ''}`}>
                {settings.issuerName || '（事業者名未設定）'}
              </p>
              {settings.issuerDepartment && (
                <p className="text-gray-500">{settings.issuerDepartment}</p>
              )}
              {settings.issuerEmail && (
                <p className="text-gray-500">{settings.issuerEmail}</p>
              )}
            </div>
          </div>

          {/* 件名 */}
          <div className="mb-6 bg-gray-50 rounded px-4 py-3">
            <span className="text-xs text-gray-500 mr-2">件名</span>
            <span className="text-sm font-semibold text-gray-900">{invoice.title}</span>
          </div>

          {/* 合計金額 */}
          <div className="flex items-end justify-end mb-6 gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-0.5">ご請求金額（税込）</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(invoice.total)}</p>
              {invoice.dueDate && invoice.status !== 'paid' && invoice.status !== 'canceled' && (
                <p className={`text-xs font-medium mt-1 ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
                  お支払期限：{formatDueDate(invoice.dueDate)}
                </p>
              )}
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
              {invoice.items.map((item, idx) => (
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
                <td className="px-3 py-2 text-right text-sm text-gray-700">{formatCurrency(invoice.subtotal)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="px-3 py-2 text-right text-xs text-gray-500">消費税（{taxRateDisplay}%）</td>
                <td className="px-3 py-2 text-right text-sm text-gray-700">{formatCurrency(invoice.tax)}</td>
              </tr>
              <tr className="bg-gray-900 text-white">
                <td colSpan={3} className="px-3 py-3 text-right font-semibold">合計（税込）</td>
                <td className="px-3 py-3 text-right font-bold text-base">{formatCurrency(invoice.total)}</td>
              </tr>
            </tfoot>
          </table>

          {/* 振込先情報 */}
          <div className="mb-8 border border-gray-200 rounded p-4">
            <p className="text-xs font-semibold text-gray-600 mb-3">お振込先</p>
            {!bankOk ? (
              <p className="text-sm text-gray-400">（振込先情報が未設定です）</p>
            ) : (
              <div className="text-sm text-gray-700 space-y-1.5">
                <div className="flex gap-4">
                  <span className="text-xs text-gray-400 w-16 shrink-0">銀行名</span>
                  <span>
                    {settings.bankName}
                    {settings.bankBranch && `　${settings.bankBranch}`}
                    {`　${settings.bankAccountType}`}
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-xs text-gray-400 w-16 shrink-0">口座番号</span>
                  <span>{settings.bankAccountNumber}</span>
                </div>
                {settings.bankAccountHolder && (
                  <div className="flex gap-4">
                    <span className="text-xs text-gray-400 w-16 shrink-0">口座名義</span>
                    <span className="font-medium">{settings.bankAccountHolder}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 備考 */}
          {(invoice.note || settings.documentNote) && (
            <div className="mb-8">
              <p className="text-xs font-semibold text-gray-500 mb-2 border-b border-gray-200 pb-1">備考</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{invoice.note || settings.documentNote}</p>
            </div>
          )}

          {/* フッター */}
          <div className="border-t border-gray-200 pt-4 text-xs text-gray-400 text-center mt-8">
            <p>お振込の際は、請求番号をご明記ください。ご不明な点はお気軽にお問い合わせください。</p>
          </div>
        </div>
      </div>
    </>
  )
}
