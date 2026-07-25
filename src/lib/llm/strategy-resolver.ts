// ─────────────────────────────────────────────────────────────────────────────
// StrategyResolver — selects a PromptStrategy based on user context.
//
// Sprint 10 PD recommendation: the rest of the system should not decide
// which strategy to use. This component centralises that logic.
//
// Resolution priority (highest first):
//   1. Explicit override (e.g. from user preferences or A/B test)
//   2. Dormancy level — disengaged users get Motivator
//   3. Subscription — Pro/Enterprise users get Consultant
//   4. Assessment confidence — established users get Explainer
//   5. Default fallback — DefaultCoach
// ─────────────────────────────────────────────────────────────────────────────

import type { LLMContext } from './types'
import type { PromptStrategy } from './prompt-strategy'
import {
  DefaultCoachStrategy,
  MotivatorStrategy,
  ConsultantStrategy,
  ExplainerStrategy,
} from './prompt-strategy'

export type StrategyOverride = 'default_coach' | 'motivator' | 'consultant' | 'explainer'

// Cached singletons — strategies are stateless.
const STRATEGIES: Record<StrategyOverride, PromptStrategy> = {
  default_coach: new DefaultCoachStrategy(),
  motivator:     new MotivatorStrategy(),
  consultant:    new ConsultantStrategy(),
  explainer:     new ExplainerStrategy(),
}

export class StrategyResolver {
  resolve(context: LLMContext, override?: StrategyOverride): PromptStrategy {
    if (override) return STRATEGIES[override]

    // Dormant users → encourage re-engagement first
    if (context.dormancyLevel === 'severe' || context.dormancyLevel === 'critical') {
      return STRATEGIES.motivator
    }

    // Paying users with an active goal → professional advisory tone
    if (
      (context.subscription === 'pro' || context.subscription === 'enterprise') &&
      context.primaryGoal != null
    ) {
      return STRATEGIES.consultant
    }

    // Established assessment + active journey → explain reasoning
    if (
      context.assessmentConfidence === 'established' &&
      context.currentPhase != null
    ) {
      return STRATEGIES.explainer
    }

    return STRATEGIES.default_coach
  }
}
