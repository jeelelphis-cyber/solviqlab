import type { IntentCluster } from '../assessment/types'
import type { CoachTrigger, CoachMessage, CoachMemory } from './types'
import type { CoachHistoryRepository } from './history'
import { coachEngine }    from './engine'
import { textRenderer }   from './renderer'
import { coachAnalytics } from './analytics'
import { buildHistoryEntry } from './history'
import { COACH_VERSION }  from './types'

// Runtime shape — only the methods CoachService actually needs
// Structural typing: PlatformRuntime satisfies this automatically
export interface CoachRuntime {
  userEngine: {
    getIntentState(cluster: IntentCluster): import('../domain/intent-state').IntentState | null
    getCoachMemory(cluster: IntentCluster): CoachMemory
    setCoachMemory(cluster: IntentCluster, memory: CoachMemory): void
  }
  coachHistory: CoachHistoryRepository
}

export class CoachService {
  /**
   * Pure read — no side effects, safe to call during render.
   * Returns null if canShow rules prevent a message.
   */
  getMessage(
    cluster: IntentCluster,
    trigger: CoachTrigger,
    lang:    string,
    runtime: CoachRuntime,
  ): CoachMessage | null {
    const intent = runtime.userEngine.getIntentState(cluster)
    if (!intent) return null

    const memory = runtime.userEngine.getCoachMemory(cluster)
    const rec    = coachEngine.recommend({ intent, trigger, lang }, memory)
    if (!rec) return null

    return textRenderer.render(rec, lang)
  }

  /**
   * Call after UI mounts (useEffect).
   * Writes CoachMemory + appends CoachHistory + fires analytics.
   * Never during render.
   */
  markShown(message: CoachMessage, cluster: IntentCluster, runtime: CoachRuntime, lang: string): void {
    // 1. Update anti-spam memory
    const memory = runtime.userEngine.getCoachMemory(cluster)
    runtime.userEngine.setCoachMemory(cluster, {
      ...memory,
      shown_message_ids: [...memory.shown_message_ids, message.message_id],
      last_shown_at:     { ...memory.last_shown_at, [message.type]: new Date().toISOString() },
    })

    // 2. Append to persistent history
    runtime.coachHistory.append(buildHistoryEntry(message, lang, COACH_VERSION))

    // 3. Fire analytics
    coachAnalytics.trackShown(message)
  }

  /**
   * Call when user taps a CTA action.
   * Updates history entry + fires analytics.
   */
  recordCTAClick(messageId: string, actionId: string, runtime: CoachRuntime, message: CoachMessage): void {
    runtime.coachHistory.markClicked(messageId, actionId)
    coachAnalytics.trackCTA(message, actionId)
  }

  /**
   * Call when user dismisses a message (close button / navigate away).
   * Updates history entry only — no analytics event (passive action).
   */
  recordDismissed(messageId: string, runtime: CoachRuntime): void {
    runtime.coachHistory.markDismissed(messageId)
  }
}

export const coachService = new CoachService()
