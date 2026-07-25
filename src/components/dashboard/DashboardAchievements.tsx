import type { ResultRecord } from '@/lib/user/types'

// Shows the last N completed instruments.
// Per UX Bible Part III — Sunk Cost Advantage:
// "Always remind the user of what they've already invested."

interface Props {
  readonly instruments: readonly ResultRecord[]
  readonly limit?: number
}

function formatValue(record: ResultRecord): string | null {
  if (record.result_value === null) return null
  const val = record.result_value.toFixed(1).replace(/\.0$/, '')
  return record.unit ? `${val} ${record.unit}` : val
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7)  return `${diffDays} days ago`
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export function DashboardAchievements({ instruments, limit = 5 }: Props) {
  const recent = [...instruments].reverse().slice(0, limit)

  if (recent.length === 0) return null

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">

      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          What You've Done
        </p>
      </div>

      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {recent.map((record) => (
          <li key={record.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 12 12">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                  {record.instrument_name}
                </p>
                {record.result_label && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {record.result_label}
                    {formatValue(record) ? ` · ${formatValue(record)}` : ''}
                  </p>
                )}
              </div>
            </div>
            <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
              {formatDate(record.completed_at)}
            </span>
          </li>
        ))}
      </ul>

    </div>
  )
}
