import { describe, it, expect } from 'vitest'
import { PregnancyInputSchema } from '../lib/validate.js'

describe('PregnancyInputSchema — valid inputs', () => {
  it('accepts lmp method with valid date', () => {
    const result = PregnancyInputSchema.safeParse({ method: 'lmp', date: '2025-01-01' })
    expect(result.success).toBe(true)
  })

  it('accepts conception method with valid date', () => {
    const result = PregnancyInputSchema.safeParse({ method: 'conception', date: '2025-03-15' })
    expect(result.success).toBe(true)
  })

  it('accepts dueDate method with valid date', () => {
    const result = PregnancyInputSchema.safeParse({ method: 'dueDate', date: '2025-10-08' })
    expect(result.success).toBe(true)
  })
})

describe('PregnancyInputSchema — invalid inputs', () => {
  it('rejects invalid method', () => {
    const result = PregnancyInputSchema.safeParse({ method: 'unknown', date: '2025-01-01' })
    expect(result.success).toBe(false)
  })

  it('rejects missing method', () => {
    const result = PregnancyInputSchema.safeParse({ date: '2025-01-01' })
    expect(result.success).toBe(false)
  })

  it('rejects date in wrong format (MM/DD/YYYY)', () => {
    const result = PregnancyInputSchema.safeParse({ method: 'lmp', date: '01/01/2025' })
    expect(result.success).toBe(false)
  })

  it('rejects date in wrong format (letters)', () => {
    const result = PregnancyInputSchema.safeParse({ method: 'lmp', date: 'not-a-date' })
    expect(result.success).toBe(false)
  })

  it('rejects missing date', () => {
    const result = PregnancyInputSchema.safeParse({ method: 'lmp' })
    expect(result.success).toBe(false)
  })

  it('rejects empty string date', () => {
    const result = PregnancyInputSchema.safeParse({ method: 'lmp', date: '' })
    expect(result.success).toBe(false)
  })

  it('rejects date with wrong separator', () => {
    const result = PregnancyInputSchema.safeParse({ method: 'lmp', date: '2025.01.01' })
    expect(result.success).toBe(false)
  })

  it('error message contains INVALID_DATE_FORMAT for bad date', () => {
    const result = PregnancyInputSchema.safeParse({ method: 'lmp', date: 'bad' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map(i => i.message)
      expect(messages.some(m => m.includes('INVALID_DATE_FORMAT'))).toBe(true)
    }
  })
})
