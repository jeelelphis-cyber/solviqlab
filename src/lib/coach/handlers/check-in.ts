import type { IntentState } from '../../domain/intent-state'
import type { CoachRecommendation, CoachReason } from '../types'
import { COACH_VERSION } from '../types'

const DEVIATION_THRESHOLD = 10 // % — >10% is off-track
const MILESTONE_WINDOW_WEEKS = 1

export function handlePlanCheckIn(intent: IntentState): CoachRecommendation | null {
  const { activePlan: plan } = intent
  if (!plan || plan.check_ins.length === 0) return null

  const lastCheckIn = plan.check_ins[plan.check_ins.length - 1]!
  const currentWeek = lastCheckIn.week

  // Count consecutive on-track weeks
  const onTrackWeeks = countConsecutiveOnTrack(plan.check_ins)

  // Find the next incomplete milestone (if any)
  const nextMilestone = plan.milestones
    .filter(m => !m.is_completed)
    .sort((a, b) => a.week - b.week)[0] ?? null

  const weeksToMilestone = nextMilestone
    ? nextMilestone.week - currentWeek
    : null

  // Priority: milestone approaching > off-track > on-track
  const reason: CoachReason =
    weeksToMilestone !== null && weeksToMilestone <= MILESTONE_WINDOW_WEEKS && weeksToMilestone >= 0
      ? 'milestone_approaching'
    : !lastCheckIn.on_track || lastCheckIn.deviation_percent > DEVIATION_THRESHOLD
      ? 'off_track'
      : 'on_track'

  const priority =
    reason === 'off_track'             ? 'critical' as const
    : reason === 'milestone_approaching' ? 'high' as const
    :                                      'normal' as const

  return {
    recommendation_id: `plan:check_in:${intent.clusterId}:${plan.plan_id}:w${currentWeek}`,
    cluster:      intent.clusterId,
    phase:        intent.currentPhase,
    decision:     { trigger: 'plan:check_in', reason },
    type:         reason === 'off_track' ? 'warning' : reason === 'milestone_approaching' ? 'preparation' : 'insight',
    priority,
    template_id:  reason,
    data: {
      week:           currentWeek,
      deviation:      Math.round(lastCheckIn.deviation_percent),
      on_track_weeks: onTrackWeeks,
      milestone_week: nextMilestone?.week,
      check_in_count: plan.check_ins.length,
    },
    coach_version: COACH_VERSION,
    generated_at:  new Date().toISOString(),
  }
}

function countConsecutiveOnTrack(checkIns: readonly import('../../domain/active-plan').CheckIn[]): number {
  let count = 0
  for (let i = checkIns.length - 1; i >= 0; i--) {
    if (checkIns[i]!.on_track) count++
    else break
  }
  return count
}
