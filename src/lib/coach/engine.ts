import type { CoachInput, CoachMemory, CoachRecommendation } from './types'
import { handleAssessmentCompleted } from './handlers/assessment'
import { handlePlanCreated }         from './handlers/plan'
import { handlePlanCheckIn }         from './handlers/check-in'

const CATEGORY_COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 hours

export class CoachEngine {
  /**
   * Decide what to say (recommendation only — no text generation).
   * Returns null if Anti-Spam rules or data conditions prevent a message.
   * Pure function: no side effects, no localStorage access.
   */
  recommend(input: CoachInput, memory: CoachMemory): CoachRecommendation | null {
    const rec = this.dispatch(input)
    if (!rec) return null
    if (!this.canShow(rec, memory)) return null
    return rec
  }

  private dispatch(input: CoachInput): CoachRecommendation | null {
    switch (input.trigger) {
      case 'assessment:completed':
        return handleAssessmentCompleted(input.intent)
      case 'plan:created':
        return handlePlanCreated(input.intent)
      case 'plan:check_in':
        return handlePlanCheckIn(input.intent)
      default:
        return null
    }
  }

  canShow(rec: CoachRecommendation, memory: CoachMemory): boolean {
    // Already shown this exact message
    if (memory.shown_message_ids.includes(rec.recommendation_id)) return false

    // 24h category cooldown (non-celebration types)
    if (rec.type !== 'celebration') {
      const lastShown = memory.last_shown_at[rec.type]
      if (lastShown) {
        const elapsed = Date.now() - new Date(lastShown).getTime()
        if (elapsed < CATEGORY_COOLDOWN_MS) return false
      }
    }

    return true
  }
}

export const coachEngine = new CoachEngine()
