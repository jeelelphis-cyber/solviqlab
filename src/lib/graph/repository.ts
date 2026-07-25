import type { StorageProvider } from '../user/storage'
import type { UserGraph } from './types'

const STORAGE_PREFIX = 'graph:'
const CURRENT_VERSION = 1

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`
}

function now(): string { return new Date().toISOString() }

export class GraphRepository {
  constructor(private readonly storage: StorageProvider) {}

  get(userId: string): UserGraph | null {
    return this.storage.get<UserGraph>(storageKey(userId)) ?? null
  }

  save(graph: UserGraph): void {
    this.storage.set(storageKey(graph.userId), {
      ...graph,
      updatedAt: now(),
      version:   CURRENT_VERSION,
    })
  }

  getOrCreate(userId: string, defaults: Partial<UserGraph> = {}): UserGraph {
    const existing = this.get(userId)
    if (existing) return existing

    const created = buildDefault(userId, defaults)
    this.save(created)
    return created
  }

  delete(userId: string): void {
    this.storage.set(storageKey(userId), null)
  }
}

function buildDefault(userId: string, overrides: Partial<UserGraph>): UserGraph {
  const ts = now()

  const base: UserGraph = {
    userId,
    createdAt: ts,
    updatedAt: ts,
    version:   CURRENT_VERSION,

    identity: {
      name:       null,
      userType:   'anonymous',
      language:   'en',
      timezone:   null,
      age:        null,
      updatedAt:  ts,
      confidence: 'inferred',
    },
    goals: {
      items:      [],
      updatedAt:  ts,
      confidence: 'stated',
    },
    habits: {
      items:      [],
      updatedAt:  ts,
      confidence: 'stated',
    },
    assessments: {
      items:      [],
      updatedAt:  ts,
      confidence: 'inferred',
    },
    journey: {
      activeCluster:  null,
      currentPhase:   null,
      progress:       null,
      completedSteps: [],
      updatedAt:      ts,
      confidence:     'inferred',
    },
    coachMemory: {
      facts:              [],
      communicationStyle: null,
      preferredTopics:    [],
      updatedAt:          ts,
      confidence:         'inferred',
    },
    preferences: {
      language:             'en',
      responseLength:       null,
      notificationsEnabled: true,
      updatedAt:            ts,
      confidence:           'inferred',
    },
    retention: {
      daysSinceActive:     0,
      dormancyLevel:       'none',
      lastReminderFiredAt: null,
      updatedAt:           ts,
      confidence:          'inferred',
    },
    premium: {
      tier:           'free',
      quotaUsedToday: 0,
      quotaLimit:     5,
      updatedAt:      ts,
      confidence:     'inferred',
    },
    dailyHistory: {
      entries:    [],
      updatedAt:  ts,
      confidence: 'inferred',
    },
    quizResults: {
      items:      [],
      updatedAt:  ts,
      confidence: 'inferred',
    },
  }

  return { ...base, ...overrides }
}
