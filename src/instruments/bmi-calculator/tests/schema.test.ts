import { describe, it, expect } from 'vitest'
import { getSEOMetadata, getStructuredData } from '../seo.js'

describe('BMI Calculator — SEO schemas', () => {
  it('English title is 40–65 characters', () => {
    const meta = getSEOMetadata('en')
    expect(meta.title.length).toBeGreaterThanOrEqual(40)
    expect(meta.title.length).toBeLessThanOrEqual(65)
  })

  it('English description is 120–160 characters', () => {
    const meta = getSEOMetadata('en')
    expect(meta.description.length).toBeGreaterThanOrEqual(120)
    expect(meta.description.length).toBeLessThanOrEqual(160)
  })

  it('structured data is valid JSON (≥ 3 schemas)', () => {
    const schemas = getStructuredData('en')
    expect(() => JSON.stringify(schemas)).not.toThrow()
    expect(schemas.length).toBeGreaterThanOrEqual(3)
  })

  it('FAQPage has ≥ 5 questions with non-empty answers', () => {
    const schemas = getStructuredData('en')
    const faq = schemas.find((s) => s['@type'] === 'FAQPage')
    expect(faq).toBeDefined()
    const questions = (faq as { mainEntity: Array<{ acceptedAnswer: { text: string } }> }).mainEntity
    expect(questions.length).toBeGreaterThanOrEqual(5)
    for (const q of questions) {
      expect(q.acceptedAnswer.text.length).toBeGreaterThan(20)
    }
  })

  it('hreflang covers en, es, pt, and x-default', () => {
    const meta = getSEOMetadata('en')
    expect(meta.alternates['en']).toBeDefined()
    expect(meta.alternates['es']).toBeDefined()
    expect(meta.alternates['pt']).toBeDefined()
    expect(meta.alternates['x-default']).toBeDefined()
  })
})
