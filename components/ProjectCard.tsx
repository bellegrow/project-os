import { Project } from '@/lib/types'
import { formatRelativeDate, formatCurrency, daysSince } from '@/lib/utils'
import StatusBadge from './StatusBadge'
import { ChevronRight } from 'lucide-react'

interface Props {
  project: Project
  lastHearingMemo?: string
  lastHearingDate?: string
  onClick: () => void
}

export default function ProjectCard({ project, lastHearingMemo, lastHearingDate, onClick }: Props) {
  const stale =
    lastHearingDate && (project.status === '商談中' || project.status === '提案済')
      ? daysSince(lastHearingDate)
      : 0

  return (
    <button
      onClick={onClick}
      className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-blue-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 mb-0.5">{project.clientName}</p>
          <h3 className="text-sm font-semibold text-gray-900 truncate">{project.name}</h3>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StatusBadge status={project.status} />
            {project.budget && (
              <span className="text-xs text-gray-400">{formatCurrency(project.budget)}</span>
            )}
            {stale >= 7 && (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                {stale}日動きなし
              </span>
            )}
          </div>
          {lastHearingMemo && (
            <div className="mt-2 space-y-0.5">
              <p className="text-xs text-gray-400 line-clamp-1">前回：{lastHearingMemo}</p>
              {lastHearingDate && (
                <p className="text-xs text-gray-400">
                  最終ヒアリング：{formatRelativeDate(lastHearingDate)}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
          <span className="text-xs text-gray-400">{formatRelativeDate(project.updatedAt)}</span>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
        </div>
      </div>
    </button>
  )
}
