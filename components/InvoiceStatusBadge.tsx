import { InvoiceStatus } from '@/lib/types'

const CONFIG: Record<InvoiceStatus, { label: string; className: string }> = {
  draft:    { label: '下書き',      className: 'bg-gray-100 text-gray-600' },
  sent:     { label: '送付済み',    className: 'bg-blue-100 text-blue-700' },
  paid:     { label: '入金済み',    className: 'bg-emerald-100 text-emerald-700' },
  overdue:  { label: '期限超過',    className: 'bg-red-100 text-red-600' },
  canceled: { label: 'キャンセル',  className: 'bg-gray-100 text-gray-400' },
}

export default function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { label, className } = CONFIG[status] ?? CONFIG.draft
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  )
}
