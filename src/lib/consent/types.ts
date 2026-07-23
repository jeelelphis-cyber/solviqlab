export interface ConsentState {
  /** Schema version — increment when the shape changes. */
  v: 1
  /** Unix timestamp (ms) when consent was recorded. */
  ts: number
  /** Always true — cannot be declined. */
  necessary: true
  /** Google Analytics 4 + Microsoft Clarity. */
  analytics: boolean
  /** Reserved for Meta Pixel, LinkedIn Insight, etc. */
  marketing: boolean
}

/** Consent categories shown in the UI. */
export type ConsentCategory = 'necessary' | 'analytics' | 'marketing'
