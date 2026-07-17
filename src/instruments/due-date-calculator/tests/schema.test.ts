import { describe, it, expect } from 'vitest'
import { DueDateInputSchema } from '../lib/validate.js'

describe('DueDateInputSchema — valid inputs', () => {
  it('accepts lmp method with valid date', () => {
    const result = DueDateInputSchema.safeParse({ method: 'lmp', date: '2025-01-01' })
    expect(result.success).toBe(true)
  })

  it('accepts conception method with valid date', () => {
    const result = DueDateInputSchema.safeParse({ method: 'conception', date: '2025-01-15' })
    expect(result.success).toBe(true)
  })

  it('accepts ivf3 method with valid date', () => {
    const result = DueDateInputSchema.safeParse({ method: 'ivf3', date: '2025-03-20' })
    expect(result.success).toBe(true)
  })

  it('accepts ivf5 method with valid date', () => {
    const result = DueDateInputSchema.safeParse({ method: 'ivf5', date: '2025-06-01' })
    expect(result.success).toBe(true)
  })

  it('accepts date at start of year', () => {
    const result = DueDateInputSchema.safeParse({ method: 'lmp', date: '2025-01-01' })
    expect(result.success).toBe(true)
  })

  it('accepts date at end of year', () => {
    const result = DueDateInputSchema.safeParse({ method: 'lmp', date: '2025-12-31' })
    expect(result.success).toBe(true)
  })

  it('accepts all 4 enum values', () => {
    const methods = ['lmp', 'conception', 'ivf3', 'ivf5'] as const
    for (const method of methods) {
      const result = DueDateInputSchema.safeParse({ method, date: '2025-05-15' })
      expect(result.success).toBe(true)
    }
  })
})

describe('DueDateInputSchema — invalid inputs', () => {
  it('rejects invalid method value', () => {
    const result = DueDateInputSchema.safeParse({ method: 'dueDate', date: '2025-01-01' })
    expect(result.success).toBe(false)
  })

  it('rejects missing method', () => {
    const result = DueDateInputSchema.safeParse({ date: '2025-01-01' })
    expect(result.success).toBe(false)
  })

  it('rejects missing date', () => {
    const result = DueDateInputSchema.safeParse({ method: 'lmp' })
    expect(result.success).toBe(false)
  })

  it('rejects date with wrong format (slashes)', () => {
    const result = DueDateInputSchema.safeParse({ method: 'lmp', date: '2025/01/01' })
    expect(result.success).toBe(false)
  })

  it('rejects date with wrong format (letters)', () => {
    const result = DueDateInputSchema.safeParse({ method: 'lmp', date: 'not-a-date' })
    expect(result.success).toBe(false)
  })

  it('rejects empty string date', () => {
    const result = DueDateInputSchema.safeParse({ method: 'lmp', date: '' })
    expect(result.success).toBe(false)
  })

  it('rejects date without year (MM-DD)', () => {
    const result = DueDateInputSchema.safeParse({ method: 'lmp', date: '01-15' })
    expect(result.success).toBe(false)
  })

  it('rejects null date', () => {
    const result = DueDateInputSchema.safeParse({ method: 'lmp', date: null })
    expect(result.success).toBe(false)
  })

  it('rejects empty object', () => {
    const result = DueDateInputSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects unknown method "ultrasound"', () => {
    const result = DueDateInputSchema.safeParse({ method: 'ultrasound', date: '2025-01-01' })
    expect(result.success).toBe(false)
  })

  it('returns INVALID_DATE_FORMAT error message for bad date format', () => {
    const result = DueDateInputSchema.safeParse({ method: 'lmp', date: '2025/01/01' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map(i => i.message)
      expect(messages).toContain('INVALID_DATE_FORMAT')
    }
  })

  it('rejects number as date', () => {
    const result = DueDateInputSchema.safeParse({ method: 'lmp', date: 20250101 })
    expect(result.success).toBe(false)
  })

  it('rejects date with time component', () => {
    const result = DueDateInputSchema.safeParse({ method: 'lmp', date: '2025-01-01T00:00:00Z' })
    expect(result.success).toBe(false)
  })

  it('rejects partial date (YYYY-MM only)', () => {
    const result = DueDateInputSchema.safeParse({ method: 'lmp', date: '2025-01' })
    expect(result.success).toBe(false)
  })

  it('rejects extra unknown fields gracefully (passthrough — valid core fields)', () => {
    const result = DueDateInputSchema.safeParse({ method: 'lmp', date: '2025-01-01', extra: 'field' })
    // Zod strips extra fields by default — core fields are valid
    expect(result.success).toBe(true)
  })
})
