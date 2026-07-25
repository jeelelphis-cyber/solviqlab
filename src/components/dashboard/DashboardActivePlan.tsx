import type { ActivePlan } from '@/lib/domain/active-plan'
import type { IntentCluster } from '@/lib/assessment/types'
import { planProgressPct, planCheckInDue } from './dashboard-copy'

interface Props {
  readonly plan: ActivePlan
  readonly lang: string
  readonly cluster: IntentCluster
}

export function DashboardActivePlan({ plan, lang, cluster }: Props) {
  const pct       = planProgressPct(plan)
  const checkInDue = planCheckInDue(plan)
  const lastCheckIn = plan.check_ins[plan.check_ins.length - 1]
  const weeksIn   = plan.check_ins.length
  const onTrack   = lastCheckIn?.on_track ?? true

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            Active Plan
          </p>
          <p className="text-base font-bold text-slate-900 dark:text-white leading-snug">
            {plan.goal}
          </p>
        </div>
        <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
          onTrack
            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
            : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
        }`}>
          {onTrack ? 'On track' : 'Needs attention'}
        </span>
      </div>

      {/* Progress toward goal */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Progress toward goal
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {weeksIn > 0 ? `Week ${weeksIn} of ${plan.duration_weeks}` : 'Starting'}
          </span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.max(pct, 4)}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {pct > 0 ? `${pct}% of the way to your goal.` : 'First check-in will show your progress here.'}
        </p>
      </div>

      {/* Strategy */}
      <div className="text-xs text-slate-500 dark:text-slate-400 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
        Strategy: <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{plan.strategy_id.replace(/-/g, ' ')}</span>
        {' · '}{plan.milestones.length} milestones
      </div>

      {/* Check-in CTA (if due) */}
      {checkInDue && (
        <a
          href={`/${lang}/plan/${cluster}`}
          className="group flex items-center justify-center gap-2 w-full
                     py-2.5 px-4 min-h-[44px]
                     border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400
                     text-sm font-semibold rounded-xl
                     hover:bg-emerald-50 dark:hover:bg-emerald-950/30
                     active:scale-[0.98] transition-all duration-150"
        >
          Log My Check-In
          <svg className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" fill="none" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      )}
    </div>
  )
}
