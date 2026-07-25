import type { IntentPhase } from '@/lib/domain/intent-state'
import { PHASE_ICON } from './journey-copy'

// ── Phase color system — per UX Bible Part V ──────────────────────────────────
// Blue=progress/discovery, Amber=attention/assessment, Violet=momentum/planning,
// Emerald=achievement/execution, Yellow=habit
const BADGE_STYLES: Record<IntentPhase, { bg: string; text: string; dot: string }> = {
  discovery:  {
    bg:   'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    dot:  'bg-blue-500',
  },
  assessment: {
    bg:   'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    dot:  'bg-amber-500',
  },
  planning: {
    bg:   'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800',
    text: 'text-violet-700 dark:text-violet-300',
    dot:  'bg-violet-500',
  },
  execution: {
    bg:   'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot:  'bg-emerald-500',
  },
  habit: {
    bg:   'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-700 dark:text-yellow-300',
    dot:  'bg-yellow-500',
  },
}

interface Props {
  readonly phase: IntentPhase
  readonly label: string
  readonly stepsLabel: string
}

export function JourneyBadge({ phase, label, stepsLabel }: Props) {
  const { bg, text, dot } = BADGE_STYLES[phase]
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`inline-flex items-center gap-2 text-[11px] font-semibold px-3 py-1.5 rounded-full border ${bg} ${text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />
        {PHASE_ICON[phase]} {label}
      </span>
      <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
        {stepsLabel}
      </span>
    </div>
  )
}
