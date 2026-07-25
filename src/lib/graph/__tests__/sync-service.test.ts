import { describe, it, expect } from 'vitest'
import { AssessmentGraphSync } from '../sync-service'
import { GraphRepository } from '../repository'
import { GraphUpdater } from '../updater'
import { MemoryProvider } from '../../user/storage'
import type { AssessmentResult } from '../../assessment/types'

// ── Fixture ───────────────────────────────────────────────────────────────────

function makeResult(overrides: Partial<AssessmentResult> = {}): AssessmentResult {
  return {
    assessment_id:    'weight-assessment-u1-001',
    cluster:          'weight',
    config_id:        'weight-assessment',
    config_version:   1,
    overall_score:    68,
    confidence:       'established',
    dimension_scores: [
      { dimension_id: 'body_composition', label: 'Body Composition', score: 70, weight: 0.35, confidence: 'established', contributing_signals: ['bmi'] },
      { dimension_id: 'metabolism',       label: 'Metabolism',       score: 60, weight: 0.30, confidence: 'preliminary', contributing_signals: [] },
    ],
    insights: [
      { id: 'i1', type: 'warning',     priority: 1, title: 'Low metabolic rate detected', body: 'Your metabolism is running slow.' },
      { id: 'i2', type: 'opportunity', priority: 1, title: 'Morning routine could boost results', body: 'Start your day earlier.' },
      { id: 'i3', type: 'achievement', priority: 2, title: 'Good baseline', body: 'You have a solid foundation.' },
    ],
    narrative: {
      headline:            'Room for improvement',
      profile_type:        'Metabolically Slow',
      profile_description: 'Your metabolism needs attention.',
      key_points:          [],
      cta_label:           'Start weight journey',
      cta_product_id:      'weight-journey',
    },
    completed_at: '2026-07-24T10:00:00.000Z',
    lang: 'en',
    ...overrides,
  }
}

function makeSync() {
  const repo    = new GraphRepository(new MemoryProvider())
  const updater = new GraphUpdater(repo)
  const sync    = new AssessmentGraphSync(updater)
  repo.getOrCreate('u1')
  return { sync, repo }
}

// ── AssessmentGraphSync ───────────────────────────────────────────────────────

describe('AssessmentGraphSync', () => {
  it('returns updated=true on successful sync', () => {
    const { sync } = makeSync()
    const result = sync.sync('u1', makeResult())
    expect(result.updated).toBe(true)
    expect(result.clusterId).toBe('weight')
  })

  it('skips sync when confidence is insufficient', () => {
    const { sync } = makeSync()
    const result = sync.sync('u1', makeResult({ confidence: 'insufficient' }))
    expect(result.updated).toBe(false)
    expect(result.skippedReason).toBe('insufficient_data')
  })

  it('updates assessment node with correct score and confidence', () => {
    const { sync, repo } = makeSync()
    sync.sync('u1', makeResult({ overall_score: 72, confidence: 'established' }))
    const graph = repo.get('u1')!
    expect(graph.assessments.items).toHaveLength(1)
    expect(graph.assessments.items[0]!.score).toBe(72)
    expect(graph.assessments.items[0]!.clusterId).toBe('weight')
    expect(graph.assessments.items[0]!.confidence).toBe('established')
  })

  it('maps score < 60 → planning phase in journey', () => {
    const { sync, repo } = makeSync()
    sync.sync('u1', makeResult({ overall_score: 55 }))
    expect(repo.get('u1')!.journey.currentPhase).toBe('planning')
  })

  it('maps score 60–79 → action phase in journey', () => {
    const { sync, repo } = makeSync()
    sync.sync('u1', makeResult({ overall_score: 68 }))
    expect(repo.get('u1')!.journey.currentPhase).toBe('action')
  })

  it('maps score ≥ 80 → maintenance phase in journey', () => {
    const { sync, repo } = makeSync()
    sync.sync('u1', makeResult({ overall_score: 85, confidence: 'comprehensive' }))
    expect(repo.get('u1')!.journey.currentPhase).toBe('maintenance')
  })

  it('sets activeCluster on journey', () => {
    const { sync, repo } = makeSync()
    sync.sync('u1', makeResult())
    expect(repo.get('u1')!.journey.activeCluster).toBe('weight')
  })

  it('resets journey progress to 0', () => {
    const { sync, repo } = makeSync()
    sync.sync('u1', makeResult())
    expect(repo.get('u1')!.journey.progress).toBe(0)
  })

  it('creates a goal from top opportunity insight', () => {
    const { sync, repo } = makeSync()
    sync.sync('u1', makeResult())
    const goals = repo.get('u1')!.goals.items
    expect(goals).toHaveLength(1)
    expect(goals[0]!.text).toBe('Morning routine could boost results')
    expect(goals[0]!.status).toBe('active')
  })

  it('marks goal priority high when score < 60', () => {
    const { sync, repo } = makeSync()
    sync.sync('u1', makeResult({ overall_score: 45 }))
    expect(repo.get('u1')!.goals.items[0]!.priority).toBe('high')
  })

  it('marks goal priority medium when score ≥ 60', () => {
    const { sync, repo } = makeSync()
    sync.sync('u1', makeResult({ overall_score: 68 }))
    expect(repo.get('u1')!.goals.items[0]!.priority).toBe('medium')
  })

  it('stores warning insights as high-importance memory facts', () => {
    const { sync, repo } = makeSync()
    sync.sync('u1', makeResult())
    const facts = repo.get('u1')!.coachMemory.facts
    const warning = facts.find(f => f.text === 'Your metabolism is running slow.')
    expect(warning).toBeDefined()
    expect(warning!.importance).toBe('high')
  })

  it('sets communication style supportive when score < 40 or has priority-1 warning', () => {
    const { sync, repo } = makeSync()
    sync.sync('u1', makeResult())          // has priority-1 warning
    expect(repo.get('u1')!.coachMemory.communicationStyle).toBe('supportive')
  })

  it('sets communication style direct when score ≥ 80 with achievements', () => {
    const { sync, repo } = makeSync()
    sync.sync('u1', makeResult({
      overall_score: 85,
      confidence:    'comprehensive',
      insights: [
        { id: 'a1', type: 'achievement', priority: 1, title: 'Excellent BMI', body: 'Optimal body composition.' },
      ],
    }))
    expect(repo.get('u1')!.coachMemory.communicationStyle).toBe('direct')
  })

  it('reports correct changedFields', () => {
    const { sync } = makeSync()
    const result = sync.sync('u1', makeResult())
    expect(result.changedFields).toContain('assessments')
    expect(result.changedFields).toContain('journey')
    expect(result.changedFields).toContain('goals')
    expect(result.changedFields).toContain('coachMemory.facts')
    expect(result.changedFields).toContain('coachMemory.communicationStyle')
  })

  it('re-syncing updates rather than duplicates the assessment', () => {
    const { sync, repo } = makeSync()
    sync.sync('u1', makeResult({ overall_score: 60 }))
    sync.sync('u1', makeResult({ overall_score: 75 }))
    expect(repo.get('u1')!.assessments.items).toHaveLength(1)
    expect(repo.get('u1')!.assessments.items[0]!.score).toBe(75)
  })
})
