import type { LLMContext } from './types'
import type { ContextSource } from './context-source'

const CONTEXT_DEFAULTS: LLMContext = {
  userId:               '',
  userType:             'anonymous',
  subscription:         'free',
  activeCluster:        null,
  assessmentScore:      null,
  assessmentConfidence: null,
  currentPhase:         null,
  primaryGoal:          null,
  daysSinceActive:      0,
  dormancyLevel:        'none',
  recentCoachMessages:  [],
  journeyProgress:      null,
  graphSummary:         null,
}

export interface ContextBuilder {
  build(clusterId?: string): LLMContext
}

export class CompositeContextBuilder implements ContextBuilder {
  constructor(private readonly sources: readonly ContextSource[]) {}

  build(clusterId?: string): LLMContext {
    let ctx: LLMContext = { ...CONTEXT_DEFAULTS }
    for (const source of this.sources) {
      ctx = { ...ctx, ...source.contribute(clusterId) }
    }
    return ctx
  }
}
