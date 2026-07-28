// ─────────────────────────────────────────────────────────────────────────────
// Competitive Intelligence — Types
// ─────────────────────────────────────────────────────────────────────────────

export type ContentType = 'calculator' | 'article' | 'tool' | 'guide' | 'quiz' | 'mixed' | 'ecommerce'
export type ThreatLevel = 'fortress' | 'high' | 'medium' | 'low'
export type LandscapeType = 'fragmented' | 'consolidated' | 'mixed'
export type CIDecision = 'enter_directly' | 'find_gap' | 'avoid'

export interface DomainMetrics {
  domain:               string
  organicKeywords:      number | null   // from DataForSEO domain_rank_overview
  estimatedDR:          number | null   // proxy: derived from organic KW count
  trafficEstimate:      number | null
}

export interface DeepCompetitorProfile {
  // ── Identity ────────────────────────────────────────────────────────────────
  domain:       string
  url:          string
  position:     number
  title:        string
  description:  string

  // ── Authority (DataForSEO proxy) ────────────────────────────────────────────
  estimatedDR:          number | null
  organicKeywords:      number | null

  // ── Content analysis (LLM) ──────────────────────────────────────────────────
  contentType:      ContentType
  productFeatures:  string[]    // what they actually offer
  userJourney:      string      // how user flows through their product
  monetization:     string      // how they make money here
  uniqueAngle:      string      // their clear differentiator

  // ── Weakness map ────────────────────────────────────────────────────────────
  weaknesses:   string[]
  gaps:         string[]        // what users need that they're not providing

  // ── Threat assessment ───────────────────────────────────────────────────────
  threatLevel:  ThreatLevel
  threatReason: string

  // ── Beat strategy ────────────────────────────────────────────────────────────
  howToBeat:    string          // specific way to outperform this competitor
}

export interface CompetitiveIntelligenceReport {
  topic:       string
  keyword:     string
  analysedAt:  string

  // ── Competitor profiles ──────────────────────────────────────────────────────
  competitors: DeepCompetitorProfile[]

  // ── Landscape summary ────────────────────────────────────────────────────────
  landscapeType:         LandscapeType
  dominantContentType:   ContentType
  avgEstimatedDR:        number
  fortressCount:         number           // DR > 60
  weakCompetitorCount:   number           // DR < 25
  featuredSnippetExists: boolean

  // ── What's winning ───────────────────────────────────────────────────────────
  winningFeatures:       string[]         // features present in 3+ top pages
  winningPattern:        string           // e.g. "long-form guide + embedded calculator"

  // ── Gaps ─────────────────────────────────────────────────────────────────────
  marketGaps:    string[]
  biggestGap:    string

  // ── Win strategy ─────────────────────────────────────────────────────────────
  winStrategy:   string
  timeToTop3: {
    optimistic:   number     // months
    realistic:    number
    pessimistic:  number
  }
  estimatedDRNeeded: number

  // ── CEO output ────────────────────────────────────────────────────────────────
  executiveSummary: string
  decision:         CIDecision
  decisionReason:   string
}
