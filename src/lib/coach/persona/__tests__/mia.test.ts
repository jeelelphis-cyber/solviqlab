// ─────────────────────────────────────────────────────────────────────────────
// Mia Persona Config — unit tests
// Sprint C-1.2
//
// Tests verify:
//   1. Required config fields are present and correct
//   2. Decision rules fire correctly against real UserGraph mocks
//   3. Rule IDs are unique
//   4. Safety rules are properly defined
//
// Uses DecisionEngineImpl directly for integration-style rule evaluation.
// All graphs are pure in-memory objects — no I/O, no network.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'

import { DecisionEngineImpl }  from '../../brain/decision-engine'
import { MIA_PERSONA_CONFIG }  from '../mia'
import type { UserGraph }      from '../../../graph/types'

// ── Graph factory ─────────────────────────────────────────────────────────────

function makeGraph(overrides: Partial<UserGraph> = {}): UserGraph {
  const ts = new Date().toISOString()
  const base: UserGraph = {
    userId:    'test-user',
    createdAt: ts,
    updatedAt: ts,
    version:   1,
    identity:  {
      name: 'Alex', userType: 'authenticated', language: 'en',
      timezone: null, age: null, updatedAt: ts, confidence: 'inferred',
    },
    goals:        { items: [], updatedAt: ts, confidence: 'stated' },
    habits:       { items: [], updatedAt: ts, confidence: 'stated' },
    assessments:  { items: [], updatedAt: ts, confidence: 'inferred' },
    journey:      {
      activeCluster: null, currentPhase: null, progress: null,
      completedSteps: [], updatedAt: ts, confidence: 'inferred',
    },
    coachMemory:  {
      facts: [], communicationStyle: null, preferredTopics: [],
      updatedAt: ts, confidence: 'inferred',
    },
    preferences:  {
      language: 'en', responseLength: null, notificationsEnabled: true,
      updatedAt: ts, confidence: 'inferred',
    },
    retention:    {
      daysSinceActive: 0, dormancyLevel: 'none', lastReminderFiredAt: null,
      updatedAt: ts, confidence: 'inferred',
    },
    premium:      { tier: 'free', quotaUsedToday: 0, quotaLimit: 5, updatedAt: ts, confidence: 'inferred' },
    dailyHistory: { entries: [], updatedAt: ts, confidence: 'inferred' },
  }
  return { ...base, ...overrides }
}

/** Build a DailyHistoryEntry date string N days ago from today. */
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)   // 'YYYY-MM-DD'
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MIA_PERSONA_CONFIG', () => {

  // ── Config structure ───────────────────────────────────────────────────────

  describe('config fields', () => {
    it('has required top-level identity fields', () => {
      expect(MIA_PERSONA_CONFIG.coachId).toBe('mia')
      expect(MIA_PERSONA_CONFIG.coachName).toBe('Mia')
      expect(MIA_PERSONA_CONFIG.cluster).toBeTruthy()
    })

    it('has personality with all required keys', () => {
      const { personality } = MIA_PERSONA_CONFIG
      expect(personality.tone).toBe('warm_direct')
      expect(personality.style).toBe('coaching')
      expect(personality.languageLevel).toBeTruthy()
      expect(personality.emojiPolicy).toBeTruthy()
    })

    it('has toneByPhase with all 5 required phases', () => {
      const { toneByPhase } = MIA_PERSONA_CONFIG
      expect(toneByPhase.onboarding.key).toBeTruthy()
      expect(toneByPhase.firstWeek.key).toBeTruthy()
      expect(toneByPhase.firstMonth.key).toBeTruthy()
      expect(toneByPhase.transformation.key).toBeTruthy()
      expect(toneByPhase.partnership.key).toBeTruthy()
      // instructions must be non-empty strings
      expect(toneByPhase.onboarding.instruction.length).toBeGreaterThan(10)
    })

    it('has all required videoTemplates', () => {
      const vt = MIA_PERSONA_CONFIG.videoTemplates
      expect(vt.morning).toBeTruthy()
      expect(vt.evening).toBeTruthy()
      expect(vt.intervention.L1).toBeTruthy()
      expect(vt.intervention.L2).toBeTruthy()
      expect(vt.intervention.L3).toBeTruthy()
      expect(vt.intervention.L4).toBeTruthy()
      expect(vt.intervention.L5).toBeTruthy()
      expect(vt.milestone).toBeTruthy()
      expect(vt.celebration).toBeTruthy()
      expect(vt.weekReview).toBeTruthy()
      expect(vt.monthReview).toBeTruthy()
    })

    it('video templates have positive maxDuration and non-empty structure', () => {
      const { morning, evening, milestone, weekReview } = MIA_PERSONA_CONFIG.videoTemplates
      for (const tpl of [morning, evening, milestone, weekReview]) {
        expect(tpl.maxDuration).toBeGreaterThan(0)
        expect(tpl.structure.length).toBeGreaterThan(0)
      }
    })

    it('has domainConfig with required fields', () => {
      const { domainConfig } = MIA_PERSONA_CONFIG
      expect(domainConfig.primaryMetric).toBeTruthy()
      expect(domainConfig.secondaryMetrics.length).toBeGreaterThan(0)
      expect(domainConfig.taskCategories.length).toBeGreaterThan(0)
      expect(domainConfig.interventionThresholds.skipDaysL1).toBeGreaterThan(0)
      expect(domainConfig.interventionThresholds.skipDaysL2).toBeGreaterThan(
        domainConfig.interventionThresholds.skipDaysL1,
      )
    })

    it('safetyRules.neverMentionTopics is non-empty', () => {
      expect(MIA_PERSONA_CONFIG.safetyRules.neverMentionTopics.length).toBeGreaterThan(0)
    })

    it('safetyRules.escalateToHuman is non-empty', () => {
      expect(MIA_PERSONA_CONFIG.safetyRules.escalateToHuman.length).toBeGreaterThan(0)
    })

    it('safetyRules.escalateToHuman includes mental_health_crisis', () => {
      expect(MIA_PERSONA_CONFIG.safetyRules.escalateToHuman).toContain('mental_health_crisis')
    })

    it('safetyRules.escalateToHuman includes eating_disorder_signs', () => {
      expect(MIA_PERSONA_CONFIG.safetyRules.escalateToHuman).toContain('eating_disorder_signs')
    })
  })

  // ── Rule uniqueness ────────────────────────────────────────────────────────

  describe('rule IDs', () => {
    it('all rules have unique IDs', () => {
      const ids    = MIA_PERSONA_CONFIG.decisionRules.map(r => r.ruleId)
      const unique = new Set(ids)
      expect(unique.size).toBe(ids.length)
    })

    it('has at least 8 decision rules', () => {
      expect(MIA_PERSONA_CONFIG.decisionRules.length).toBeGreaterThanOrEqual(8)
    })

    it('all rules have a numeric priority', () => {
      for (const rule of MIA_PERSONA_CONFIG.decisionRules) {
        expect(typeof rule.priority).toBe('number')
      }
    })
  })

  // ── Rule evaluation via DecisionEngineImpl ─────────────────────────────────

  describe('decision rule evaluation', () => {
    const engine = new DecisionEngineImpl()

    // ── new_user_welcome ─────────────────────────────────────────────────────

    it('new_user_welcome fires for a brand-new user with empty assessments', async () => {
      const graph     = makeGraph()  // assessments.items = []
      const decisions = await engine.evaluate(graph, MIA_PERSONA_CONFIG, 'test-user', 'test')

      expect(decisions).toHaveLength(1)
      expect(decisions[0]!.firedRuleId).toBe('new_user_welcome')
    })

    it('new_user_welcome does NOT fire when assessments exist', async () => {
      const ts    = new Date().toISOString()
      const graph = makeGraph({
        assessments: {
          items: [
            { clusterId: 'weight', score: 65, confidence: 'established', assessedAt: ts },
          ],
          updatedAt: ts, confidence: 'confirmed',
        },
      })
      const decisions = await engine.evaluate(graph, MIA_PERSONA_CONFIG, 'test-user', 'test')

      // new_user_welcome must NOT be the winner; some other rule fires instead
      expect(decisions[0]!.firedRuleId).not.toBe('new_user_welcome')
    })

    // ── sleep_poor ───────────────────────────────────────────────────────────

    it('sleep_poor fires when sleep assessment score is below 40', async () => {
      const ts    = new Date().toISOString()
      const graph = makeGraph({
        assessments: {
          items: [
            // A non-sleep assessment (so new_user_welcome doesn't fire)
            { clusterId: 'weight', score: 70, confidence: 'established', assessedAt: ts },
            // Sleep assessment with low score
            { clusterId: 'sleep',  score: 30, confidence: 'established', assessedAt: ts },
          ],
          updatedAt: ts, confidence: 'confirmed',
        },
      })
      const decisions = await engine.evaluate(graph, MIA_PERSONA_CONFIG, 'test-user', 'morning')

      expect(decisions).toHaveLength(1)
      expect(decisions[0]!.firedRuleId).toBe('sleep_poor')
      expect(decisions[0]!.interventionLevel).toBe(2)
    })

    it('sleep_poor does NOT fire when sleep score is 40 or above', async () => {
      const ts    = new Date().toISOString()
      const graph = makeGraph({
        assessments: {
          items: [
            { clusterId: 'weight', score: 70, confidence: 'established', assessedAt: ts },
            { clusterId: 'sleep',  score: 60, confidence: 'established', assessedAt: ts },
          ],
          updatedAt: ts, confidence: 'confirmed',
        },
      })
      const decisions = await engine.evaluate(graph, MIA_PERSONA_CONFIG, 'test-user', 'morning')

      const firedId = decisions[0]?.firedRuleId ?? null
      expect(firedId).not.toBe('sleep_poor')
    })

    // ── missed_checkin_3days ─────────────────────────────────────────────────

    it('missed_checkin_3days fires after 3 consecutive missed days', async () => {
      const ts    = new Date().toISOString()
      const graph = makeGraph({
        assessments: {
          items: [{ clusterId: 'weight', score: 70, confidence: 'established', assessedAt: ts }],
          updatedAt: ts, confidence: 'confirmed',
        },
        dailyHistory: {
          entries: [
            {
              date: daysAgo(3), morningVideoWatched: false, eveningCheckinDone: false,
              tasksAssigned: [], tasksCompleted: [],
              moodValue: null, moodContext: null, energyValue: null, energyContext: null,
              notes: null, videoWatchDuration: null,
            },
            {
              date: daysAgo(2), morningVideoWatched: false, eveningCheckinDone: false,
              tasksAssigned: [], tasksCompleted: [],
              moodValue: null, moodContext: null, energyValue: null, energyContext: null,
              notes: null, videoWatchDuration: null,
            },
            {
              date: daysAgo(1), morningVideoWatched: false, eveningCheckinDone: false,
              tasksAssigned: [], tasksCompleted: [],
              moodValue: null, moodContext: null, energyValue: null, energyContext: null,
              notes: null, videoWatchDuration: null,
            },
          ],
          updatedAt: ts, confidence: 'inferred',
        },
      })

      const decisions = await engine.evaluate(graph, MIA_PERSONA_CONFIG, 'test-user', 'morning')
      expect(decisions).toHaveLength(1)
      expect(decisions[0]!.firedRuleId).toBe('missed_checkin_3days')
      expect(decisions[0]!.interventionLevel).toBe(1)
    })

    // ── morning_routine_default ──────────────────────────────────────────────

    it('morning_routine_default catches all as fallback with low priority', async () => {
      // User with assessment (no new_user_welcome) but no other conditions triggered
      const ts    = new Date().toISOString()
      const graph = makeGraph({
        assessments: {
          items: [
            { clusterId: 'weight', score: 70, confidence: 'established', assessedAt: ts },
            { clusterId: 'sleep',  score: 75, confidence: 'established', assessedAt: ts },
          ],
          updatedAt: ts, confidence: 'confirmed',
        },
        dailyHistory: {
          entries: [
            // One recent check-in today — consecutive missed = 0, no missed days
            {
              date: daysAgo(0), morningVideoWatched: true, eveningCheckinDone: true,
              tasksAssigned: ['t1'], tasksCompleted: ['t1'],
              moodValue: 4, moodContext: 'evening', energyValue: 4, energyContext: 'evening',
              notes: null, videoWatchDuration: 55,
            },
          ],
          updatedAt: ts, confidence: 'inferred',
        },
      })

      const decisions = await engine.evaluate(graph, MIA_PERSONA_CONFIG, 'test-user', 'morning')
      expect(decisions).toHaveLength(1)
      // morning_routine_default has priority 10 — it's the last fallback
      expect(decisions[0]!.firedRuleId).toBe('morning_routine_default')
      expect(decisions[0]!.scriptType).toBe('morning_standard')
    })

    // ── good_progress_week ───────────────────────────────────────────────────

    it('good_progress_week fires when user has 5+ check-ins this week and good mood', async () => {
      const ts    = new Date().toISOString()
      // Build 6 days of solid check-ins with high mood
      const entries = Array.from({ length: 6 }, (_, i) => ({
        date:               daysAgo(6 - i),
        morningVideoWatched: true,
        eveningCheckinDone:  true,
        tasksAssigned:      ['t1'],
        tasksCompleted:     ['t1'],
        moodValue:          4 as number | null,
        moodContext:        'evening' as const,
        energyValue:        4 as number | null,
        energyContext:      'evening' as const,
        notes:              null,
        videoWatchDuration: 55,
      }))

      const graph = makeGraph({
        assessments: {
          items: [{ clusterId: 'weight', score: 70, confidence: 'established', assessedAt: ts }],
          updatedAt: ts, confidence: 'confirmed',
        },
        dailyHistory: { entries, updatedAt: ts, confidence: 'inferred' },
      })

      const decisions = await engine.evaluate(graph, MIA_PERSONA_CONFIG, 'test-user', 'morning')
      expect(decisions).toHaveLength(1)
      expect(decisions[0]!.firedRuleId).toBe('good_progress_week')
      expect(decisions[0]!.scriptType).toBe('celebration')
    })
  })
})
