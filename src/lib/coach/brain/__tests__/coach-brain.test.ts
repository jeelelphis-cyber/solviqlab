// ─────────────────────────────────────────────────────────────────────────────
// CoachBrain — unit tests
//
// All external dependencies (CoachMemoryInterface, DecisionEngineImpl, UserGraph)
// are mocked. Tests validate orchestration logic only — never implementation details
// of memory or decision engine.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MockedObject }                     from 'vitest'

import { CoachBrain }             from '../coach-brain'
import { DecisionEngineImpl }     from '../decision-engine'
import type { CoachMemoryInterface, CoachPersonaConfig, MiaContext } from '../../contracts'
import type { CoachDecision, DailyHistory, CoachPhase } from '../../domain/types'
import type { UserGraph }         from '../../../graph/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeUserGraph(overrides: Partial<UserGraph> = {}): UserGraph {
  const ts = new Date().toISOString()
  return {
    userId:    'user-1',
    createdAt: ts,
    updatedAt: ts,
    version:   1,
    identity:  { name: 'Alex', userType: 'authenticated', language: 'en', timezone: null, age: null, updatedAt: ts, confidence: 'inferred' },
    goals:     { items: [], updatedAt: ts, confidence: 'stated' },
    habits:    { items: [], updatedAt: ts, confidence: 'stated' },
    assessments: { items: [], updatedAt: ts, confidence: 'inferred' },
    journey:   { activeCluster: null, currentPhase: null, progress: null, completedSteps: [], updatedAt: ts, confidence: 'inferred' },
    coachMemory: { facts: [], communicationStyle: null, preferredTopics: [], updatedAt: ts, confidence: 'inferred' },
    preferences: { language: 'en', responseLength: null, notificationsEnabled: true, updatedAt: ts, confidence: 'inferred' },
    retention: { daysSinceActive: 0, dormancyLevel: 'none', lastReminderFiredAt: null, updatedAt: ts, confidence: 'inferred' },
    premium:   { tier: 'free', quotaUsedToday: 0, quotaLimit: 5, updatedAt: ts, confidence: 'inferred' },
    dailyHistory: { entries: [], updatedAt: ts, confidence: 'inferred' },
    ...overrides,
  }
}

function makeMiaContext(overrides: Partial<MiaContext> = {}): MiaContext {
  return {
    name:                       'Alex',
    daysSinceStart:             0,
    currentStreak:              0,
    lastAction:                 null,
    lastMoodRating:             null,
    lastEnergyRating:           null,
    currentGoal:                null,
    recentVictories:            [],
    recentFailures:             [],
    coachNotes:                 [],
    nextMilestone:              null,
    coachPhase:                 'onboarding',
    lastVideoWatchedAt:         null,
    preferredCommunicationTime: null,
    ...overrides,
  }
}

function makePersona(
  rules: CoachPersonaConfig['decisionRules'] = [],
): CoachPersonaConfig {
  return {
    coachId:   'mia',
    coachName: 'Mia',
    cluster:   'weight',
    personality: {
      tone:          'warm_direct',
      style:         'coaching',
      languageLevel: 'simple',
      emojiPolicy:   'sparingly',
    },
    decisionRules: rules,
    toneByPhase: {
      onboarding:     { key: 'calm_trust',   instruction: 'calm' },
      firstWeek:      { key: 'observational', instruction: 'observe' },
      firstMonth:     { key: 'building',      instruction: 'build' },
      transformation: { key: 'celebrating',   instruction: 'celebrate' },
      partnership:    { key: 'peer',          instruction: 'peer' },
    },
    videoTemplates: {
      morning:      { structure: [], maxDuration: 60, requiredVars: [], fallbackText: '' },
      evening:      { structure: [], maxDuration: 60, requiredVars: [], fallbackText: '' },
      intervention: {
        L1: { structure: [], maxDuration: 60, requiredVars: [], fallbackText: '' },
        L2: { structure: [], maxDuration: 60, requiredVars: [], fallbackText: '' },
        L3: { structure: [], maxDuration: 60, requiredVars: [], fallbackText: '' },
        L4: { structure: [], maxDuration: 60, requiredVars: [], fallbackText: '' },
        L5: { structure: [], maxDuration: 60, requiredVars: [], fallbackText: '' },
      },
      milestone:   { structure: [], maxDuration: 60, requiredVars: [], fallbackText: '' },
      celebration: { structure: [], maxDuration: 60, requiredVars: [], fallbackText: '' },
      weekReview:  { structure: [], maxDuration: 60, requiredVars: [], fallbackText: '' },
      monthReview: { structure: [], maxDuration: 60, requiredVars: [], fallbackText: '' },
    },
    domainConfig: {
      primaryMetric:    'weight_kg',
      secondaryMetrics: [],
      taskCategories:   [],
      interventionThresholds: {
        skipDaysL1: 1,
        skipDaysL2: 3,
        skipDaysL3: 7,
        offTrackWeeksL4: 2,
        trendDownWeeksL5: 4,
      },
    },
    safetyRules: {
      neverMentionTopics: [],
      requiresDisclaimer: [],
      escalateToHuman:    [],
    },
  }
}

function makeDailyHistory(
  date: string,
  tasksCompleted: string[] = [],
  mood: number | null = null,
): DailyHistory {
  return {
    date,
    userId:              'user-1',
    morningVideoWatched: false,
    eveningCheckinDone:  tasksCompleted.length > 0,
    tasksAssigned:       [],
    tasksCompleted,
    moodRating:          { value: mood, context: 'evening' },
    energyRating:        { value: null, context: null },
    notes:               null,
    videoWatchDuration:  null,
  }
}

// ── Mock factories ────────────────────────────────────────────────────────────

function makeMockMemory(): MockedObject<CoachMemoryInterface> {
  return {
    buildContext:        vi.fn(),
    readGraph:           vi.fn(),
    recordDecision:      vi.fn(),
    recordDailyHistory:  vi.fn(),
    getDailyHistory:     vi.fn(),
    getRoutine:          vi.fn(),
    getDailyReview:      vi.fn(),
  }
}

function makeMockEngine(): MockedObject<DecisionEngineImpl> {
  return {
    evaluate: vi.fn(),
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CoachBrain', () => {
  let memory: MockedObject<CoachMemoryInterface>
  let engine: MockedObject<DecisionEngineImpl>
  let brain:  CoachBrain

  beforeEach(() => {
    memory = makeMockMemory()
    engine = makeMockEngine()
    brain  = new CoachBrain(memory, engine)
  })

  // ── analyze() ──────────────────────────────────────────────────────────────

  describe('analyze()', () => {
    it('returns empty array when no rules match', async () => {
      memory.readGraph.mockResolvedValue(makeUserGraph())
      engine.evaluate.mockResolvedValue([])

      const persona    = makePersona([])
      const decisions  = await brain.analyze('user-1', persona)

      expect(decisions).toHaveLength(0)
      expect(engine.evaluate).toHaveBeenCalledOnce()
    })

    it('returns decision when rule condition is met', async () => {
      const graph = makeUserGraph()
      memory.readGraph.mockResolvedValue(graph)
      memory.recordDecision.mockResolvedValue(undefined)

      const decision: CoachDecision = {
        decisionId:        'dec-1',
        userId:            'user-1',
        personaId:         'mia' as never,
        trigger:           'analyze',
        scriptType:        'morning_standard',
        motivationState:   'medium',
        interventionLevel: null,
        rationale:         'Default morning script',
        firedRuleId:       'rule-1',
        decidedAt:         new Date().toISOString(),
      }

      engine.evaluate.mockResolvedValue([decision])

      const persona   = makePersona([
        {
          ruleId:    'rule-1',
          condition: 'Default morning script',
          priority:  10,
          action:    { type: 'set_script_type', value: 'morning_standard' },
        },
      ])
      const decisions = await brain.analyze('user-1', persona)

      expect(decisions).toHaveLength(1)
      expect(decisions[0]?.scriptType).toBe('morning_standard')
      expect(memory.recordDecision).toHaveBeenCalledWith('user-1', decision)
    })

    it('records decision in memory audit log for each matched decision', async () => {
      memory.readGraph.mockResolvedValue(makeUserGraph())
      memory.recordDecision.mockResolvedValue(undefined)

      const decision: CoachDecision = {
        decisionId:        'dec-event-1',
        userId:            'user-1',
        personaId:         'mia' as never,
        trigger:           'analyze',
        scriptType:        'morning_standard',
        motivationState:   'medium',
        interventionLevel: null,
        rationale:         'Rule fired',
        firedRuleId:       'rule-1',
        decidedAt:         new Date().toISOString(),
      }
      engine.evaluate.mockResolvedValue([decision])

      await brain.analyze('user-1', makePersona())

      // recordDecision is the audit-log side effect triggered for every decision
      expect(memory.recordDecision).toHaveBeenCalledOnce()
      expect(memory.recordDecision).toHaveBeenCalledWith('user-1', decision)
    })
  })

  // ── checkIntervention() ───────────────────────────────────────────────────

  describe('checkIntervention()', () => {
    it('returns null when no history available', async () => {
      memory.getDailyHistory.mockResolvedValue([])
      const result = await brain.checkIntervention('user-1', makePersona())
      expect(result).toBeNull()
    })

    it('returns null when user has recent task completions', async () => {
      memory.getDailyHistory.mockResolvedValue([
        makeDailyHistory('2026-07-24', ['task-1']),
        makeDailyHistory('2026-07-25', ['task-2']),
      ])
      const result = await brain.checkIntervention('user-1', makePersona())
      expect(result).toBeNull()
    })

    it('returns missed_days intervention after 3 consecutive missed days', async () => {
      // persona has skipDaysL1 = 1, but Brain requires max(skipDaysL1, 3) = 3
      const history: readonly DailyHistory[] = [
        makeDailyHistory('2026-07-23', []),
        makeDailyHistory('2026-07-24', []),
        makeDailyHistory('2026-07-25', []),
      ]
      memory.getDailyHistory.mockResolvedValue(history)

      const result = await brain.checkIntervention('user-1', makePersona())

      expect(result).not.toBeNull()
      expect(result?.level).toBe(1)
      expect(result?.reason).toContain('3 consecutive day')
      expect(result?.scriptType).toBe('morning_intervention')
    })

    it('returns regression intervention when mood is declining', async () => {
      const history: readonly DailyHistory[] = [
        makeDailyHistory('2026-07-23', ['task-1'], 5),
        makeDailyHistory('2026-07-24', ['task-2'], 3),
        makeDailyHistory('2026-07-25', ['task-3'], 1),
      ]
      memory.getDailyHistory.mockResolvedValue(history)

      const result = await brain.checkIntervention('user-1', makePersona())

      expect(result).not.toBeNull()
      expect(result?.level).toBe(2)
      expect(result?.reason).toContain('Mood declined')
    })
  })

  // ── getCurrentPhase() ─────────────────────────────────────────────────────

  describe('getCurrentPhase()', () => {
    it('returns onboarding for a new user with no journey data', async () => {
      memory.buildContext.mockResolvedValue(makeMiaContext({ coachPhase: 'onboarding' }))
      const phase = await brain.getCurrentPhase('user-1')
      expect(phase).toBe<CoachPhase>('onboarding')
    })

    it('returns active when user is in active coaching', async () => {
      memory.buildContext.mockResolvedValue(makeMiaContext({ coachPhase: 'active' }))
      const phase = await brain.getCurrentPhase('user-1')
      expect(phase).toBe<CoachPhase>('active')
    })
  })

  // ── recordCheckIn() ───────────────────────────────────────────────────────

  describe('recordCheckIn()', () => {
    it('saves check-in data to memory', async () => {
      memory.recordDailyHistory.mockResolvedValue(undefined)

      await brain.recordCheckIn('user-1', {
        userId:         'user-1',
        date:           '2026-07-25',
        mood:           4,
        energy:         3,
        completedTasks: ['task-1', 'task-2'],
        notes:          'Felt good today',
      })

      expect(memory.recordDailyHistory).toHaveBeenCalledOnce()
      const [calledUserId, calledEntry] = memory.recordDailyHistory.mock.calls[0]!
      expect(calledUserId).toBe('user-1')
      expect(calledEntry.date).toBe('2026-07-25')
      expect(calledEntry.moodRating.value).toBe(4)
      expect(calledEntry.energyRating.value).toBe(3)
      expect(calledEntry.tasksCompleted).toEqual(['task-1', 'task-2'])
      expect(calledEntry.notes).toBe('Felt good today')
    })

    it('stores null notes when notes is not provided', async () => {
      memory.recordDailyHistory.mockResolvedValue(undefined)

      await brain.recordCheckIn('user-1', {
        userId:         'user-1',
        date:           '2026-07-25',
        mood:           3,
        energy:         3,
        completedTasks: [],
      })

      const [, calledEntry] = memory.recordDailyHistory.mock.calls[0]!
      expect(calledEntry.notes).toBeNull()
    })
  })
})
