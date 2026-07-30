// UserGraph → RecommendationContext projection

import type { UserGraph } from '../../graph/types'
import type { RecommendationContext } from '../../recommendation/types'
import { checkRegistrationTrigger } from '../../user/registration-trigger'
import type { AnonymousUser } from '../../user/types'

export function buildRecommendationProjection(
  graph: UserGraph,
  currentSlug: string,
  completedSlugs: readonly string[],
): RecommendationContext {
  const isAuthenticated = graph.identity.userType === 'authenticated'

  // Map graph assessments → journey states for the recommendation engine
  const journeyStates = graph.assessments.items.map(a => ({
    journey_id:       a.clusterId,
    completed_count:  completedSlugs.filter(s => s.includes(a.clusterId)).length,
    total_steps:      6, // default; real config comes from journey/config.ts
    progress_percent: Math.round((completedSlugs.filter(s => s.includes(a.clusterId)).length / 6) * 100),
    ai_readiness:     a.score,
    unlocked_rewards: [] as string[],
    last_active_at:   a.assessedAt,
  }))

  // Include journey node if active cluster not already in assessments
  if (graph.journey.activeCluster) {
    const alreadyMapped = journeyStates.some(j => j.journey_id === graph.journey.activeCluster)
    if (!alreadyMapped) {
      journeyStates.push({
        journey_id:       graph.journey.activeCluster,
        completed_count:  graph.journey.completedSteps.length,
        total_steps:      6,
        progress_percent: graph.journey.progress ?? 0,
        ai_readiness:     0,
        unlocked_rewards: [],
        last_active_at:   graph.journey.updatedAt,
      })
    }
  }

  const tier = graph.premium.tier as 'free' | 'pro' | 'enterprise'

  return {
    user_id:                    graph.userId,
    user_type:                  isAuthenticated ? 'authenticated' : 'anonymous',
    subscription_tier:          isAuthenticated ? tier : null,
    current_slug:               currentSlug,
    completed_slugs:            completedSlugs,
    journey_states:             journeyStates,
    result_count:               completedSlugs.length,
    last_active_at:             graph.updatedAt,
    registration_trigger_score: isAuthenticated ? 0 : 60,
    current_timestamp:          new Date().toISOString(),
  }
}
