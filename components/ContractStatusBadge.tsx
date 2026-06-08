import { ContractStatus } from '@/lib/types'

const CONFIG: Record<ContractStatus, { label: string; className: string }> = {
  draft:     { label: '下書き',    className: 'bg-gray-100 text-gray-600' },
  sent:      { label: '送付済み',  className: 'bg-blue-100 text-blue-700' },
  signed:    { label: '締結済み',  className: 'bg-violet-100 text-violet-700' },
  completed: { label: '完了',      className: 'bg-emerald-100 text-emerald-700' },
  canceled:  { label: 'キャンセル', className: 'bg-gray-100 text-gray-400' },
}

export default function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const { label, className } = CONFIG[status] ?? CONFIG.draft
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  )
}
