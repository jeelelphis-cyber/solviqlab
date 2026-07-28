// ─────────────────────────────────────────────────────────────────────────────
// Market Intelligence Department — Core Types
//
// ProductResearchPackage is the PRIMARY ARTIFACT of this department.
// Every downstream department (Strategy, Design, Engineering, SEO) consumes it.
// This file is the inter-department CONTRACT — never break it without versioning.
//
// Pipeline:
//   ResearchQuery → DataSource[] → ProductResearchPackage → PriorityScore
//                                                          → Department 02 (Strategy)
// ─────────────────────────────────────────────────────────────────────────────

// ── Query ─────────────────────────────────────────────────────────────────────

export interface ResearchQuery {
  /** Human-language problem statement, e.g. "can't sleep" */
  problem: string
  cluster?: string
  lang?: string
  country?: string
}

// ── Problem Signal ────────────────────────────────────────────────────────────

export type TrendDirection = 'rising' | 'stable' | 'declining' | 'unknown'

export interface ProblemSignal {
  /** Distilled core problem, e.g. "sleep deprivation" */
  coreProblem: string
  /** Exact phrases real users type, e.g. ["I wake up tired", "why can't I sleep"] */
  userFormulations: string[]
  cluster: string
  searchVolume: number | null
  trend: TrendDirection
  /** Communities / subreddits / forums where this is discussed */
  communityMentions: string[]
}

// ── Intent ────────────────────────────────────────────────────────────────────

export type IntentType = 'calculator' | 'quiz' | 'planner' | 'guide' | 'assessment' | 'ai_coach'

export interface ProductIntent {
  primary: IntentType
  secondary: IntentType[]
  /** 0–1 confidence in primary intent classification */
  confidence: number
  rationale: string
}

// ── Keywords ──────────────────────────────────────────────────────────────────

export type KeywordSource = 'dataforseo' | 'autocomplete' | 'paa' | 'trends' | 'manual'
export type KeywordIntent = 'informational' | 'transactional' | 'navigational' | 'commercial'

export interface KeywordEntry {
  keyword: string
  volume: number | null
  difficulty: number | null  // 0–100; higher = harder
  cpc: number | null         // USD
  intent: KeywordIntent
  source: KeywordSource
  hasSnippet: boolean
}

export interface KeywordCluster {
  seed: string
  primary: KeywordEntry[]
  longtail: KeywordEntry[]
  /** People Also Ask */
  questions: string[]
  /** Related searches */
  related: string[]
}

// ── Competitors ───────────────────────────────────────────────────────────────

export interface CompetitorInsight {
  url: string
  domain: string
  title: string
  position: number | null    // SERP position
  da: number | null          // Domain Authority 0–100
  strengths: string[]
  weaknesses: string[]
  /** Where we can beat them — fed into Product Blueprint */
  gaps: string[]
}

export interface SERPAnalysis {
  topCompetitors: CompetitorInsight[]
  featuredSnippetExists: boolean
  featuredSnippetWinnableBy: IntentType | null
  adCount: number
  organicCount: number
}

// ── Potentials ────────────────────────────────────────────────────────────────

export interface SEOPotential {
  totalVolume: number
  avgDifficulty: number
  featuredSnippetOpportunity: boolean
  /** ISO language codes where volume exists, e.g. ["es", "pt", "de"] */
  multilingualPotential: string[]
  estimatedMonthlyClicks: number | null
  /** 0–100 composite SEO score */
  score: number
}

export interface AICoachPotential {
  /** Can Mia give genuinely personalised advice for this problem? */
  personalizable: boolean
  /** Would the user naturally return for a follow-up after getting results? */
  returnable: boolean
  /** Does this problem fit a 30-day improvement journey? */
  journeyFit: boolean
  /** Can the AI experience lead to Premium conversion? */
  upsellPotential: boolean
  /** 0–100 composite AI score */
  score: number
}

// ── Recommendation ────────────────────────────────────────────────────────────

export interface ProductRecommendation {
  /** URL-safe slug, e.g. "sleep-debt-calculator" */
  slug: string
  /** Human name, e.g. "Sleep Debt Calculator" */
  name: string
  type: IntentType
  cluster: string
  rationale: string
  /** V1 MVP scope — what to include in first build */
  mvpScope: string[]
  /** How many steps in the 30-day AI journey */
  aiJourneySteps: number
  /** Companion products that strengthen the cluster */
  relatedProducts: string[]
}

// ── Priority Score ────────────────────────────────────────────────────────────

export type PriorityVerdict = 'build_now' | 'build_soon' | 'watch' | 'skip'

export interface PriorityBreakdown {
  /** Search volume + trend (weight: 25%) */
  demand: number
  /** Difficulty vs opportunity (weight: 20%) */
  seo: number
  /** Mia personalisation + return potential (weight: 20%) */
  aiCoach: number
  /** Competitor gaps — our advantage (weight: 15%) */
  competition: number
  /** CPC + affiliate + premium potential (weight: 10%) */
  revenue: number
  /** Cluster fit, journey fit, platform strategy (weight: 10%) */
  strategic: number
}

export interface PriorityScore {
  /** 0–100 weighted composite */
  total: number
  breakdown: PriorityBreakdown
  verdict: PriorityVerdict
  /** Human-readable justification for the verdict */
  verdictReason: string
}

// ── The Main Artifact ─────────────────────────────────────────────────────────
//
// This is what Market Intelligence produces and all downstream departments consume.
// Treat this like a typed API response — every field must be present.

export interface ProductResearchPackage {
  /** Unique package id, e.g. "pkg_sleep-debt_2026-07-24" */
  id: string
  createdAt: string
  /** Version of this schema — bump when breaking changes are introduced */
  schemaVersion: 1
  query: ResearchQuery
  problem: ProblemSignal
  intent: ProductIntent
  keywords: KeywordCluster
  serp: SERPAnalysis
  seo: SEOPotential
  aiCoach: AICoachPotential
  recommendation: ProductRecommendation
  priority: PriorityScore
  /** Analyst / AI notes that don't fit structured fields */
  notes: string[]
  /** Which data sources contributed to this package */
  sources: string[]
}
