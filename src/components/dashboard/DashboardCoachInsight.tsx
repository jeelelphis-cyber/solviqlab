import type { CoachInsight } from './dashboard-copy'
import { getT } from '@/lib/i18n/ui'

const STYLE: Record<CoachInsight['type'], { border: string; bg: string; icon: string; iconColor: string }> = {
  success: {
    border: 'border-emerald-200 dark:border-emerald-800',
    bg:     'bg-emerald-50 dark:bg-emerald-950/30',
    icon:   '✓',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  focus: {
    border: 'border-amber-200 dark:border-amber-800',
    bg:     'bg-amber-50 dark:bg-amber-950/30',
    icon:   '→',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    border: 'border-blue-200 dark:border-blue-800',
    bg:     'bg-blue-50 dark:bg-blue-950/30',
    icon:   '◦',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
}

interface Props {
  readonly insight: CoachInsight
  readonly lang: string
}

export function DashboardCoachInsight({ insight, lang }: Props) {
  const t = getT(lang)
  const s = STYLE[insight.type]

  return (
    <div className={`rounded-2xl border p-5 space-y-2 ${s.border} ${s.bg}`}>
      <div className="flex items-start gap-3">
        <span className={`text-base font-bold shrink-0 ${s.iconColor}`} aria-hidden="true">
          {s.icon}
        </span>
        <div className="space-y-1.5 min-w-0">
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {t('dashboard.insight.label')}
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
            {insight.title}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {insight.body}
          </p>
        </div>
      </div>
    </div>
  )
}
