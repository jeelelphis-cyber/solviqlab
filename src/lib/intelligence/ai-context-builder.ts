// ─────────────────────────────────────────────────────────────────────────────
// AIContextBuilder — строит AIContext из UserGraph.
//
// Правила:
//   1. Не знает ни о каком Coach (Mia, Alex, ...).
//   2. Не генерирует текст. Возвращает структурированные данные.
//   3. Не знает о LLM провайдере.
//   4. Coach получает AIContext и сам строит prompt через CoachPromptBuilder.
//
// Capabilities строятся из subscription, не из тарифного плана напрямую.
// Coach не знает о тарифах — только о возможностях.
// ─────────────────────────────────────────────────────────────────────────────

import type { UserGraph } from '../graph/types'

// ── Subscription info (передаётся снаружи — из Member Platform) ───────────────

export interface SubscriptionInfo {
  readonly isPro:     boolean
  readonly tier:      'free' | 'pro' | 'enterprise'
  readonly trialDaysRemaining: number | null
}

// ── Capabilities — что может делать этот пользователь ─────────────────────────

export interface UserCapabilities {
  readonly canUsePremiumCoach:    boolean  // платный / триал
  readonly canGeneratePlan:       boolean  // isPro
  readonly canAccessHistory:      boolean  // isPro
  readonly canUseDeepReasoning:   boolean  // isPro (DeepSeek R1 instead of V3)
  readonly canReceiveNudges:      boolean  // preferences.notificationsEnabled
  readonly responseLength:        'brief' | 'medium' | 'detailed' | null
}

// ── AIContext — универсальный объект для любого Coach ─────────────────────────

export interface AIContext {
  readonly userId:       string | null
  readonly user: {
    readonly name:     string | null
    readonly age:      number | null
    readonly language: string
    readonly timezone: string | null
  }
  readonly goals:        ReadonlyArray<{ text: string; status: string; priority: string }>
  readonly habits:       ReadonlyArray<{ name: string; frequency: string; sentiment: string }>
  readonly assessments:  ReadonlyArray<{ clusterId: string; score: number; assessedAt: string }>
  readonly coachMemory: {
    readonly facts:              ReadonlyArray<{ content: string; category: string; importance: string }>
    readonly communicationStyle: string | null
    readonly preferredTopics:    readonly string[]
  }
  readonly journey: {
    readonly activeCluster:  string | null
    readonly currentPhase:   string | null
    readonly progress:       number | null
    readonly completedSteps: readonly string[]
  }
  readonly capabilities:  UserCapabilities
  readonly recentEvents:  readonly string[]   // последние N имён событий (SCREAMING_SNAKE_CASE)
  readonly graphVersion:  number
  readonly generatedAt:   string
}

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildAIContext(
  graph: UserGraph,
  subscription: SubscriptionInfo,
  recentEventNames: readonly string[] = [],
): AIContext {
  const capabilities: UserCapabilities = {
    canUsePremiumCoach:   subscription.isPro,
    canGeneratePlan:      subscription.isPro,
    canAccessHistory:     subscription.isPro,
    canUseDeepReasoning:  subscription.isPro,
    canReceiveNudges:     graph.preferences.notificationsEnabled,
    responseLength:       graph.preferences.responseLength ?? null,
  }

  return {
    userId: graph.userId,
    user: {
      name:     graph.identity.name,
      age:      graph.identity.age,
      language: graph.identity.language,
      timezone: graph.identity.timezone,
    },
    goals: graph.goals.items.map(g => ({
      text:     g.text,
      status:   g.status,
      priority: g.priority,
    })),
    habits: graph.habits.items.map(h => ({
      name:      h.name,
      frequency: h.frequency,
      sentiment: h.sentiment,
    })),
    assessments: graph.assessments.items.map(a => ({
      clusterId:  a.clusterId,
      score:      a.score,
      assessedAt: a.assessedAt,
    })),
    coachMemory: {
      facts:              graph.coachMemory.facts.map(f => ({
        content:    f.text,
        category:   f.category,
        importance: f.importance,
      })),
      communicationStyle: graph.coachMemory.communicationStyle,
      preferredTopics:    graph.coachMemory.preferredTopics,
    },
    journey: {
      activeCluster:  graph.journey.activeCluster,
      currentPhase:   graph.journey.currentPhase,
      progress:       graph.journey.progress,
      completedSteps: graph.journey.completedSteps,
    },
    capabilities,
    recentEvents:  recentEventNames.slice(0, 20),
    graphVersion:  graph.version,
    generatedAt:   new Date().toISOString(),
  }
}
