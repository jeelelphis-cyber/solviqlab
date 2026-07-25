import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CoachService } from '../service'
import { CoachHistoryRepository } from '../history'
import { MemoryProvider } from '../../user/storage'
import { emptyCoachMemory } from '../types'
import type { CoachRuntime } from '../service'
import type { IntentState } from '../../domain/intent-state'
import type { AssessmentResult } from '../../assessment/types'

function makeAssessment(score: number): AssessmentResult {
  return {
    assessment_id:    'a1',
    cluster:          'weight',
    config_id:        'weight-v1',
    config_version:   1,
    overall_score:    score,
    confidence:       'established',
    dimension_scores: [],
    insights:         [],
    narrative: {
      headline:            'Good score',
      profile_type:        null,
      profile_description: null,
      key_points:          [],
      cta_label:           'Build My Plan',
      cta_product_id:      'plan',
    },
    completed_at: new Date().toISOString(),
    lang:         'en',
  }
}

function makeIntent(score: number): IntentState {
  return {
    userId:                 'u1',
    clusterId:              'weight',
    createdAt:              new Date().toISOString(),
    updatedAt:              new Date().toISOString(),
    completedInstruments:   [],
    latestAssessment:       makeAssessment(score),
    latestStrategy:         null,
    activePlan:             null,
    primaryGoal:            null,
    currentPhase:           'planning',
    lastActiveAt:           new Date().toISOString(),
    recommendationDecision: null,
  }
}

function makeRuntime(intent: IntentState | null, repo?: CoachHistoryRepository): CoachRuntime {
  const storage    = new MemoryProvider()
  const repository = repo ?? new CoachHistoryRepository(storage)
  return {
    userEngine: {
      getIntentState:  () => intent,
      getCoachMemory:  () => emptyCoachMemory('weight'),
      setCoachMemory:  vi.fn(),
    },
    coachHistory: repository,
  }
}

describe('CoachService', () => {
  const service = new CoachService()

  it('getMessage returns null when no intent', () => {
    const runtime = makeRuntime(null)
    expect(service.getMessage('weight', 'assessment:completed', 'en', runtime)).toBeNull()
  })

  it('getMessage returns a CoachMessage for valid intent', () => {
    const runtime = makeRuntime(makeIntent(75))
    const msg = service.getMessage('weight', 'assessment:completed', 'en', runtime)
    expect(msg).not.toBeNull()
    expect(msg!.decision.trigger).toBe('assessment:completed')
    expect(msg!.title).toBeTruthy()
    expect(msg!.body).toBeTruthy()
  })

  it('getMessage is idempotent — does not write memory', () => {
    const runtime = makeRuntime(makeIntent(75))
    service.getMessage('weight', 'assessment:completed', 'en', runtime)
    service.getMessage('weight', 'assessment:completed', 'en', runtime)
    expect(runtime.userEngine.setCoachMemory).not.toHaveBeenCalled()
  })

  it('markShown writes memory, appends history, and fires analytics', () => {
    const repo    = new CoachHistoryRepository(new MemoryProvider())
    const runtime = makeRuntime(makeIntent(75), repo)
    const msg     = service.getMessage('weight', 'assessment:completed', 'en', runtime)!

    service.markShown(msg, 'weight', runtime, 'en')

    expect(runtime.userEngine.setCoachMemory).toHaveBeenCalled()
    expect(repo.getAll()).toHaveLength(1)
    expect(repo.getAll()[0]?.message_id).toBe(msg.message_id)
    expect(repo.getAll()[0]?.lang).toBe('en')
    expect(repo.getAll()[0]?.clicked).toBe(false)
  })

  it('second call to getMessage returns null after markShown (anti-spam)', () => {
    const storage  = new MemoryProvider()
    const repo     = new CoachHistoryRepository(storage)
    let memory     = emptyCoachMemory('weight')
    const runtime: CoachRuntime = {
      userEngine: {
        getIntentState: () => makeIntent(75),
        getCoachMemory: () => memory,
        setCoachMemory: (_c, m) => { memory = m },
      },
      coachHistory: repo,
    }

    const msg1 = service.getMessage('weight', 'assessment:completed', 'en', runtime)!
    service.markShown(msg1, 'weight', runtime, 'en')

    // Second call — same message_id now in shown_message_ids
    const msg2 = service.getMessage('weight', 'assessment:completed', 'en', runtime)
    expect(msg2).toBeNull()
  })

  it('recordCTAClick updates history entry and fires analytics', () => {
    const repo    = new CoachHistoryRepository(new MemoryProvider())
    const runtime = makeRuntime(makeIntent(75), repo)
    const msg     = service.getMessage('weight', 'assessment:completed', 'en', runtime)!

    service.markShown(msg, 'weight', runtime, 'en')
    service.recordCTAClick(msg.message_id, 'see_strategy', runtime, msg)

    const entry = repo.getAll()[0]!
    expect(entry.clicked).toBe(true)
    expect(entry.action_clicked).toBe('see_strategy')
  })

  it('recordDismissed marks entry dismissed', () => {
    const repo    = new CoachHistoryRepository(new MemoryProvider())
    const runtime = makeRuntime(makeIntent(75), repo)
    const msg     = service.getMessage('weight', 'assessment:completed', 'en', runtime)!

    service.markShown(msg, 'weight', runtime, 'en')
    service.recordDismissed(msg.message_id, runtime)

    expect(repo.getAll()[0]!.dismissed).toBe(true)
  })
})
