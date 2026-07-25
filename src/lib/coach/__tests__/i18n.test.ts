import { describe, it, expect } from 'vitest'
import { getClusterLabel, getTypeLabel } from '../coach-i18n'
import { getCoachCopy } from '../coach-copy'

describe('getClusterLabel', () => {
  it('returns English label for EN', () => {
    expect(getClusterLabel('weight', 'en')).toBe('Weight')
    expect(getClusterLabel('mental_health', 'en')).toBe('Mental Health')
  })

  it('returns Spanish label for ES', () => {
    expect(getClusterLabel('weight', 'es')).toBe('Peso')
    expect(getClusterLabel('finance', 'es')).toBe('Finanzas')
  })

  it('falls back to English for unsupported locale', () => {
    expect(getClusterLabel('sleep', 'de')).toBe('Sleep')
  })

  it('falls back to cluster id if no label found', () => {
    expect(getClusterLabel('unknown_cluster', 'en')).toBe('unknown_cluster')
  })
})

describe('getTypeLabel', () => {
  it('returns English labels', () => {
    expect(getTypeLabel('insight', 'en')).toBe('Coach insight')
    expect(getTypeLabel('celebration', 'en')).toBe('Well done')
    expect(getTypeLabel('preparation', 'en')).toBe('Next up')
  })

  it('returns Spanish labels', () => {
    expect(getTypeLabel('insight', 'es')).toBe('Perspectiva del coach')
    expect(getTypeLabel('celebration', 'es')).toBe('Bien hecho')
  })

  it('falls back to English for unsupported locale', () => {
    expect(getTypeLabel('warning', 'de')).toBe('Heads up')
  })
})

describe('getCoachCopy — locale merging', () => {
  it('EN returns all templates', () => {
    const copy = getCoachCopy('en')
    expect(copy.excellent_score).toBeDefined()
    expect(copy.on_track).toBeDefined()
    expect(copy.off_track).toBeDefined()
    expect(copy.milestone_approaching).toBeDefined()
  })

  it('ES overrides excellent_score with Spanish title', () => {
    const copy = getCoachCopy('es')
    expect(copy.excellent_score!.title).toContain('Base sólida')
  })

  it('ES falls back to EN for non-translated templates', () => {
    const copy = getCoachCopy('es')
    expect(copy.on_track!.title).toContain('Week')  // EN fallback
  })

  it('unsupported locale falls back fully to EN', () => {
    const copy = getCoachCopy('de')
    expect(copy.excellent_score!.title).toContain('Strong foundation')
  })
})
