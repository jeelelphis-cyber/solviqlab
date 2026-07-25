// ─────────────────────────────────────────────────────────────────────────────
// ContextSource — pluggable partial-context contributors for ContextBuilder.
//
// Sprint 9 PD recommendation: ContextBuilder should not depend directly on
// UserEngine, CoachHistoryRepository, DormancyDetector. Instead, each concern
// contributes a partial LLMContext slice through a common interface.
// ─────────────────────────────────────────────────────────────────────────────

import type { LLMContext } from './types'

export type PartialContext = Partial<LLMContext>

export interface ContextSource {
  readonly key: string
  contribute(clusterId?: string): PartialContext
}

// ── Implementations ──────────────────────────────────────────────────────────

import type { UserEngine } from '../user/engine'
import type { CoachHistoryRepository } from '../coach/history'
import type { DormancyDetector } from '../retention/detector'
import type { IntentCluster } from '../assessment/types'

export class IdentityContextSource implements ContextSource {
  readonly key = 'identity'
  constructor(private readonly userEngine: UserEngine) {}

  contribute(): PartialContext {
    const user = this.userEngine.getUser()
    return {
      userId:       user?.id ?? '',
      userType:     user?.type ?? 'anonymous',
      subscription: (user as any)?.subscription_tier ?? 'free',
    }
  }
}

export class JourneyContextSource implements ContextSource {
  readonly key = 'journey'
  constructor(private readonly userEngine: UserEngine) {}

  contribute(clusterId?: string): PartialContext {
    const intent = clusterId
      ? this.userEngine.getIntentState(clusterId as IntentCluster)
      : null

    const assessment = intent?.latestAssessment ?? null
    const plan       = intent?.activePlan ?? null
    const strategy   = intent?.latestStrategy ?? null

    return {
      activeCluster:        clusterId ?? null,
      assessmentScore:      assessment?.overall_score ?? null,
      assessmentConfidence: assessment?.confidence ?? null,
      currentPhase:         intent?.currentPhase ?? null,
      primaryGoal:          intent?.primaryGoal ?? plan?.goal ?? strategy?.selected_strategy_name ?? null,
      journeyProgress:      plan ? Math.round((plan.check_ins.length / plan.duration_weeks) * 100) : null,
    }
  }
}

export class RetentionContextSource implements ContextSource {
  readonly key = 'retention'
  constructor(
    private readonly userEngine: UserEngine,
    private readonly dormancyDetector: DormancyDetector,
  ) {}

  contribute(): PartialContext {
    const user            = this.userEngine.getUser()
    const daysSinceActive = user ? this.dormancyDetector.getDaysSinceLastActive(user) : 0
    const dormancyLevel   = this.dormancyDetector.getDormancyLevel(daysSinceActive)
    return { daysSinceActive, dormancyLevel }
  }
}

export class CoachContextSource implements ContextSource {
  readonly key = 'coach'
  constructor(private readonly coachHistory: CoachHistoryRepository) {}

  contribute(): PartialContext {
    const recentCoachMessages = this.coachHistory
      .getRecent(5)
      .map(e => `[${e.trigger}] ${e.title}`)
    return { recentCoachMessages }
  }
}
