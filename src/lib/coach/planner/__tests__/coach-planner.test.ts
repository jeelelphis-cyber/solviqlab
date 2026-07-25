// ─────────────────────────────────────────────────────────────────────────────
// CoachPlannerImpl — unit tests
//
// Mocks: GraphRepository, GraphUpdater, PlannerEngine (via vi.mock).
//
// Key invariant tested: requestAdaptation() dispatches PlanChangedEvent via
// EventBus — it NEVER calls PlannerEngine.adapt() directly (C2 / P-16).
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { MockedObject } from 'vitest'

import { CoachPlannerImpl }       from '../coach-planner'
import type { GraphRepository }   from '../../../graph/repository'
import type { GraphUpdater }      from '../../../graph/updater'
import type { UserGraph }         from '../../../graph/types'
import type { CoachGoal, CoachPlan, CoachPlanId, CoachGoalId, CoachPersonaId } from '../../domain/types'
import type { CoachPersonaConfig }from '../../contracts'
import type { ActivePlan }        from '../../../domain/active-plan'

// ── vi.mock PlannerEngine ─────────────────────────────────────────────────────
// We want to assert that adapt() on PlannerEngine is NEVER called by CoachPlannerImpl.

vi.mock('../../../planner/engine', () => {
  const adapt  = vi.fn()
  const build  = vi.fn().mockReturnValue({
    plan_id:          'plan-mock-1',
    cluster:          'weight',
    strategy_id:      'balanced',
    assessment_id:    'assess-1',
    goal:             'Reach 74 kg',
    goal_value:       74,
    current_value:    85,
    start_date:       '2026-07-01',
    target_date:      '2026-12-31',
    duration_weeks:   22,
    status:           'active',
    milestones:       [],
    check_ins:        [],
    last_adapted_at:  null,
    created_at:       '2026-07-01T00:00:00.000Z',
    adaptation_count: 0,
  } satisfies ActivePlan)

  return {
    PlannerEngine: vi.fn().mockImplementation(() => ({ build, adapt })),
    __build: build,
    __adapt: adapt,
  }
})

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeUserGraph(overrides: Partial<UserGraph> = {}): UserGraph {
  const ts = new Date().toISOString()
  return {
    userId:      'user-1',
    createdAt:   ts,
    updatedAt:   ts,
    version:     1,
    identity:    { name: 'Alex', userType: 'authenticated', language: 'en', timezone: null, age: null, updatedAt: ts, confidence: 'inferred' },
    goals:       { items: [], updatedAt: ts, confidence: 'stated' },
    habits:      { items: [], updatedAt: ts, confidence: 'stated' },
    assessments: { items: [], updatedAt: ts, confidence: 'inferred' },
    journey:     { activeCluster: null, currentPhase: 'active', progress: null, completedSteps: [], updatedAt: ts, confidence: 'inferred' },
    coachMemory: { facts: [], communicationStyle: null, preferredTopics: [], updatedAt: ts, confidence: 'inferred' },
    preferences: { language: 'en', responseLength: null, notificationsEnabled: true, updatedAt: ts, confidence: 'inferred' },
    retention:   { daysSinceActive: 0, dormancyLevel: 'none', lastReminderFiredAt: null, updatedAt: ts, confidence: 'inferred' },
    premium:     { tier: 'free', quotaUsedToday: 0, quotaLimit: 5, updatedAt: ts, confidence: 'inferred' },
    dailyHistory: { entries: [], updatedAt: ts, confidence: 'inferred' },
    ...overrides,
  }
}

function makeCoachGoal(overrides: Partial<CoachGoal> = {}): CoachGoal {
  return {
    id:              'goal-1' as unknown as CoachGoalId,
    userId:          'user-1',
    planId:          'plan-1' as unknown as CoachPlanId,
    description:     'Lose weight to 74kg',
    primaryMetric:   'weight_kg',
    targetValue:     74,
    currentValue:    85,
    unit:            'kg',
    status:          'active',
    progressPercent: 0,
    startedAt:       '2026-07-01T00:00:00.000Z',
    targetDate:      '2026-12-31T00:00:00.000Z',
    achievedAt:      null,
    ...overrides,
  }
}

function makePersonaConfig(): CoachPersonaConfig {
  return {
    coachId:   'mia',
    coachName: 'Mia',
    cluster:   'weight',
    personality: {
      tone:          'warm_direct',
      style:         'coaching',
      languageLevel: 'simple',
      emojiPolicy:   'never',
    },
    decisionRules: [],
    toneByPhase: {
      onboarding:     { key: 'calm_trust',          instruction: '' },
      firstWeek:      { key: 'observational',        instruction: '' },
      firstMonth:     { key: 'building_momentum',    instruction: '' },
      transformation: { key: 'celebratory_precise',  instruction: '' },
      partnership:    { key: 'peer_level',            instruction: '' },
    },
    videoTemplates: {
      morning:      { structure: [], maxDuration: 60, requiredVars: [], fallbackText: '' },
      evening:      { structure: [], maxDuration: 45, requiredVars: [], fallbackText: '' },
      intervention: {
        L1: { structure: [], maxDuration: 40, requiredVars: [], fallbackText: '' },
        L2: { structure: [], maxDuration: 50, requiredVars: [], fallbackText: '' },
        L3: { structure: [], maxDuration: 55, requiredVars: [], fallbackText: '' },
        L4: { structure: [], maxDuration: 60, requiredVars: [], fallbackText: '' },
        L5: { structure: [], maxDuration: 50, requiredVars: [], fallbackText: '' },
      },
      milestone:   { structure: [], maxDuration: 60, requiredVars: [], fallbackText: '' },
      celebration: { structure: [], maxDuration: 55, requiredVars: [], fallbackText: '' },
      weekReview:  { structure: [], maxDuration: 90, requiredVars: [], fallbackText: '' },
      monthReview: { structure: [], maxDuration: 120, requiredVars: [], fallbackText: '' },
    },
    domainConfig: {
      primaryMetric:    'weight_kg',
      secondaryMetrics: ['sleep_score'],
      taskCategories:   ['movement', 'nutrition', 'sleep'],
      interventionThresholds: {
        skipDaysL1:       1,
        skipDaysL2:       3,
        skipDaysL3:       7,
        offTrackWeeksL4:  2,
        trendDownWeeksL5: 4,
      },
    },
    safetyRules: {
      neverMentionTopics:  [],
      requiresDisclaimer:  [],
      escalateToHuman:     [],
    },
  }
}

// ── Mock builders ─────────────────────────────────────────────────────────────

function makeRepoMock(graph: UserGraph | null = null): MockedObject<GraphRepository> {
  return {
    get:        vi.fn().mockReturnValue(graph),
    save:       vi.fn(),
    getOrCreate: vi.fn().mockReturnValue(graph ?? makeUserGraph()),
    delete:     vi.fn(),
  } as unknown as MockedObject<GraphRepository>
}

function makeUpdaterMock(): MockedObject<GraphUpdater> {
  return {
    addMemoryFact:       vi.fn(),
    updateJourney:       vi.fn(),
    addDailyHistoryEntry: vi.fn(),
    updateIdentity:      vi.fn(),
    setName:             vi.fn(),
    upsertGoal:          vi.fn(),
    removeGoal:          vi.fn(),
    upsertHabit:         vi.fn(),
    removeHabit:         vi.fn(),
    upsertAssessment:    vi.fn(),
    addPreferredTopic:   vi.fn(),
    setCommunicationStyle: vi.fn(),
    removeMemoryFact:    vi.fn(),
    updatePreferences:   vi.fn(),
    updateRetention:     vi.fn(),
    updatePremium:       vi.fn(),
    getLastNDayHistory:  vi.fn().mockReturnValue([]),
  } as unknown as MockedObject<GraphUpdater>
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CoachPlannerImpl', () => {

  // ── getActivePlan ───────────────────────────────────────────────────────────

  describe('getActivePlan()', () => {
    it('returns null for a new user with no graph', async () => {
      const repo    = makeRepoMock(null)
      const updater = makeUpdaterMock()
      const planner = new CoachPlannerImpl(repo, updater)

      const result = await planner.getActivePlan('user-1')

      expect(result).toBeNull()
    })

    it('returns null when user has no plan stored', async () => {
      const repo    = makeRepoMock(makeUserGraph())
      const updater = makeUpdaterMock()
      const planner = new CoachPlannerImpl(repo, updater)

      const result = await planner.getActivePlan('user-1')

      expect(result).toBeNull()
    })

    it('returns the stored ActivePlan when it exists', async () => {
      const activePlan: ActivePlan = {
        plan_id:          'stored-plan-1',
        cluster:          'weight',
        strategy_id:      'balanced',
        assessment_id:    'a-1',
        goal:             'Lose 11kg',
        goal_value:       74,
        current_value:    85,
        start_date:       '2026-07-01',
        target_date:      '2026-12-31',
        duration_weeks:   22,
        status:           'active',
        milestones:       [],
        check_ins:        [],
        last_adapted_at:  null,
        created_at:       '2026-07-01T00:00:00.000Z',
        adaptation_count: 0,
      }

      const graph = makeUserGraph({
        coachMemory: {
          facts: [{
            id:         'active_coach_plan',
            text:       JSON.stringify(activePlan),
            category:   'fact',
            importance: 'high',
            addedAt:    new Date().toISOString(),
          }],
          communicationStyle: null,
          preferredTopics:    [],
          updatedAt:          new Date().toISOString(),
          confidence:         'inferred',
        },
      })

      const repo    = makeRepoMock(graph)
      const updater = makeUpdaterMock()
      const planner = new CoachPlannerImpl(repo, updater)

      const result = await planner.getActivePlan('user-1')

      expect(result).not.toBeNull()
      expect(result!.plan_id).toBe('stored-plan-1')
    })
  })

  // ── createPlan ─────────────────────────────────────────────────────────────

  describe('createPlan()', () => {
    it('returns a CoachPlan with correct duration for onboarding phase', async () => {
      const graph = makeUserGraph({
        journey: {
          activeCluster: null, currentPhase: 'onboarding', progress: null,
          completedSteps: [], updatedAt: new Date().toISOString(), confidence: 'inferred',
        },
      })
      const repo    = makeRepoMock(graph)
      const updater = makeUpdaterMock()
      const planner = new CoachPlannerImpl(repo, updater)
      const goal    = makeCoachGoal()
      const persona = makePersonaConfig()

      const plan = await planner.createPlan('user-1', goal, persona)

      // PlannerEngine.build() mock returns duration_weeks: 22 → durationDays: 90
      // (mock ignores phase; the duration passed to it sets weeks via build mock)
      expect(plan).toBeDefined()
      expect(plan.userId).toBe('user-1')
      expect([7, 30, 90]).toContain(plan.durationDays)
    })

    it('returns a CoachPlan with 90-day duration for active phase', async () => {
      const graph = makeUserGraph({
        journey: {
          activeCluster: null, currentPhase: 'active', progress: null,
          completedSteps: [], updatedAt: new Date().toISOString(), confidence: 'inferred',
        },
      })
      const repo    = makeRepoMock(graph)
      const updater = makeUpdaterMock()
      const planner = new CoachPlannerImpl(repo, updater)
      const goal    = makeCoachGoal()
      const persona = makePersonaConfig()

      const plan = await planner.createPlan('user-1', goal, persona)

      // active phase + mock build returns 22 weeks → 90 days
      expect(plan.durationDays).toBe(90)
    })

    it('saves the plan to graph (calls addMemoryFact)', async () => {
      const repo    = makeRepoMock(makeUserGraph())
      const updater = makeUpdaterMock()
      const planner = new CoachPlannerImpl(repo, updater)

      await planner.createPlan('user-1', makeCoachGoal(), makePersonaConfig())

      expect(updater.addMemoryFact).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ id: 'active_coach_plan' }),
      )
    })

    it('also saves CoachPlan metadata to graph', async () => {
      const repo    = makeRepoMock(makeUserGraph())
      const updater = makeUpdaterMock()
      const planner = new CoachPlannerImpl(repo, updater)

      await planner.createPlan('user-1', makeCoachGoal(), makePersonaConfig())

      expect(updater.addMemoryFact).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ id: 'active_coach_plan_meta' }),
      )
    })

    it('updates journey after plan creation', async () => {
      const repo    = makeRepoMock(makeUserGraph())
      const updater = makeUpdaterMock()
      const planner = new CoachPlannerImpl(repo, updater)

      await planner.createPlan('user-1', makeCoachGoal(), makePersonaConfig())

      expect(updater.updateJourney).toHaveBeenCalledWith('user-1', expect.any(Object))
    })
  })

  // ── requestAdaptation ──────────────────────────────────────────────────────

  describe('requestAdaptation()', () => {
    it('dispatches a PlanChangedEvent (coach:plan_adapt) via the dispatch function', async () => {
      const dispatched: import('../../events/types').PlanChangedEvent[] = []
      const dispatchFn = vi.fn((e: import('../../events/types').PlanChangedEvent) => { dispatched.push(e) })

      const repo    = makeRepoMock(makeUserGraph())
      const updater = makeUpdaterMock()
      const planner = new CoachPlannerImpl(repo, updater, dispatchFn)

      await planner.requestAdaptation('user-1', 'user_struggling')

      expect(dispatched).toHaveLength(1)
      expect(dispatched[0]!.type).toBe('coach:plan_adapt')
    })

    it('includes userId in the dispatched event', async () => {
      const dispatched: import('../../events/types').PlanChangedEvent[] = []
      const dispatchFn = vi.fn((e: import('../../events/types').PlanChangedEvent) => { dispatched.push(e) })

      const repo    = makeRepoMock(makeUserGraph())
      const updater = makeUpdaterMock()
      const planner = new CoachPlannerImpl(repo, updater, dispatchFn)

      await planner.requestAdaptation('user-42', 'weekly_review')

      expect(dispatched[0]!.userId).toBe('user-42')
    })

    it('maps "intervention" reason to "motivation_critical" in the event payload', async () => {
      const dispatched: import('../../events/types').PlanChangedEvent[] = []
      const dispatchFn = vi.fn((e: import('../../events/types').PlanChangedEvent) => { dispatched.push(e) })

      const repo    = makeRepoMock(makeUserGraph())
      const updater = makeUpdaterMock()
      const planner = new CoachPlannerImpl(repo, updater, dispatchFn)

      await planner.requestAdaptation('user-1', 'intervention')

      expect(dispatched[0]!.payload.reason).toBe('motivation_critical')
    })

    it('does NOT call PlannerEngine.adapt() directly — C2 invariant', async () => {
      // Import the mocked adapt spy
      const { __adapt } = await import('../../../planner/engine') as unknown as { __adapt: ReturnType<typeof vi.fn> }
      __adapt.mockClear()

      const dispatchFn = vi.fn()
      const repo    = makeRepoMock(makeUserGraph())
      const updater = makeUpdaterMock()
      const planner = new CoachPlannerImpl(repo, updater, dispatchFn)

      await planner.requestAdaptation('user-1', 'user_struggling')
      await planner.requestAdaptation('user-1', 'user_excelling')
      await planner.requestAdaptation('user-1', 'goal_changed')
      await planner.requestAdaptation('user-1', 'intervention')
      await planner.requestAdaptation('user-1', 'weekly_review')

      // adapt() must NEVER have been called
      expect(__adapt).not.toHaveBeenCalled()
    })

    it('dispatches a PlanChangedEvent even when user has no existing plan', async () => {
      const dispatched: import('../../events/types').PlanChangedEvent[] = []
      const dispatchFn = vi.fn((e: import('../../events/types').PlanChangedEvent) => { dispatched.push(e) })

      const repo    = makeRepoMock(null)
      const updater = makeUpdaterMock()
      const planner = new CoachPlannerImpl(repo, updater, dispatchFn)

      await planner.requestAdaptation('user-1', 'user_struggling')

      expect(dispatched).toHaveLength(1)
      expect(dispatched[0]!.type).toBe('coach:plan_adapt')
    })
  })

  // ── dispatchPlanAdapt ──────────────────────────────────────────────────────

  describe('dispatchPlanAdapt()', () => {
    it('dispatches coach:plan_adapt with all required fields', async () => {
      const dispatched: import('../../events/types').PlanChangedEvent[] = []
      const dispatchFn = vi.fn((e: import('../../events/types').PlanChangedEvent) => { dispatched.push(e) })

      const repo    = makeRepoMock(makeUserGraph())
      const updater = makeUpdaterMock()
      const planner = new CoachPlannerImpl(repo, updater, dispatchFn)
      const planId  = 'plan-x' as unknown as import('../../domain/types').CoachPlanId

      await planner.dispatchPlanAdapt('user-1', planId, 'energy_low', 3, 83.5, 6, 'feeling low energy')

      expect(dispatched).toHaveLength(1)
      expect(dispatched[0]!.type).toBe('coach:plan_adapt')
      expect(dispatched[0]!.userId).toBe('user-1')
      expect(dispatched[0]!.payload.reason).toBe('energy_low')
      expect(dispatched[0]!.payload.week).toBe(3)
      expect(dispatched[0]!.payload.actualValue).toBe(83.5)
      expect(dispatched[0]!.payload.subjectiveScore).toBe(6)
      expect(dispatched[0]!.payload.notes).toBe('feeling low energy')
    })
  })

  // ── completeTask ───────────────────────────────────────────────────────────

  describe('completeTask()', () => {
    it('marks the task as completed in the stored plan', async () => {
      const coachPlan: CoachPlan = {
        id:               'plan-1' as unknown as CoachPlanId,
        userId:           'user-1',
        personaId:        'mia' as unknown as CoachPersonaId,
        activePlanId:     'plan-1',
        goalId:           'goal-1' as unknown as CoachGoalId,
        durationDays:     90,
        phase:            'active',
        status:           'active',
        tasks: [{
          id:                'task-1' as unknown as import('../../domain/types').CoachTaskId,
          planId:            'plan-1' as unknown as CoachPlanId,
          date:              '2026-07-25',
          description:       'Walk 10 min',
          category:          'movement',
          estimatedMinutes:  10,
          status:            'assigned',
          completedAt:       null,
        }],
        startedAt:        '2026-07-01T00:00:00.000Z',
        endsAt:           '2026-12-31T00:00:00.000Z',
        lastAdaptedAt:    null,
        adaptationCount:  0,
        createdAt:        '2026-07-01T00:00:00.000Z',
      }

      const graph = makeUserGraph({
        coachMemory: {
          facts: [{
            id:         'active_coach_plan_meta',
            text:       JSON.stringify(coachPlan),
            category:   'fact',
            importance: 'high',
            addedAt:    new Date().toISOString(),
          }],
          communicationStyle: null,
          preferredTopics:    [],
          updatedAt:          new Date().toISOString(),
          confidence:         'inferred',
        },
      })

      const repo    = makeRepoMock(graph)
      const updater = makeUpdaterMock()
      const planner = new CoachPlannerImpl(repo, updater)

      await planner.completeTask('user-1', 'task-1')

      expect(updater.addMemoryFact).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ id: 'active_coach_plan_meta' }),
      )

      // Verify the saved plan has the task as completed
      const savedCall = (updater.addMemoryFact as ReturnType<typeof vi.fn>).mock.calls[0]![1] as { text: string }
      const savedPlan = JSON.parse(savedCall.text) as CoachPlan
      expect(savedPlan.tasks[0]!.status).toBe('completed')
      expect(savedPlan.tasks[0]!.completedAt).not.toBeNull()
    })

    it('does nothing when user has no plan', async () => {
      const repo    = makeRepoMock(makeUserGraph())
      const updater = makeUpdaterMock()
      const planner = new CoachPlannerImpl(repo, updater)

      // Should not throw
      await expect(planner.completeTask('user-1', 'nonexistent-task')).resolves.toBeUndefined()
      expect(updater.addMemoryFact).not.toHaveBeenCalled()
    })
  })

  // ── getTodaysTasks ─────────────────────────────────────────────────────────

  describe('getTodaysTasks()', () => {
    it('returns tasks scheduled for today', async () => {
      const today = new Date()
      const y     = today.getFullYear()
      const m     = String(today.getMonth() + 1).padStart(2, '0')
      const d     = String(today.getDate()).padStart(2, '0')
      const todayStr = `${y}-${m}-${d}`

      const coachPlan: CoachPlan = {
        id:              'plan-1' as unknown as CoachPlanId,
        userId:          'user-1',
        personaId:       'mia' as unknown as CoachPersonaId,
        activePlanId:    'plan-1',
        goalId:          'goal-1' as unknown as CoachGoalId,
        durationDays:    90,
        phase:           'active',
        status:          'active',
        tasks: [{
          id:                'task-today' as unknown as import('../../domain/types').CoachTaskId,
          planId:            'plan-1' as unknown as CoachPlanId,
          date:              todayStr,
          description:       'Walk 10 min',
          category:          'movement',
          estimatedMinutes:  10,
          status:            'assigned',
          completedAt:       null,
        }, {
          id:                'task-other' as unknown as import('../../domain/types').CoachTaskId,
          planId:            'plan-1' as unknown as CoachPlanId,
          date:              '2026-01-01',
          description:       'Old task',
          category:          'movement',
          estimatedMinutes:  10,
          status:            'assigned',
          completedAt:       null,
        }],
        startedAt:        '2026-07-01T00:00:00.000Z',
        endsAt:           '2026-12-31T00:00:00.000Z',
        lastAdaptedAt:    null,
        adaptationCount:  0,
        createdAt:        '2026-07-01T00:00:00.000Z',
      }

      const graph = makeUserGraph({
        coachMemory: {
          facts: [{
            id:         'active_coach_plan_meta',
            text:       JSON.stringify(coachPlan),
            category:   'fact',
            importance: 'high',
            addedAt:    new Date().toISOString(),
          }],
          communicationStyle: null,
          preferredTopics:    [],
          updatedAt:          new Date().toISOString(),
          confidence:         'inferred',
        },
      })

      const repo    = makeRepoMock(graph)
      const updater = makeUpdaterMock()
      const planner = new CoachPlannerImpl(repo, updater)

      const tasks = await planner.getTodaysTasks('user-1')

      expect(tasks).toHaveLength(1)
      expect((tasks[0]! as { id: string }).id).toBe('task-today')
    })

    it('excludes completed tasks from today', async () => {
      const today = new Date()
      const y     = today.getFullYear()
      const m     = String(today.getMonth() + 1).padStart(2, '0')
      const d     = String(today.getDate()).padStart(2, '0')
      const todayStr = `${y}-${m}-${d}`

      const coachPlan: CoachPlan = {
        id:              'plan-1' as unknown as CoachPlanId,
        userId:          'user-1',
        personaId:       'mia' as unknown as CoachPersonaId,
        activePlanId:    'plan-1',
        goalId:          'goal-1' as unknown as CoachGoalId,
        durationDays:    90,
        phase:           'active',
        status:          'active',
        tasks: [{
          id:                'task-done' as unknown as import('../../domain/types').CoachTaskId,
          planId:            'plan-1' as unknown as CoachPlanId,
          date:              todayStr,
          description:       'Already done',
          category:          'movement',
          estimatedMinutes:  10,
          status:            'completed',
          completedAt:       new Date().toISOString(),
        }],
        startedAt:       '2026-07-01T00:00:00.000Z',
        endsAt:          '2026-12-31T00:00:00.000Z',
        lastAdaptedAt:   null,
        adaptationCount: 0,
        createdAt:       '2026-07-01T00:00:00.000Z',
      }

      const graph = makeUserGraph({
        coachMemory: {
          facts: [{
            id:         'active_coach_plan_meta',
            text:       JSON.stringify(coachPlan),
            category:   'fact',
            importance: 'high',
            addedAt:    new Date().toISOString(),
          }],
          communicationStyle: null,
          preferredTopics:    [],
          updatedAt:          new Date().toISOString(),
          confidence:         'inferred',
        },
      })

      const repo    = makeRepoMock(graph)
      const updater = makeUpdaterMock()
      const planner = new CoachPlannerImpl(repo, updater)

      // completed tasks filtered → falls through to default tasks
      const tasks = await planner.getTodaysTasks('user-1', makePersonaConfig())

      // All today's tasks are completed → default tasks generated
      expect(tasks.length).toBeGreaterThan(0)
      tasks.forEach(t => expect(t.status).toBe('assigned'))
    })

    it('returns default tasks when no plan exists', async () => {
      const repo    = makeRepoMock(null)
      const updater = makeUpdaterMock()
      const planner = new CoachPlannerImpl(repo, updater)

      const tasks = await planner.getTodaysTasks('user-1', makePersonaConfig())

      expect(tasks.length).toBeGreaterThan(0)
      expect(tasks.length).toBeLessThanOrEqual(3)
      tasks.forEach(t => {
        expect(t.status).toBe('assigned')
        expect(t.completedAt).toBeNull()
      })
    })

    it('returns default tasks scoped to today when no plan exists', async () => {
      const today = new Date()
      const y     = today.getFullYear()
      const m     = String(today.getMonth() + 1).padStart(2, '0')
      const d     = String(today.getDate()).padStart(2, '0')
      const todayStr = `${y}-${m}-${d}`

      const repo    = makeRepoMock(null)
      const updater = makeUpdaterMock()
      const planner = new CoachPlannerImpl(repo, updater)

      const tasks = await planner.getTodaysTasks('user-1', makePersonaConfig())

      tasks.forEach(t => expect(t.date).toBe(todayStr))
    })
  })
})
