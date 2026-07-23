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
// Reads from: UserEngine (strategy + active plan)
// Writes via: EventBus (check-in result → adapt())
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react'
import { getBrowserRuntime } from '@/lib/runtime/platform'
import type { ActivePlan } from '@/lib/domain/active-plan'
import type { StrategyDecision } from '@/lib/domain/strategy-decision'
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
  weight: 'Weight Loss',
  sleep:  'Sleep Quality',
  finance: 'Financial Health',
}

const ASSESSMENT_HREF: Record<string, string> = {
  weight: 'assessment/weight',
  sleep:  'assessment/sleep',
  finance: 'assessment/finance',
}

export function PlannerClient({ cluster, lang }: Props) {
  const [state, setState] = useState<PlannerState>({ type: 'loading' })

  const resolveState = useCallback(() => {
    const runtime      = getBrowserRuntime()
    const plan         = runtime.userEngine.getActivePlan()
    const strategy     = runtime.userEngine.getStrategyDecision()

    if (plan && plan.cluster === cluster) {
      if (plan.status === 'completed') {
        setState({ type: 'completed', plan })
      } else if (plan.goal_value === 0) {
        // Plan was auto-built but needs user goal
        setState({ type: 'needs_goal', strategy: strategy! })
      } else {
        setState({ type: 'active_plan', plan, strategy })
      }
    } else if (strategy && strategy.cluster === cluster) {
      // Strategy decided but no plan yet → needs goal input
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

  const handleGoalSet = useCallback((goalValue: number) => {
    const runtime  = getBrowserRuntime()
    const strategy = runtime.userEngine.getStrategyDecision()
    if (!strategy) return

    const { PlannerEngine } = require('@/lib/planner')
    const engine = new PlannerEngine()

    const plan = engine.build({
      userId:        runtime.userEngine.getUserId() ?? 'anon',
      cluster:       strategy.cluster,
      assessmentId:  strategy.assessment_id,
      strategyId:    strategy.selected_strategy_id,
      strategyName:  strategy.selected_strategy_name,
      currentValue:  extractCurrentValue(runtime, cluster),
      goalValue,
      unit:          clusterUnit(cluster),
      startedAt:     new Date().toISOString(),
    })

    runtime.userEngine.setActivePlan(plan)
    resolveState()
  }, [cluster, resolveState])

  const handleCheckIn = useCallback((checkIn: {
    week: number
    actual_value: number
    subjective_score: number
    notes: string | null
  }) => {
    const runtime = getBrowserRuntime()
    const plan    = runtime.userEngine.getActivePlan()
    if (!plan) return

    const { PlannerEngine } = require('@/lib/planner')
    const engine = new PlannerEngine()
    const { plan: adapted } = engine.adapt(plan, checkIn)

    runtime.userEngine.setActivePlan(adapted)
    resolveState()

    // Emit event so DevStateInspector + PipelineEventLog update
    window.dispatchEvent(new CustomEvent('platform:intent_state_updated', {
      detail: { type: 'platform:intent_state_updated', changedFields: ['activePlan'] }
    }))
  }, [resolveState])

  // ── Render ────────────────────────────────────────────────────────────────

  if (state.type === 'loading') return <PlanSkeleton />

  if (state.type === 'no_plan') {
    return (
      <NoPlanState cluster={cluster} lang={lang} />
    )
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
  const label  = CLUSTER_LABELS[cluster] ?? cluster
  const href   = `/${lang}/${ASSESSMENT_HREF[cluster] ?? `assessment/${cluster}`}`

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

function extractCurrentValue(runtime: ReturnType<typeof getBrowserRuntime>, cluster: string): number {
  const user = runtime.userEngine.getUser()
  if (!user) return 0
  const slugs: Record<string, string[]> = {
    weight: ['bmi-calculator', 'body-fat-calculator'],
    sleep:  ['sleep-calculator'],
  }
  for (const slug of (slugs[cluster] ?? [])) {
    const r = [...user.result_history].reverse().find(r => r.instrument_slug === slug)
    if (r?.result_value !== null && r?.result_value !== undefined) return r.result_value as number
  }
  return 0
}

function clusterUnit(cluster: string): string {
  return { weight: 'kg', sleep: 'hours', finance: 'saved' }[cluster] ?? 'units'
}
