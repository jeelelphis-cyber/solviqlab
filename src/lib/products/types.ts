// ─────────────────────────────────────────────────────────────────────────────
// Product Integration Layer — Types
//
// CEO Decision №006: any new product plugs into the full stack via registerProduct().
// No custom wiring. One call. Everything else is automatic.
//
// Stack: Instrument → GraphMapper → UserGraph → Session → Journey → Mia → Premium
// ─────────────────────────────────────────────────────────────────────────────

import type { GraphUpdater } from '../graph/updater'

// ── Calculator Result (solviqlab:result event detail) ─────────────────────────

export interface InstrumentResult {
  readonly slug:     string
  readonly name:     string
  readonly value:    number
  readonly label?:   string | null
  readonly unit?:    string | null
  readonly metadata: Record<string, unknown>
}

// ── Graph Mapper ──────────────────────────────────────────────────────────────
//
// Bridges calculator output → UserGraph.
// Implement one per product cluster. The engine calls map() automatically
// whenever solviqlab:result fires for a registered product.

export interface GraphMapper {
  readonly cluster: string
  map(result: InstrumentResult, userId: string, updater: GraphUpdater): void
}

// ── Journey Template ──────────────────────────────────────────────────────────
//
// Describes what happens across multiple days.
// Session Engine = today. Journey Engine = this week / this month.

export interface JourneyStep {
  readonly day:          number
  readonly label:        string
  readonly action:       'calculator' | 'assessment' | 'review' | 'new_goal' | 'progress_check'
  readonly productSlug?: string
  readonly description?: string
}

export interface JourneyTemplate {
  readonly id:    string
  readonly name:  string
  readonly steps: readonly JourneyStep[]
}

// ── Coach Assignment ──────────────────────────────────────────────────────────

export type CoachId = 'mia' | 'alex' | 'emma' | 'noah'

export interface CoachConfig {
  readonly id:        CoachId
  readonly avatarId?: string
  readonly voiceId?:  string
}

// ── Product Manifest ──────────────────────────────────────────────────────────
//
// Everything needed to connect a product to the SolviqLAB platform.
// Extends InstrumentManifest with AI stack wiring.

export interface ProductManifest {
  // Core identity
  readonly slug:     string
  readonly name:     string
  readonly cluster:  string   // 'weight' | 'sleep' | 'finance' | 'career' | ...
  readonly category: 'calculator' | 'quiz' | 'assessment' | 'planner' | 'converter'

  // UserGraph wiring — how this product feeds the user's memory
  readonly graphMapper?: GraphMapper

  // Coach — which AI coach handles this product (defaults to Mia)
  readonly coach?: CoachConfig

  // Journey — what happens over the next 30 days for this cluster
  readonly journey?: JourneyTemplate

  // Whether completing this product unlocks/triggers an Assessment
  readonly triggersAssessment?: boolean
  readonly assessmentCluster?:  string
}

// ── Registry Entry (enriched at registration time) ───────────────────────────

export interface RegisteredProduct extends ProductManifest {
  readonly registeredAt: string
}
