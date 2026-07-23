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

import { useEffect, useState, useCallback } from 'react'
import { getBrowserRuntime } from '@/lib/runtime/platform'
import type { ActivePlan } from '@/lib/domain/active-plan'
import type { StrategyDecision } from '@/lib/domain/strategy-decision'
import type { IntentCluster } from '@/lib/assessment/types'
import { ActivePlanView } from './ActivePlanView'
import { GoalInputForm } from './GoalInputForm'
import { PlanSkeleton } from './PlanSkeleton'

interface Props {
  readonly cluster: string
  readonly lang: string
}

type PlannerState =
  | { type: 'loading' }
  | { type: 'no_plan' }
  | { type: 'needs_goal'; strategy: StrategyDecision }
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
  const [state, setState] = useState<PlannerState>({ type: 'loading' })

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
        setState({ type: 'needs_goal', strategy: strategy! })
      } else {
        setState({ type: 'active_plan', plan, strategy })
      }
    } else if (strategy && strategy.cluster === cluster) {
      setState({ type: 'needs_goal', strategy })
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
    // platform:intent_state_updated from P47 triggers resolveState() via useEffect
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
        onGoalSet={handleGoalSet}
      />
    )
  }

  if (state.type === 'completed') {
    return <CompletedState plan={state.plan} lang={lang} cluster={cluster} />
  }

  return (
    <ActivePlanView
      plan={state.plan}
      strategy={state.strategy}
      lang={lang}
      onCheckIn={handleCheckIn}
    />
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
    <div className="text-center py-16 space-y-6">
      <div className="text-5xl">🏆</div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
        Goal Achieved!
      </h2>
      <p className="text-slate-600 dark:text-slate-400">
        You completed your {plan.goal}
      </p>
      <a
        href={`/${lang}/dashboard`}
        className="inline-block bg-emerald-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-emerald-700 transition-colors"
      >
        View Dashboard →
      </a>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clusterUnit(cluster: string): string {
  return { weight: 'kg', sleep: 'hours', finance: 'saved' }[cluster] ?? 'units'
}
