import { ProjectStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const config: Record<ProjectStatus, { label: string; cls: string }> = {
  商談中: { label: '商談中', cls: 'bg-amber-100 text-amber-700' },
  提案済: { label: '提案済', cls: 'bg-blue-100 text-blue-700' },
  受注: { label: '受注', cls: 'bg-emerald-100 text-emerald-700' },
  進行中: { label: '進行中', cls: 'bg-violet-100 text-violet-700' },
  完了: { label: '完了', cls: 'bg-gray-100 text-gray-600' },
  失注: { label: '失注', cls: 'bg-red-100 text-red-600' },
}

export default function StatusBadge({ status }: { status: ProjectStatus }) {
  const { label, cls } = config[status]
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', cls)}>
      {label}
    </span>
  )
}
