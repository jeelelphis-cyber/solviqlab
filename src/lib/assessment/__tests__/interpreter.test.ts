import { describe, it, expect } from 'vitest'
import { AssessmentInterpreter } from '../interpreter'
import type { AssessmentResult } from '../types'

function makeResult(overrides: Partial<AssessmentResult> = {}): AssessmentResult {
  return {
    assessment_id:    'w-001',
    cluster:          'weight',
    config_id:        'weight-assessment',
    config_version:   1,
    overall_score:    68,
    confidence:       'established',
    dimension_scores: [],
    insights: [
      { id: 'i1', type: 'warning',     priority: 1, title: 'High BMI', body: 'Your BMI is elevated.' },
      { id: 'i2', type: 'opportunity', priority: 1, title: 'Try HIIT',  body: 'HIIT burns more calories.' },
    ],
    narrative: {
      headline:            'Fair',
      profile_type:        'Overweight',
      profile_description: '',
      key_points:          [],
      cta_label:           'Start weight journey',
      cta_product_id:      'weight-journey',
    },
    completed_at: '2026-07-24T10:00:00.000Z',
    lang: 'en',
    ...overrides,
  }
}

describe('AssessmentInterpreter', () => {
  const interpreter = new AssessmentInterpreter()

  it('returns null for insufficient confidence', () => {
    expect(interpreter.interpret(makeResult({ confidence: 'insufficient' }))).toBeNull()
  })

  it('sets clusterId from result.cluster', () => {
    expect(interpreter.interpret(makeResult())!.clusterId).toBe('weight')
  })

  it('maps score < 40 → awareness phase', () => {
    expect(interpreter.interpret(makeResult({ overall_score: 30 }))!.phase).toBe('awareness')
  })

  it('maps score 40–59 → planning phase', () => {
    expect(interpreter.interpret(makeResult({ overall_score: 50 }))!.phase).toBe('planning')
  })

  it('maps score 60–79 → action phase', () => {
    expect(interpreter.interpret(makeResult({ overall_score: 68 }))!.phase).toBe('action')
  })

  it('maps score ≥ 80 → maintenance phase', () => {
    expect(interpreter.interpret(makeResult({ overall_score: 82 }))!.phase).toBe('maintenance')
  })

  it('maps preliminary confidence correctly', () => {
    expect(interpreter.interpret(makeResult({ confidence: 'preliminary' }))!.assessmentConfidence).toBe('preliminary')
  })

  it('maps comprehensive → confirmed', () => {
    expect(interpreter.interpret(makeResult({ confidence: 'comprehensive' }))!.assessmentConfidence).toBe('confirmed')
  })

  it('picks opportunity insight as goal text', () => {
    const spec = interpreter.interpret(makeResult())!
    expect(spec.goals[0]!.text).toBe('Try HIIT')
  })

  it('falls back to profile_type when no opportunity insight', () => {
    const spec = interpreter.interpret(makeResult({
      insights: [{ id: 'i1', type: 'warning', priority: 1, title: 'High BMI', body: 'Body.' }],
    }))!
    expect(spec.goals[0]!.text).toBe('Overweight')
  })

  it('includes warning insights as memory facts', () => {
    const spec = interpreter.interpret(makeResult())!
    const warning = spec.memoryFacts.find(f => f.text === 'Your BMI is elevated.')
    expect(warning).toBeDefined()
    expect(warning!.importance).toBe('high')
    expect(warning!.category).toBe('belief')
  })

  it('sets supportive style when there is a priority-1 warning', () => {
    expect(interpreter.interpret(makeResult())!.communicationStyle).toBe('supportive')
  })

  it('sets direct style for high score with achievements', () => {
    const spec = interpreter.interpret(makeResult({
      overall_score: 85,
      insights: [{ id: 'a1', type: 'achievement', priority: 1, title: 'Great!', body: 'Excellent.' }],
    }))!
    expect(spec.communicationStyle).toBe('direct')
  })

  it('sets analytical style for mid-range score without warnings', () => {
    const spec = interpreter.interpret(makeResult({
      overall_score: 65,
      insights: [{ id: 'o1', type: 'opportunity', priority: 1, title: 'Improve sleep', body: 'Sleep more.' }],
    }))!
    expect(spec.communicationStyle).toBe('analytical')
  })
})
