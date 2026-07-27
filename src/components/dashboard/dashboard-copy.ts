import type { IntentPhase, IntentState } from '@/lib/domain/intent-state'
import type { ActivePlan } from '@/lib/domain/active-plan'
import { getT } from '@/lib/i18n/ui'

// ── Time-of-day greeting ───────────────────────────────────────────────────────

export function greeting(lang: string): string {
  const t = getT(lang)
  const h = new Date().getHours()
  if (h >= 6  && h < 12) return t('dashboard.greeting.morning')
  if (h >= 12 && h < 17) return t('dashboard.greeting.afternoon')
  if (h >= 17 && h < 22) return t('dashboard.greeting.evening')
  return t('dashboard.greeting.night')
}

// ── Hero sub-statement — phase-aware ─────────────────────────────────────────

export function heroSubStatement(intent: IntentState, lang: string): string {
  const t = getT(lang)
  const { currentPhase, activePlan, completedInstruments } = intent
  const count = completedInstruments.length

  if (currentPhase === 'habit' && activePlan) {
    return t('dashboard.hero.habit', { goal: activePlan.goal })
  }
  if (currentPhase === 'execution' && activePlan) {
    const lastCheckIn = activePlan.check_ins[activePlan.check_ins.length - 1]
    if (lastCheckIn?.on_track) return t('dashboard.hero.execution.ontrack', { week: String(lastCheckIn.week) })
    if (lastCheckIn) return t('dashboard.hero.execution.adapting', { week: String(lastCheckIn.week) })
    return t('dashboard.hero.execution.start')
  }
  if (currentPhase === 'planning') {
    return t('dashboard.hero.planning')
  }
  if (currentPhase === 'assessment') {
    return t('dashboard.hero.assessment', { count: String(count) })
  }
  if (count === 1) return t('dashboard.hero.discovery1', { remaining: String(3 - count) })
  if (count === 2) return t('dashboard.hero.discovery2', { count: String(count) })
  return t('dashboard.hero.discovery3', { count: String(count) })
}

// ── Next action label / why — per UX Bible CTA formula ───────────────────────

export function getPhaseActionLabel(phase: IntentPhase, lang: string): string {
  return getT(lang)(`dashboard.action.${phase}`)
}

export function getPhaseActionWhy(phase: IntentPhase, lang: string): string {
  return getT(lang)(`dashboard.why.${phase}`)
}

// ── Coach insight — derived from data, no LLM ─────────────────────────────────

export interface CoachInsight {
  readonly title: string
  readonly body: string
  readonly type: 'success' | 'focus' | 'info'
}

export function buildCoachInsight(intent: IntentState, lang: string = 'en'): CoachInsight | null {
  const t = getT(lang)
  const { currentPhase, latestAssessment, activePlan, completedInstruments } = intent
  const count = completedInstruments.length

  if (currentPhase === 'execution' && activePlan && activePlan.check_ins.length > 0) {
    const last = activePlan.check_ins[activePlan.check_ins.length - 1]
    if (last.on_track) {
      return {
        title: t('dashboard.insight.ahead_title'),
        body:  t('dashboard.insight.ahead_body', { week: String(last.week) }),
        type:  'success',
      }
    }
    return {
      title: t('dashboard.insight.adjust_title'),
      body:  t('dashboard.insight.adjust_body', { pct: String(Math.round(Math.abs(last.deviation_percent))) }),
      type:  'focus',
    }
  }

  if (latestAssessment && latestAssessment.insights.length > 0) {
    const top = latestAssessment.insights[0]
    return {
      title: top.title,
      body:  top.body,
      type:  top.type === 'warning' ? 'focus' : 'info',
    }
  }

  if (latestAssessment) {
    const score = latestAssessment.overall_score
    const dimLowest = [...latestAssessment.dimension_scores].sort((a, b) => a.score - b.score)[0]
    if (dimLowest) {
      return {
        title: t('dashboard.insight.score_title', { score: String(score), dim: dimLowest.label }),
        body:  t('dashboard.insight.score_body'),
        type:  score >= 60 ? 'success' : 'focus',
      }
    }
    return {
      title: t('dashboard.insight.score_simple_title', { score: String(score) }),
      body:  t('dashboard.insight.score_simple_body'),
      type:  score >= 60 ? 'success' : 'focus',
    }
  }

  if (count >= 2) {
    return {
      title: t('dashboard.insight.steps_title', { count: String(count) }),
      body:  t('dashboard.insight.steps_body'),
      type:  'info',
    }
  }

  return null
}

// ── Active plan summary ────────────────────────────────────────────────────────

export function planProgressPct(plan: ActivePlan): number {
  const lastCheckIn = plan.check_ins[plan.check_ins.length - 1]
  if (!lastCheckIn) return 0
  const total = Math.abs(plan.goal_value - plan.current_value)
  if (total === 0) return 0
  const actual = Math.abs(lastCheckIn.actual_value - plan.current_value)
  return Math.min(Math.round((actual / total) * 100), 100)
}

export function planCheckInDue(plan: ActivePlan): boolean {
  if (plan.check_ins.length === 0) return true
  const last = plan.check_ins[plan.check_ins.length - 1]
  const daysSince = (Date.now() - new Date(last.recorded_at).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince >= 6
}
