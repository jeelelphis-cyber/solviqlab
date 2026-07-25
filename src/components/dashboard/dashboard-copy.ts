import type { IntentPhase, IntentState } from '@/lib/domain/intent-state'
import type { ActivePlan } from '@/lib/domain/active-plan'
import type { AssessmentResult } from '@/lib/assessment/types'

// ── Time-of-day greeting ───────────────────────────────────────────────────────

export function greeting(): string {
  const h = new Date().getHours()
  if (h >= 6  && h < 12) return 'Good morning.'
  if (h >= 12 && h < 17) return 'Good afternoon.'
  if (h >= 17 && h < 22) return 'Good evening.'
  return 'Good night.'
}

// ── Hero sub-statement — phase-aware ─────────────────────────────────────────

export function heroSubStatement(intent: IntentState): string {
  const { currentPhase, activePlan, completedInstruments } = intent
  const count = completedInstruments.length

  if (currentPhase === 'habit' && activePlan) {
    return `Goal achieved — ${activePlan.goal}. Ready for the next challenge.`
  }
  if (currentPhase === 'execution' && activePlan) {
    const lastCheckIn = activePlan.check_ins[activePlan.check_ins.length - 1]
    if (lastCheckIn?.on_track) return `You're on track. Week ${lastCheckIn.week} logged.`
    if (lastCheckIn) return `Week ${lastCheckIn.week} logged. Your plan is adapting.`
    return `Your plan is active. First check-in unlocks adaptive coaching.`
  }
  if (currentPhase === 'planning') {
    return `Your strategy is ready. Set your goal to start your personalized plan.`
  }
  if (currentPhase === 'assessment') {
    return `${count} data points collected. Your assessment is ready — 3 minutes.`
  }
  if (count === 1) return `First step done. ${3 - count} more to unlock your assessment.`
  if (count === 2) return `${count} metrics collected. One more to unlock your assessment.`
  return `${count} metrics in your profile. Your journey is taking shape.`
}

// ── Next action label — per UX Bible CTA formula ──────────────────────────────

export const PHASE_ACTION_LABEL: Record<IntentPhase, string> = {
  discovery:  'Continue My Journey',
  assessment: 'Start My Assessment',
  planning:   'Build My Plan',
  execution:  'Log My Check-In',
  habit:      'Start My Next Goal',
}

export const PHASE_ACTION_WHY: Record<IntentPhase, string> = {
  discovery:  'Your data is ready — personalization takes 3 minutes.',
  assessment: "Your data is ready. Don't let it sit unused.",
  planning:   'Your strategy is waiting. Setting your goal takes 1 minute.',
  execution:  'Week checkpoint reached. Log your progress to keep the plan adapting.',
  habit:      'Your journey is complete. The next challenge is ready.',
}

// ── Coach insight — derived from data, no LLM ─────────────────────────────────
// Per UX Bible Part VII — Trust Mechanics: always from user's own data

export interface CoachInsight {
  readonly title: string
  readonly body: string
  readonly type: 'success' | 'focus' | 'info'
}

export function buildCoachInsight(intent: IntentState): CoachInsight | null {
  const { currentPhase, latestAssessment, activePlan, completedInstruments } = intent
  const count = completedInstruments.length

  // Execution — check-in based insight
  if (currentPhase === 'execution' && activePlan && activePlan.check_ins.length > 0) {
    const last = activePlan.check_ins[activePlan.check_ins.length - 1]
    if (last.on_track) {
      return {
        title: 'You\'re ahead of schedule.',
        body: `Week ${last.week} results show you're progressing faster than your plan expected. Keep the pace.`,
        type: 'success',
      }
    }
    return {
      title: 'Small adjustment recommended.',
      body: `Your last check-in shows a ${Math.round(Math.abs(last.deviation_percent))}% gap from your milestone. Your plan will adapt — stay consistent.`,
      type: 'focus',
    }
  }

  // Assessment insights — use top priority insight if available
  if (latestAssessment && latestAssessment.insights.length > 0) {
    const top = latestAssessment.insights[0]
    return {
      title: top.title,
      body: top.body,
      type: top.type === 'warning' ? 'focus' : 'info',
    }
  }

  // Assessment score
  if (latestAssessment) {
    const score = latestAssessment.overall_score
    const dimLowest = [...latestAssessment.dimension_scores].sort((a, b) => a.score - b.score)[0]
    if (dimLowest) {
      return {
        title: `${score}/100 — biggest opportunity: ${dimLowest.label}`,
        body: `Your assessment reveals the highest-impact area to address first. Your plan will prioritize this.`,
        type: score >= 60 ? 'success' : 'focus',
      }
    }
    return {
      title: `Assessment score: ${score}/100`,
      body: `Your profile is complete. Your strategy is built around this specific score.`,
      type: score >= 60 ? 'success' : 'focus',
    }
  }

  // Discovery — sunk cost + next unlock
  if (count >= 2) {
    return {
      title: `${count} steps completed — you've already done the hard part.`,
      body: `One more data point unlocks your personalized assessment — built entirely around your specific metrics.`,
      type: 'info',
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
