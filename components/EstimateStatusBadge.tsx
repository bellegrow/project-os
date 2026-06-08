import { EstimateStatus } from '@/lib/types'

const CONFIG: Record<EstimateStatus, { label: string; className: string }> = {
  draft:    { label: '下書き',   className: 'bg-gray-100 text-gray-600' },
  sent:     { label: '送付済み', className: 'bg-blue-100 text-blue-700' },
  approved: { label: '承認済み', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '却下',     className: 'bg-red-100 text-red-600' },
}

export default function EstimateStatusBadge({ status }: { status: EstimateStatus }) {
  const { label, className } = CONFIG[status] ?? CONFIG.draft
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  )
}
