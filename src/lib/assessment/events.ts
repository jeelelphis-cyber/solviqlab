// ── Assessment Analytics Events ───────────────────────────────────────────────

import type { IntentCluster, AssessmentConfidence } from './types'

type AssessmentEvent =
  | { type: 'AssessmentStarted';   cluster: IntentCluster; confidence: AssessmentConfidence }
  | { type: 'AssessmentCompleted'; cluster: IntentCluster; score: number; confidence: AssessmentConfidence }
  | { type: 'AssessmentGateFailed'; cluster: IntentCluster; missing_domains: readonly string[] }
  | { type: 'InsightViewed';       cluster: IntentCluster; insight_id: string; insight_type: string }

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function emitAssessmentEvent(event: AssessmentEvent): void {
  if (typeof window === 'undefined') return

  const { type, ...rest } = event
  window.gtag?.('event', `assessment_${type.toLowerCase()}`, rest)
}
