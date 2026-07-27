'use client'

import { useState } from 'react'
import type { ActivePlan, Milestone } from '@/lib/domain/active-plan'
import type { StrategyDecision } from '@/lib/domain/strategy-decision'
import { CheckInModal } from './CheckInModal'
import { getT } from '@/lib/i18n/ui'

interface Props {
  readonly plan: ActivePlan
  readonly strategy: StrategyDecision | null
  readonly lang: string
  readonly onCheckIn: (checkIn: {
    week: number
    actual_value: number
    subjective_score: number
    notes: string | null
  }) => void
}

function MilestoneRow({ milestone, isNext, t }: { milestone: Milestone; isNext: boolean; t: ReturnType<typeof getT> }) {
  const icon = milestone.is_completed
    ? '✅'
    : isNext ? '🎯' : '○'

  const rowClass = milestone.is_completed
    ? 'opacity-60'
    : isNext
      ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl px-3'
      : ''

  return (
    <div className={`flex items-center gap-3 py-2 ${rowClass}`}>
      <span className="text-lg w-7 text-center shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
          {milestone.description}
        </div>
        {milestone.is_completed && milestone.actual_value !== null && (
          <div className="text-xs text-slate-500">
            {t('plan.active.actual', { value: String(milestone.actual_value) })}
            {milestone.actual_value !== milestone.target_value && ` (${t('plan.active.target', { value: String(milestone.target_value) })})`}
          </div>
        )}
      </div>
      <div className="text-xs text-slate-500 shrink-0">{t('plan.active.week_short', { n: String(milestone.week) })}</div>
    </div>
  )
}

export function ActivePlanView({ plan, strategy, lang, onCheckIn }: Props) {
  const [showCheckIn, setShowCheckIn] = useState(false)
  const t = getT(lang)

  const completedMilestones = plan.milestones.filter(m => m.is_completed)
  const nextMilestone       = plan.milestones.find(m => !m.is_completed)
  const progressPercent     = Math.round((completedMilestones.length / plan.milestones.length) * 100)
  const currentWeek         = plan.check_ins.length > 0
    ? plan.check_ins[plan.check_ins.length - 1]!.week + 1
    : 1

  const lastCheckIn     = plan.check_ins[plan.check_ins.length - 1]
  const needsCheckIn    = lastCheckIn
    ? (Date.now() - new Date(lastCheckIn.recorded_at).getTime()) > 6 * 24 * 3600_000
    : plan.check_ins.length === 0 && currentWeek > 1

  const unit = plan.cluster === 'weight' ? 'kg' : ''

  return (
    <div className="space-y-6">
      {/* Plan Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-widest mb-1">
              {strategy?.selected_strategy_name ?? t('plan.active.adaptive')} · {t('plan.active.week', { n: String(currentWeek) })}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {plan.goal}
            </h2>
            <div className="text-sm text-slate-500 mt-0.5">
              {t('plan.active.duration', { weeks: String(plan.duration_weeks) })}
              {plan.adaptation_count > 0 && ` · ${t('plan.active.adapted', { n: String(plan.adaptation_count) })}`}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-blue-600">{progressPercent}%</div>
            <div className="text-xs text-slate-500">{t('plan.active.complete')}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>{t('plan.active.start_label')} {plan.current_value} {unit}</span>
          <span>{t('plan.active.goal_label')} {plan.goal_value} {unit}</span>
        </div>
      </div>

      {/* Check-in CTA */}
      {needsCheckIn && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-4 flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-emerald-800 dark:text-emerald-200 text-sm">
              {t('plan.active.checkin_title', { week: String(currentWeek) })}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
              {t('plan.active.checkin_sub')}
            </div>
          </div>
          <button
            onClick={() => setShowCheckIn(true)}
            className="shrink-0 bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
          >
            {t('plan.active.checkin_btn')}
          </button>
        </div>
      )}

      {/* Milestones */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t('plan.active.milestones')}</h3>
        <div className="space-y-1">
          {plan.milestones.map(m => (
            <MilestoneRow
              key={m.milestone_id}
              milestone={m}
              isNext={m.milestone_id === nextMilestone?.milestone_id}
              t={t}
            />
          ))}
        </div>
      </div>

      {/* Check-in history */}
      {plan.check_ins.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t('plan.active.history')}</h3>
          <div className="space-y-2">
            {[...plan.check_ins].reverse().slice(0, 5).map(ci => (
              <div key={ci.check_in_id} className="flex items-center gap-3 text-sm">
                <span className="text-lg">{ci.on_track ? '✅' : '⚠️'}</span>
                <span className="text-slate-600 dark:text-slate-400">{t('plan.active.week', { n: String(ci.week) })}</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {ci.actual_value} {unit}
                </span>
                <span className="text-slate-400 text-xs ml-auto">
                  {t('plan.active.deviation', { pct: String(ci.deviation_percent) })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check-in Modal */}
      {showCheckIn && (
        <CheckInModal
          week={currentWeek}
          cluster={plan.cluster}
          onSubmit={(data) => {
            onCheckIn(data)
            setShowCheckIn(false)
          }}
          onClose={() => setShowCheckIn(false)}
        />
      )}
    </div>
  )
}
