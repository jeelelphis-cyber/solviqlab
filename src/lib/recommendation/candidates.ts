// ─────────────────────────────────────────────────────────────────────────────
// Candidate Generation
//
// Generates all possible recommendation candidates for a given context.
// The engine scores and ranks them — this module only generates.
//
// Candidate sources (in priority consideration order):
//   1. Journey next step (highest signal)
//   2. AI consultation unlock
//   3. Registration / save progress
//   4. Journey cross-suggestion (start a new category)
//   5. Weekly check-in (revisit completed)
//   6. Return tomorrow (cooldown)
// ─────────────────────────────────────────────────────────────────────────────

import type { Candidate, RecommendationContext } from './types'
import { JOURNEY_DEFINITIONS, getNextStep, getJourneyForSlug } from '../journey/config'
import { getStepReward } from '../journey/rewards'
import {
  needScore,
  confidenceScore,
  journeyImportanceScore,
  completionProbabilityScore,
} from './scoring'

function now(): string { return new Date().toISOString() }

function minutesSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 60_000
}

// ── Main Generator ────────────────────────────────────────────────────────────

export function generateCandidates(ctx: RecommendationContext): Candidate[] {
  const candidates: Candidate[] = []

  const primaryJourney = ctx.journey_states
    .slice()
    .sort((a, b) => new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime())[0] ?? null

  const hasMomentum = ctx.last_active_at
    ? minutesSince(ctx.last_active_at) < 30
    : false

  // ── 1. Registration / Save Progress ─────────────────────────────────────────
  if (ctx.user_type === 'anonymous' && ctx.registration_trigger_score >= 35) {
    const urgency = ctx.registration_trigger_score
    const need    = needScore({
      isNextInPrimaryJourney: false,
      isOneStepFromReward:    false,
      isAIUnlockable:         false,
      isRegistrationUrgent:   urgency >= 70,
      isInSecondaryJourney:   false,
      isCrossJourney:         false,
    })
    const conf  = confidenceScore({ source: 'journey_config', journeyStepsCompleted: ctx.result_count })
    const ji    = journeyImportanceScore({ isOnPrimaryJourney: false, isOnSecondaryJourney: false, completionPercent: 0, stepsUntilUnlock: 99 })
    const cp    = completionProbabilityScore({ estimatedMinutes: 1, userHasMomentum: hasMomentum, isRegistrationRequired: true, typeIsCalculator: false })

    candidates.push({
      type:                    'registration',
      instrument_slug:         null,
      instrument_name:         null,
      title:                   'Save Your Progress',
      reason:                  `You've completed ${ctx.result_count} instruments — don't lose your history.`,
      detail:                  'Create a free account to keep your results, track your journey, and unlock personalized recommendations.',
      estimated_minutes:       1,
      cta_label:               'Create Free Account',
      cta_href:                '/register',
      need:                    need.score,
      confidence:              conf.score,
      journey_importance:      ji.score,
      completion_probability:  cp.score,
      factors:                 [...need.factors, ...conf.factors, ...cp.factors],
    })
  }

  // ── 2. AI Consultation (if unlockable) ──────────────────────────────────────
  const aiReady = primaryJourney?.ai_readiness ?? 0
  if (aiReady >= 80) {
    const need = needScore({
      isNextInPrimaryJourney: false,
      isOneStepFromReward:    false,
      isAIUnlockable:         true,
      isRegistrationUrgent:   false,
      isInSecondaryJourney:   false,
      isCrossJourney:         false,
    })
    const conf = confidenceScore({ source: 'journey_config', journeyStepsCompleted: ctx.result_count })
    const ji   = journeyImportanceScore({ isOnPrimaryJourney: !!primaryJourney, isOnSecondaryJourney: false, completionPercent: primaryJourney?.progress_percent ?? 0, stepsUntilUnlock: 0 })
    const cp   = completionProbabilityScore({ estimatedMinutes: 3, userHasMomentum: hasMomentum, isRegistrationRequired: ctx.user_type === 'anonymous', typeIsCalculator: false })

    candidates.push({
      type:                    'ai_consultation',
      instrument_slug:         null,
      instrument_name:         null,
      title:                   'Your AI Consultation is Ready',
      reason:                  `Your AI Readiness is ${aiReady}% — you've built enough context for a personalized analysis.`,
      detail:                  'Get a personalized health analysis based on your complete journey, with specific recommendations tailored to your results.',
      estimated_minutes:       3,
      cta_label:               'Start AI Consultation',
      cta_href:                '/ai-coach',
      need:                    need.score,
      confidence:              conf.score,
      journey_importance:      ji.score,
      completion_probability:  cp.score,
      factors:                 [...need.factors, ...conf.factors],
    })
  }

  // ── 3. Next Step in Active Journey ───────────────────────────────────────────
  const nextStep = getNextStep(ctx.current_slug)
  if (nextStep && !ctx.completed_slugs.includes(nextStep.nextSlug)) {
    const currentJourney = getJourneyForSlug(ctx.current_slug)
    const journeyState   = currentJourney
      ? ctx.journey_states.find(j => j.journey_id === currentJourney.id)
      : null

    const stepsCompleted  = journeyState?.completed_count ?? 0
    const stepsLeft       = (journeyState?.total_steps ?? 6) - stepsCompleted
    const isOneFromReward = journeyState
      ? (journeyState.total_steps - journeyState.completed_count) <=
        (currentJourney!.unlockAtStep - journeyState.completed_count + 1)
      : false

    const reward = getStepReward(ctx.current_slug)

    const need = needScore({
      isNextInPrimaryJourney: true,
      isOneStepFromReward:    isOneFromReward,
      isAIUnlockable:         false,
      isRegistrationUrgent:   false,
      isInSecondaryJourney:   false,
      isCrossJourney:         false,
    })
    const conf = confidenceScore({ source: 'journey_config', journeyStepsCompleted: stepsCompleted })
    const ji   = journeyImportanceScore({
      isOnPrimaryJourney:    true,
      isOnSecondaryJourney:  false,
      completionPercent:     journeyState?.progress_percent ?? 0,
      stepsUntilUnlock:      stepsLeft,
    })
    const cp = completionProbabilityScore({
      estimatedMinutes:       nextStep.estimatedMinutes,
      userHasMomentum:        hasMomentum,
      isRegistrationRequired: false,
      typeIsCalculator:       true,
    })

    // Build explainable reason
    let reason = nextStep.reason
    if (reward) {
      reason += ` This step adds ${reward.aiReadinessContribution}% to your AI Readiness.`
    }
    if (isOneFromReward && currentJourney) {
      reason += ` One more step unlocks your ${currentJourney.unlockReward}.`
    }

    candidates.push({
      type:                    'next_calculator',
      instrument_slug:         nextStep.nextSlug,
      instrument_name:         nextStep.nextName,
      title:                   nextStep.nextName,
      reason,
      detail:                  nextStep.benefits.join(' · '),
      estimated_minutes:       nextStep.estimatedMinutes,
      cta_label:               'Continue Your Journey',
      cta_href:                `/calculators/${nextStep.nextSlug}`,
      need:                    need.score,
      confidence:              conf.score,
      journey_importance:      ji.score,
      completion_probability:  cp.score,
      factors:                 [...need.factors, ...conf.factors, ...ji.factors, ...cp.factors],
    })
  }

  // ── 4. Cross-Journey Suggestion ──────────────────────────────────────────────
  const currentCategory = getJourneyForSlug(ctx.current_slug)?.category ?? null
  const alternateJourneys = JOURNEY_DEFINITIONS.filter(j => {
    if (j.category === currentCategory) return false
    const state = ctx.journey_states.find(s => s.journey_id === j.id)
    if (state?.is_complete) return false
    // Suggest if user hasn't started this journey category at all
    return !state
  })

  if (alternateJourneys.length > 0) {
    const target = alternateJourneys[0]!
    const firstStep = target.steps[0]!
    const firstNextStep = getNextStep(firstStep.slug)

    const need = needScore({ isNextInPrimaryJourney: false, isOneStepFromReward: false, isAIUnlockable: false, isRegistrationUrgent: false, isInSecondaryJourney: false, isCrossJourney: true })
    const conf = confidenceScore({ source: 'category_default', journeyStepsCompleted: 0 })
    const ji   = journeyImportanceScore({ isOnPrimaryJourney: false, isOnSecondaryJourney: false, completionPercent: 0, stepsUntilUnlock: target.steps.length })
    const cp   = completionProbabilityScore({ estimatedMinutes: firstNextStep?.estimatedMinutes ?? 2, userHasMomentum: hasMomentum, isRegistrationRequired: false, typeIsCalculator: true })

    candidates.push({
      type:                    'cross_journey',
      instrument_slug:         firstStep.slug,
      instrument_name:         target.name,
      title:                   `Explore ${target.name}`,
      reason:                  `You haven't started your ${target.name} yet. It takes only ${firstNextStep?.estimatedMinutes ?? 2} minutes to begin.`,
      detail:                  `${target.steps.length} steps · unlocks ${target.unlockReward}`,
      estimated_minutes:       firstNextStep?.estimatedMinutes ?? 2,
      cta_label:               `Start ${target.name}`,
      cta_href:                `/calculators/${firstStep.slug}`,
      need:                    need.score,
      confidence:              conf.score,
      journey_importance:      ji.score,
      completion_probability:  cp.score,
      factors:                 [...need.factors, ...conf.factors],
    })
  }

  // ── 5. Return Tomorrow (cooldown) ────────────────────────────────────────────
  if (ctx.result_count >= 4 && hasMomentum) {
    const need = needScore({ isNextInPrimaryJourney: false, isOneStepFromReward: false, isAIUnlockable: false, isRegistrationUrgent: false, isInSecondaryJourney: false, isCrossJourney: false })
    const conf = confidenceScore({ source: 'user_pattern', journeyStepsCompleted: ctx.result_count })
    const ji   = journeyImportanceScore({ isOnPrimaryJourney: false, isOnSecondaryJourney: false, completionPercent: 0, stepsUntilUnlock: 99 })
    const cp   = completionProbabilityScore({ estimatedMinutes: 0, userHasMomentum: false, isRegistrationRequired: false, typeIsCalculator: false })

    candidates.push({
      type:                    'return_tomorrow',
      instrument_slug:         null,
      instrument_name:         null,
      title:                   "You've done a lot today",
      reason:                  `You've completed ${ctx.result_count} instruments in this session. Returning tomorrow keeps your results accurate and avoids decision fatigue.`,
      detail:                  'Save your progress and return tomorrow for your next recommendation.',
      estimated_minutes:       0,
      cta_label:               'Save & Return Tomorrow',
      cta_href:                null,
      need:                    need.score,
      confidence:              conf.score,
      journey_importance:      ji.score,
      completion_probability:  cp.score,
      factors:                 ['session momentum detected', 'cognitive load consideration'],
    })
  }

  return candidates
}
