import type { CoachMessage } from './types'

// CoachAnalytics: single place for all Coach GA4 events.
// UI never calls window.gtag directly.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export class CoachAnalytics {
  trackShown(message: CoachMessage): void {
    try {
      window.gtag?.('event', 'coach_message_shown', {
        message_id:    message.message_id,
        trigger:       message.decision.trigger,
        reason:        message.decision.reason,
        priority:      message.priority,
        coach_version: message.data_snapshot,
      })
    } catch { /* analytics non-critical */ }
  }

  trackCTA(message: CoachMessage, actionId: string): void {
    try {
      window.gtag?.('event', 'coach_cta_click', {
        message_id:  message.message_id,
        action_id:   actionId,
        trigger:     message.decision.trigger,
        reason:      message.decision.reason,
        coach_version: message.data_snapshot,
      })
    } catch { /* analytics non-critical */ }
  }
}

export const coachAnalytics = new CoachAnalytics()
