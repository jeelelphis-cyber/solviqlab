import { describe, it, expect } from 'vitest'
import { getSEOMetadata, getStructuredData } from '../seo.js'

describe('Percentage Calculator — SEO schemas', () => {
  it('metadata has correct title length (40–65 chars)', () => {
    const meta = getSEOMetadata('en')
    expect(meta.title.length).toBeGreaterThanOrEqual(40)
    expect(meta.title.length).toBeLessThanOrEqual(65)
  })

  it('metadata has correct description length (120–160 chars)', () => {
    const meta = getSEOMetadata('en')
    expect(meta.description.length).toBeGreaterThanOrEqual(120)
    expect(meta.description.length).toBeLessThanOrEqual(160)
  })

  it('structured data is valid JSON', () => {
    const schemas = getStructuredData('en')
    expect(() => JSON.stringify(schemas)).not.toThrow()
    expect(schemas.length).toBeGreaterThanOrEqual(3)
  })

  it('FAQPage has ≥ 5 questions', () => {
    const schemas = getStructuredData('en')
    const faq = schemas.find((s) => s['@type'] === 'FAQPage')
    expect(faq).toBeDefined()
    const questions = (faq as unknown as { mainEntity: unknown[] }).mainEntity
    expect(questions.length).toBeGreaterThanOrEqual(5)
  })
})
