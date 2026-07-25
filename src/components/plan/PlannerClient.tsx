'use client'

// ─────────────────────────────────────────────────────────────────────────────
// PlannerClient — Adaptive Plan UI
//
// 5 states driven by live IntentState:
//   loading      → skeleton
//   no_plan      → CTA to complete assessment
//   needs_goal   → goal input form (user sets target weight/metric)
//   active_plan  → milestone timeline + check-in trigger
//   completed    → celebration + next journey
//
// Reads: runtime.userEngine.getIntentState(cluster) — single read point (P-16)
// Writes: runtime.bus.dispatch() — never calls PlannerEngine directly (H-2)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback, useRef } from 'react'
import { getBrowserRuntime } from '@/lib/runtime/platform'
import type { ActivePlan } from '@/lib/domain/active-plan'
import type { StrategyDecision } from '@/lib/domain/strategy-decision'
import type { IntentCluster } from '@/lib/assessment/types'
import type { CoachMessage } from '@/lib/coach'
import { coachService } from '@/lib/coach'
import { ActivePlanView } from './ActivePlanView'
import { GoalInputForm } from './GoalInputForm'
import { PlanSkeleton } from './PlanSkeleton'
import { CoachMessageCard } from '@/components/coach/CoachMessageCard'

interface Props {
  readonly cluster: string
  readonly lang: string
}

type PlannerState =
  | { type: 'loading' }
  | { type: 'no_plan' }
  | { type: 'needs_goal'; strategy: StrategyDecision; suggestedGoal: number | null }
  | { type: 'active_plan'; plan: ActivePlan; strategy: StrategyDecision | null }
  | { type: 'completed'; plan: ActivePlan }

const REFRESH_EVENTS = ['platform:intent_state_updated'] as const

const CLUSTER_LABELS: Record<string, string> = {
  weight:  'Weight Loss',
  sleep:   'Sleep Quality',
  finance: 'Financial Health',
}

const ASSESSMENT_HREF: Record<string, string> = {
  weight:  'assessment/weight',
  sleep:   'assessment/sleep',
  finance: 'assessment/finance',
}

export function PlannerClient({ cluster, lang }: Props) {
  const [state, setState]               = useState<PlannerState>({ type: 'loading' })
  const [coachMessage, setCoachMessage] = useState<CoachMessage | null>(null)
  const pendingTrigger                  = useRef<'plan:created' | 'plan:check_in' | null>(null)

  const resolveState = useCallback(() => {
    const runtime = getBrowserRuntime()
    // H-1: single read point — no individual getActivePlan() / getStrategyDecision() calls
    const intent = runtime.userEngine.getIntentState(cluster as IntentCluster)

    if (!intent) {
      setState({ type: 'no_plan' })
      return
    }

    const { activePlan: plan, latestStrategy: strategy } = intent

    if (plan && plan.cluster === cluster) {
      if (plan.status === 'completed') {
        setState({ type: 'completed', plan })
      } else if (plan.goal_value === 0) {
        // Suggest 90% of current value as first milestone
        const suggested = plan.current_value > 0
          ? Math.round(plan.current_value * 0.9 * 10) / 10
          : null
        setState({ type: 'needs_goal', strategy: strategy!, suggestedGoal: suggested })
      } else {
        setState({ type: 'active_plan', plan, strategy })
      }
    } else if (strategy && strategy.cluster === cluster) {
      setState({ type: 'needs_goal', strategy, suggestedGoal: null })
    } else {
      setState({ type: 'no_plan' })
    }
  }, [cluster])

  useEffect(() => {
    resolveState()

    const refresh = () => resolveState()
    REFRESH_EVENTS.forEach(e => window.addEventListener(e, refresh))
    return () => REFRESH_EVENTS.forEach(e => window.removeEventListener(e, refresh))
  }, [resolveState])

  const activePlanId     = state.type === 'active_plan' ? state.plan.plan_id : null
  const checkInCount     = state.type === 'active_plan' ? state.plan.check_ins.length : 0

  // Load coach message when plan becomes active (plan:created) or after a check-in
  useEffect(() => {
    if (!activePlanId) return
    const trigger = pendingTrigger.current ?? 'plan:created'
    pendingTrigger.current = null
    try {
      const runtime = getBrowserRuntime()
      const msg = coachService.getMessage(cluster as IntentCluster, trigger, lang, runtime)
      setCoachMessage(msg)
    } catch { /* non-critical */ }
  // checkInCount drives re-evaluation after each check-in
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlanId, checkInCount, lang, cluster])

  // Write memory + analytics after mount
  useEffect(() => {
    if (!coachMessage) return
    try {
      const runtime = getBrowserRuntime()
      coachService.markShown(coachMessage, cluster as IntentCluster, runtime, lang)
    } catch { /* non-critical */ }
  }, [coachMessage?.message_id, cluster])

  // H-2: dispatch event → P46 handler builds plan — no direct PlannerEngine call
  const handleGoalSet = useCallback((goalValue: number) => {
    const runtime = getBrowserRuntime()
    const ts = Date.now()
    runtime.bus.dispatch({
      type:      'solviqlab:result',
      eventId:   `goal_set:${cluster}:${ts}`,
      slug:      'planner:goal_set',
      name:      'Goal Set',
      value:     goalValue,
      label:     null,
      category:  null,
      unit:      clusterUnit(cluster),
      metadata:  { cluster, goalValue },
      timestamp: ts,
    }).catch(console.error)
  }, [cluster])

  // H-2: dispatch event → P47 handler adapts plan — no direct PlannerEngine call
  const handleCheckIn = useCallback((checkIn: {
    week: number
    actual_value: number
    subjective_score: number
    notes: string | null
  }) => {
    const runtime = getBrowserRuntime()
    const ts = Date.now()
    runtime.bus.dispatch({
      type:      'solviqlab:result',
      eventId:   `check_in:${cluster}:${ts}`,
      slug:      'planner:check_in',
      name:      'Plan Check-In',
      value:     checkIn.actual_value,
      label:     null,
      category:  null,
      unit:      null,
      metadata:  { cluster, ...checkIn },
      timestamp: ts,
    }).catch(console.error)
    // Set trigger so the next resolveState() loads the check_in coach message
    pendingTrigger.current = 'plan:check_in'
  }, [cluster])

  // ── Render ────────────────────────────────────────────────────────────────

  if (state.type === 'loading') return <PlanSkeleton />

  if (state.type === 'no_plan') {
    return <NoPlanState cluster={cluster} lang={lang} />
  }

  if (state.type === 'needs_goal') {
    return (
      <GoalInputForm
        cluster={cluster}
        strategy={state.strategy}
        lang={lang}
        suggestedGoal={state.suggestedGoal}
        onGoalSet={handleGoalSet}
      />
    )
  }

  if (state.type === 'completed') {
    return <CompletedState plan={state.plan} lang={lang} cluster={cluster} />
  }

  return (
    <div className="space-y-6">
      {coachMessage && <CoachMessageCard message={coachMessage} lang={lang} />}
      <ActivePlanView
        plan={state.plan}
        strategy={state.strategy}
        lang={lang}
        onCheckIn={handleCheckIn}
      />
    </div>
  )
}

// ── NoPlanState ───────────────────────────────────────────────────────────────

function NoPlanState({ cluster, lang }: { cluster: string; lang: string }) {
  const label = CLUSTER_LABELS[cluster] ?? cluster
  const href  = `/${lang}/${ASSESSMENT_HREF[cluster] ?? `assessment/${cluster}`}`

  return (
    <div className="text-center py-16 space-y-6">
      <div className="text-5xl">🎯</div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
        Your {label} Plan Awaits
      </h2>
      <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
        Complete your {label} Assessment first. It takes 3 minutes and gives us
        the data to build a truly personalized plan.
      </p>
      <a
        href={href}
        className="inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors"
      >
        Start {label} Assessment →
      </a>
    </div>
  )
}

// ── CompletedState ────────────────────────────────────────────────────────────

function CompletedState({ plan, lang, cluster }: { plan: ActivePlan; lang: string; cluster: string }) {
  return (
    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-8 space-y-5">

      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
          Goal Achieved
        </p>
        <h2 className="text-[22px] font-bold text-slate-900 dark:text-white leading-snug">
          You did it.
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {plan.goal} — that took consistency and effort.
          {plan.check_ins.length > 0 && ` ${plan.check_ins.length} weeks of check-ins.`}
          {' '}Your next journey is ready whenever you are.
        </p>
      </div>

      <a
        href={`/${lang}/dashboard`}
        className="group flex items-center justify-center gap-2 w-full
                   py-3 px-5 min-h-[44px]
                   bg-emerald-600 hover:bg-emerald-700 text-white
                   text-sm font-semibold rounded-xl
                   active:scale-[0.98] transition-all duration-150"
      >
        Start My Next Journey
        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" fill="none" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clusterUnit(cluster: string): string {
  return { weight: 'kg', sleep: 'hours', finance: 'saved' }[cluster] ?? 'units'
}
