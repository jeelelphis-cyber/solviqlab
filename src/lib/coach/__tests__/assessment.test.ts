import { describe, it, expect } from 'vitest'
import { handleAssessmentCompleted } from '../handlers/assessment'
import type { IntentState } from '../../domain/intent-state'
import type { AssessmentResult } from '../../assessment/types'

function makeIntent(overrides: Partial<AssessmentResult> = {}): IntentState {
  const assessment: AssessmentResult = {
    assessment_id:    'weight-assessment-test-1',
    cluster:          'weight',
    config_id:        'weight-v1',
    config_version:   1,
    overall_score:    72,
    confidence:       'established',
    dimension_scores: [
      { dimension_id: 'bmi',      label: 'BMI',      score: 80, weight: 0.4 },
      { dimension_id: 'activity', label: 'Activity', score: 55, weight: 0.3 },
      { dimension_id: 'diet',     label: 'Diet',     score: 70, weight: 0.3 },
    ],
    insights:  [],
    narrative: {
      headline:            'Good foundation',
      profile_type:        null,
      profile_description: null,
      summary:             'You are in good shape.',
      key_points:          [],
      cta_label:           'Build My Plan',
      cta_product_id:      'weight-plan',
    },
    completed_at: new Date().toISOString(),
    lang:         'en',
    ...overrides,
  }

  return {
    userId:                  'user-test',
    clusterId:               'weight',
    createdAt:               new Date().toISOString(),
    updatedAt:               new Date().toISOString(),
    completedInstruments:    [],
    latestAssessment:        assessment,
    latestStrategy:          null,
    activePlan:              null,
    primaryGoal:             null,
    currentPhase:            'planning',
    lastActiveAt:            new Date().toISOString(),
    recommendationDecision:  null,
  }
}

describe('handleAssessmentCompleted', () => {
  it('returns null when no assessment', () => {
    const intent = { ...makeIntent(), latestAssessment: null }
    expect(handleAssessmentCompleted(intent)).toBeNull()
  })

  it('returns excellent_score reason for score >= 80', () => {
    const intent = makeIntent({ overall_score: 85 })
    const rec = handleAssessmentCompleted(intent)
    expect(rec).not.toBeNull()
    expect(rec!.decision.reason).toBe('excellent_score')
    expect(rec!.priority).toBe('high')
    expect(rec!.type).toBe('insight')
  })

  it('returns good_score reason for score 60-79', () => {
    const intent = makeIntent({ overall_score: 72 })
    const rec = handleAssessmentCompleted(intent)
    expect(rec!.decision.reason).toBe('good_score')
    expect(rec!.priority).toBe('normal')
  })

  it('returns missing_dimension reason for score < 60 with dimensions', () => {
    const intent = makeIntent({
      overall_score:    45,
      dimension_scores: [
        { dimension_id: 'bmi',      label: 'BMI',      score: 40, weight: 0.5 },
        { dimension_id: 'activity', label: 'Activity', score: 60, weight: 0.5 },
      ],
    })
    const rec = handleAssessmentCompleted(intent)
    expect(rec!.decision.reason).toBe('missing_dimension')
    expect(rec!.priority).toBe('normal')
    expect(rec!.data.dimension).toBe('BMI')
    expect(rec!.type).toBe('explanation')
  })

  it('returns low_score for score < 60 with no dimensions', () => {
    const intent = makeIntent({ overall_score: 30, dimension_scores: [] })
    const rec = handleAssessmentCompleted(intent)
    expect(rec!.decision.reason).toBe('low_score')
  })

  it('includes coach_version and generated_at', () => {
    const rec = handleAssessmentCompleted(makeIntent())
    expect(rec!.coach_version).toBeTruthy()
    expect(rec!.generated_at).toBeTruthy()
  })

  it('does not embed cluster_label in data (renderer injects it from i18n)', () => {
    const rec = handleAssessmentCompleted(makeIntent())
    expect((rec!.data as Record<string, unknown>).cluster_label).toBeUndefined()
  })

  it('sets trigger to assessment:completed', () => {
    const rec = handleAssessmentCompleted(makeIntent())
    expect(rec!.decision.trigger).toBe('assessment:completed')
  })
})
