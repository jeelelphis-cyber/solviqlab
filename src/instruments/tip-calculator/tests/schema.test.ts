import { describe, it, expect } from 'vitest'
import { TipInputSchema } from '../lib/validate.js'

describe('TipInputSchema — valid inputs', () => {
  it('minimal valid: billAmount + tipPercent only', () => {
    const result = TipInputSchema.safeParse({ billAmount: 50, tipPercent: 15 })
    expect(result.success).toBe(true)
  })

  it('full valid input with all fields', () => {
    const result = TipInputSchema.safeParse({ billAmount: 85, tipPercent: 20, numPeople: 4, taxPercent: 8 })
    expect(result.success).toBe(true)
  })

  it('defaults: numPeople defaults to 1', () => {
    const result = TipInputSchema.safeParse({ billAmount: 50, tipPercent: 15 })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.numPeople).toBe(1)
  })

  it('defaults: taxPercent defaults to 0', () => {
    const result = TipInputSchema.safeParse({ billAmount: 50, tipPercent: 15 })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.taxPercent).toBe(0)
  })

  it('tipPercent = 0 is valid', () => {
    const result = TipInputSchema.safeParse({ billAmount: 100, tipPercent: 0 })
    expect(result.success).toBe(true)
  })

  it('tipPercent = 100 is valid', () => {
    const result = TipInputSchema.safeParse({ billAmount: 100, tipPercent: 100 })
    expect(result.success).toBe(true)
  })

  it('numPeople = 1 is valid', () => {
    const result = TipInputSchema.safeParse({ billAmount: 50, tipPercent: 15, numPeople: 1 })
    expect(result.success).toBe(true)
  })

  it('numPeople = 100 is valid', () => {
    const result = TipInputSchema.safeParse({ billAmount: 50, tipPercent: 15, numPeople: 100 })
    expect(result.success).toBe(true)
  })

  it('taxPercent = 0 explicit is valid', () => {
    const result = TipInputSchema.safeParse({ billAmount: 50, tipPercent: 15, taxPercent: 0 })
    expect(result.success).toBe(true)
  })

  it('taxPercent = 30 is valid', () => {
    const result = TipInputSchema.safeParse({ billAmount: 50, tipPercent: 15, taxPercent: 30 })
    expect(result.success).toBe(true)
  })

  it('billAmount at maximum 100000 is valid', () => {
    const result = TipInputSchema.safeParse({ billAmount: 100000, tipPercent: 15 })
    expect(result.success).toBe(true)
  })

  it('billAmount at minimum 0.01 is valid', () => {
    const result = TipInputSchema.safeParse({ billAmount: 0.01, tipPercent: 15 })
    expect(result.success).toBe(true)
  })
})

describe('TipInputSchema — invalid inputs', () => {
  it('billAmount = 0 fails (not positive)', () => {
    const result = TipInputSchema.safeParse({ billAmount: 0, tipPercent: 15 })
    expect(result.success).toBe(false)
  })

  it('billAmount negative fails', () => {
    const result = TipInputSchema.safeParse({ billAmount: -10, tipPercent: 15 })
    expect(result.success).toBe(false)
  })

  it('billAmount > 100000 fails', () => {
    const result = TipInputSchema.safeParse({ billAmount: 100001, tipPercent: 15 })
    expect(result.success).toBe(false)
  })

  it('tipPercent negative fails', () => {
    const result = TipInputSchema.safeParse({ billAmount: 50, tipPercent: -1 })
    expect(result.success).toBe(false)
  })

  it('tipPercent > 100 fails', () => {
    const result = TipInputSchema.safeParse({ billAmount: 50, tipPercent: 101 })
    expect(result.success).toBe(false)
  })

  it('numPeople = 0 fails', () => {
    const result = TipInputSchema.safeParse({ billAmount: 50, tipPercent: 15, numPeople: 0 })
    expect(result.success).toBe(false)
  })

  it('numPeople = 101 fails', () => {
    const result = TipInputSchema.safeParse({ billAmount: 50, tipPercent: 15, numPeople: 101 })
    expect(result.success).toBe(false)
  })

  it('numPeople non-integer fails', () => {
    const result = TipInputSchema.safeParse({ billAmount: 50, tipPercent: 15, numPeople: 2.5 })
    expect(result.success).toBe(false)
  })

  it('taxPercent negative fails', () => {
    const result = TipInputSchema.safeParse({ billAmount: 50, tipPercent: 15, taxPercent: -1 })
    expect(result.success).toBe(false)
  })

  it('taxPercent > 30 fails', () => {
    const result = TipInputSchema.safeParse({ billAmount: 50, tipPercent: 15, taxPercent: 31 })
    expect(result.success).toBe(false)
  })

  it('missing billAmount fails', () => {
    const result = TipInputSchema.safeParse({ tipPercent: 15 })
    expect(result.success).toBe(false)
  })

  it('missing tipPercent fails', () => {
    const result = TipInputSchema.safeParse({ billAmount: 50 })
    expect(result.success).toBe(false)
  })

  it('billAmount as string fails', () => {
    const result = TipInputSchema.safeParse({ billAmount: '50', tipPercent: 15 })
    expect(result.success).toBe(false)
  })

  it('tipPercent as string fails', () => {
    const result = TipInputSchema.safeParse({ billAmount: 50, tipPercent: '15' })
    expect(result.success).toBe(false)
  })

  it('empty object fails', () => {
    const result = TipInputSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
