import { ProjectStatusCheck, StatusLevel } from '@/lib/utils'

const CONFIG: Record<StatusLevel, { emoji: string; label: string; badgeCls: string }> = {
  action: { emoji: '🔴', label: '要対応', badgeCls: 'bg-red-100 text-red-700' },
  check:  { emoji: '🟡', label: '要確認', badgeCls: 'bg-amber-100 text-amber-700' },
  ok:     { emoji: '🟢', label: '問題なし', badgeCls: 'bg-emerald-100 text-emerald-700' },
}

interface Props {
  check: ProjectStatusCheck
  showReasons?: boolean
}

export default function ProjectStatusBadge({ check, showReasons = false }: Props) {
  const { emoji, label, badgeCls } = CONFIG[check.level]
  return (
    <div>
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${badgeCls}`}>
        {emoji} {label}
      </span>
      {showReasons && check.reasons.length > 0 && (
        <ul className="mt-1 space-y-0.5">
          {check.reasons.map((r, i) => (
            <li key={i} className="text-xs text-gray-500">・{r}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
