import type { IntentPhase, IntentState } from '@/lib/domain/intent-state'
import type { IntentCluster } from '@/lib/assessment/types'

// ── Phase identity ────────────────────────────────────────────────────────────

export const PHASE_ICON: Record<IntentPhase, string> = {
  discovery:  '🔍',
  assessment: '📋',
  planning:   '🎯',
  execution:  '🚀',
  habit:      '⭐',
}

export const PHASE_LABEL: Record<IntentPhase, string> = {
  discovery:  'Building Your Profile',
  assessment: 'Ready for Assessment',
  planning:   'Strategy Ready',
  execution:  'On Your Journey',
  habit:      'Goal Achieved',
}

// ── Hero statements — per UX Bible Part II (Emotional Arc) ───────────────────
// Hero: 20–24px, weight 700. Sub: 14px, weight 400.
// Wrong: "Your BMI is 29.8." Right: "Your profile is taking shape."

export const PHASE_HERO: Record<IntentPhase, string> = {
  discovery:  'Your profile is taking shape.',
  assessment: "You've built enough of a profile.",
  planning:   'Your strategy is ready.',
  execution:  'Your plan is active.',
  habit:      'You did it.',
}

export function buildHeroSub(intent: IntentState): string {
  const { currentPhase, completedInstruments, activePlan, latestAssessment } = intent
  const count = completedInstruments.length

  if (currentPhase === 'habit' && activePlan) {
    return `That took discipline. Ready to explore what's next?`
  }
  if (currentPhase === 'execution' && activePlan) {
    const weeks = activePlan.check_ins.length
    return weeks > 0
      ? `Week ${weeks + 1} of your plan. Another week of data — your plan is adapting to your results.`
      : `Your plan is live. First check-in unlocks adaptive coaching.`
  }
  if (currentPhase === 'planning') {
    return `Set your goal — and the plan becomes yours.`
  }
  if (currentPhase === 'assessment' && latestAssessment) {
    return `Assessment score: ${latestAssessment.overall_score}/100. Your personal strategy is ready.`
  }
  if (currentPhase === 'assessment') {
    return `3 minutes — and we'll know exactly where to start.`
  }
  // Discovery — data-specific
  if (count === 1) return `One data point saved — let's build the full picture.`
  if (count === 2) return `${count} metrics collected. One more to unlock your personal assessment.`
  return `${count} metrics collected. Assessment ready — takes 3 minutes.`
}

// ── CTA copy — formula: [Action verb] + [Personal benefit or identity claim] ──
// Per UX Bible Part IV. Never: "Continue", "Submit", "Next", "Go", "OK"

export const CTA_PRIMARY: Record<IntentPhase, string> = {
  discovery:  'Continue My Journey',
  assessment: 'Start My Assessment',
  planning:   'Build My Plan',
  execution:  'Log My Check-In',
  habit:      'Start My Next Goal',
}

// ── Why-now hook — 1 sentence before CTA, per UX Bible Part IV ───────────────
// Explains what happens when user clicks — not what they're clicking on.

export const WHY_NOW: Record<IntentPhase, string> = {
  discovery:  'Your data is ready — personalization takes 3 minutes.',
  assessment: "Your data is ready. Don't let it sit unused.",
  planning:   'Your strategy is waiting. Setting your goal takes 1 minute.',
  execution:  'Week checkpoint reached. Check in to keep your plan adapting.',
  habit:      'Your journey is complete. The next challenge is ready.',
}

// ── Why-this — data-specific reasoning, per UX Bible Part VII ─────────────────
// Formula: "Without [X], we can't build [Y] that accounts for [Z]."
// Must be specific to user's data — never generic marketing.

export function buildWhyThis(intent: IntentState): string {
  const {
    currentPhase, completedInstruments,
    latestAssessment, activePlan, recommendationDecision, clusterId,
  } = intent
  const count = completedInstruments.length

  // Use recommendation decision reasons if specific enough
  if (recommendationDecision?.reasons[0]) {
    return recommendationDecision.reasons[0]
  }

  if (currentPhase === 'assessment') {
    if (latestAssessment) {
      return `Your score (${latestAssessment.overall_score}/100) unlocks a strategy matched to your specific profile — not a generic plan.`
    }
    return `Without this assessment, we can't build a ${clusterId} plan that fits your actual lifestyle.`
  }
  if (currentPhase === 'planning' && latestAssessment) {
    return `Your assessment is complete. This step turns your data into a goal that adapts as you progress.`
  }
  if (currentPhase === 'execution' && activePlan) {
    const checkIns = activePlan.check_ins.length
    return checkIns === 0
      ? `First check-in unlocks adaptive coaching — your plan adjusts based on your actual results.`
      : `${checkIns} week${checkIns > 1 ? 's' : ''} of data collected. Each check-in makes your plan more accurate.`
  }
  if (currentPhase === 'habit') {
    return `You've achieved your goal. The next horizon extends what you've already built.`
  }

  // Discovery — build toward assessment
  if (count === 1) {
    return `This step adds a second data point. We need at least 3 to build your personal profile.`
  }
  if (count === 2) {
    return `One more step and your assessment unlocks — built entirely around your specific data.`
  }
  return `Each step builds a more accurate picture of your situation — and a more precise plan.`
}

// ── Unlock preview — what this step enables ───────────────────────────────────
// Per UX Bible Part III (Unlock Mechanic): preview the reward, not a feature list

export const PHASE_UNLOCK: Record<IntentPhase, string[]> = {
  discovery:  ['Assessment', 'Strategy', 'Personal Plan', 'AI Coach'],
  assessment: ['Strategy', 'Personal Plan', 'AI Coach'],
  planning:   ['Personal Plan', 'AI Coach'],
  execution:  ['Weekly Check-ins', 'AI Coach', 'New Goal'],
  habit:      ['New Goal'],
}

// ── Progress text — per UX Bible Part III (Progress Bias) ─────────────────────
// "You're 33% closer to your personal plan." converts distance into momentum.
// Wrong: "5 steps left". Right: "You're 33% closer."

export function progressText(step: number, total: number): string {
  const pct = Math.min(Math.round((step / total) * 100), 100)
  if (pct === 0) return 'Your journey starts here.'
  if (pct === 100) return 'Journey complete. You did the work.'
  return `You're ${pct}% closer to your personal plan.`
}

// ── Time estimates ────────────────────────────────────────────────────────────

export const TIME_ESTIMATE: Partial<Record<string, string>> = {
  'weight-assessment':        '3 min',
  'sleep-assessment':         '3 min',
  'finance-assessment':       '3 min',
  'bmi-calculator':           '1 min',
  'calorie-calculator':       '2 min',
  'body-fat-calculator':      '2 min',
  'ideal-weight-calculator':  '1 min',
  'macro-calculator':         '2 min',
  'protein-calculator':       '1 min',
  'tdee-calculator':          '2 min',
  'sleep-calculator':         '2 min',
  'savings-calculator':       '2 min',
}

// ── Cluster-aware assessment names ────────────────────────────────────────────

export const CLUSTER_ASSESSMENT_NAME: Record<IntentCluster, string> = {
  weight:         'Weight Assessment',
  sleep:          'Sleep Assessment',
  finance:        'Finance Assessment',
  pregnancy:      'Health Assessment',
  nutrition:      'Nutrition Assessment',
  fitness:        'Fitness Assessment',
  mental_health:  'Wellbeing Assessment',
  cardiovascular: 'Cardiovascular Assessment',
}
