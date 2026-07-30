// Intelligence Layer — Public API
//
// Usage:
//   import { GraphGateway, buildAIContext } from '@/lib/intelligence'
//
//   const gateway = new GraphGateway(userGraph, legacyEngine)
//   const ctx     = gateway.recommendation(currentSlug)   // → RecommendationEngine
//   const ai      = gateway.aiContext(subscription)        // → CoachPromptBuilder
//   const journey = gateway.journey()                      // → JourneyEngine
//
// Nothing outside this module imports UserEngine for intelligence reads.

export { GraphGateway, mergeGraphs }          from './graph-gateway'
export { buildAIContext }                     from './ai-context-builder'
export type { AIContext, UserCapabilities, SubscriptionInfo } from './ai-context-builder'
export { buildRecommendationProjection }      from './graph-projections/recommendation'
export { buildJourneyProjection }             from './graph-projections/journey'
export type { JourneyProjection }             from './graph-projections/journey'
export { buildAnalyticsProjection }           from './graph-projections/analytics'
export type { AnalyticsProjection }           from './graph-projections/analytics'
