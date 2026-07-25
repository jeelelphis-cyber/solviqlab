// ─────────────────────────────────────────────────────────────────────────────
// UserGraph — Single Source of Truth for a user's persistent model.
//
// Every LLM call, recommendation, and UI personalisation reads from this graph.
// Stored as JSON in StorageProvider → syncs via SyncEngine → migrates to cloud.
//
// Node confidence levels:
//   inferred  — derived from behaviour (e.g. dormancy from timestamps)
//   stated    — user told us explicitly (e.g. entered a goal)
//   confirmed — verified by repeated assessment (e.g. established score)
// ─────────────────────────────────────────────────────────────────────────────

export type NodeConfidence = 'inferred' | 'stated' | 'confirmed'

interface GraphNode {
  readonly updatedAt:  string
  readonly confidence: NodeConfidence
}

// ── Identity ──────────────────────────────────────────────────────────────────

export interface IdentityNode extends GraphNode {
  readonly name:      string | null
  readonly userType:  'anonymous' | 'authenticated'
  readonly language:  string
  readonly timezone:  string | null
  readonly age:       number | null
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export type GoalStatus   = 'active' | 'completed' | 'paused'
export type GoalPriority = 'high' | 'medium' | 'low'

export interface GoalEntry {
  readonly id:       string
  readonly text:     string
  readonly status:   GoalStatus
  readonly priority: GoalPriority
  readonly addedAt:  string
}

export interface GoalsNode extends GraphNode {
  readonly items: readonly GoalEntry[]
}

// ── Habits ────────────────────────────────────────────────────────────────────

export type HabitFrequency = 'daily' | 'weekly' | 'occasional'
export type HabitSentiment = 'positive' | 'neutral' | 'negative'

export interface HabitEntry {
  readonly id:        string
  readonly name:      string
  readonly frequency: HabitFrequency
  readonly sentiment: HabitSentiment
}

export interface HabitsNode extends GraphNode {
  readonly items: readonly HabitEntry[]
}

// ── Assessments ───────────────────────────────────────────────────────────────

export interface AssessmentEntry {
  readonly clusterId:  string
  readonly score:      number
  readonly confidence: 'preliminary' | 'established' | 'confirmed'
  readonly assessedAt: string
}

export interface AssessmentsNode extends GraphNode {
  readonly items: readonly AssessmentEntry[]
}

// ── Journey ───────────────────────────────────────────────────────────────────

export interface JourneyNode extends GraphNode {
  readonly activeCluster:   string | null
  readonly currentPhase:    string | null
  readonly progress:        number | null   // 0–100
  readonly completedSteps:  readonly string[]
}

// ── Coach Memory ──────────────────────────────────────────────────────────────

export type MemoryCategory = 'preference' | 'fact' | 'belief' | 'event'
export type MemoryImportance = 'low' | 'medium' | 'high'
export type CommunicationStyle = 'direct' | 'supportive' | 'analytical'

export interface MemoryFact {
  readonly id:         string
  readonly text:       string
  readonly category:   MemoryCategory
  readonly importance: MemoryImportance
  readonly addedAt:    string
}

export interface CoachMemoryNode extends GraphNode {
  readonly facts:               readonly MemoryFact[]
  readonly communicationStyle:  CommunicationStyle | null
  readonly preferredTopics:     readonly string[]
}

// ── Preferences ───────────────────────────────────────────────────────────────

export type ResponseLength = 'brief' | 'medium' | 'detailed'

export interface PreferencesNode extends GraphNode {
  readonly language:             string
  readonly responseLength:       ResponseLength | null
  readonly notificationsEnabled: boolean
}

// ── Retention ─────────────────────────────────────────────────────────────────

export interface RetentionNode extends GraphNode {
  readonly daysSinceActive:     number
  readonly dormancyLevel:       string
  readonly lastReminderFiredAt: string | null
}

// ── Premium ───────────────────────────────────────────────────────────────────

export interface PremiumNode extends GraphNode {
  readonly tier:           string
  readonly quotaUsedToday: number
  readonly quotaLimit:     number
}

// ── Root Graph ────────────────────────────────────────────────────────────────

export interface UserGraph {
  readonly userId:    string
  readonly createdAt: string
  updatedAt:          string
  version:            number

  identity:    IdentityNode
  goals:       GoalsNode
  habits:      HabitsNode
  assessments: AssessmentsNode
  journey:     JourneyNode
  coachMemory: CoachMemoryNode
  preferences: PreferencesNode
  retention:   RetentionNode
  premium:     PremiumNode
}
