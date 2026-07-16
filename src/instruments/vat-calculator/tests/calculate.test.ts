import { describe, it, expect } from 'vitest'
import { calculateVatCalculator } from '../lib/calculate.js'

describe('calculateVatCalculator — add mode', () => {
  it('1000 + 20% VAT → gross=1200, vat=200', () => {
    const result = calculateVatCalculator({ amount: 1000, vatRate: 20, mode: 'add' })
    expect(result.netAmount).toBe(1000)
    expect(result.vatAmount).toBe(200)
    expect(result.grossAmount).toBe(1200)
  })

  it('500 + 10% VAT → gross=550, vat=50', () => {
    const result = calculateVatCalculator({ amount: 500, vatRate: 10, mode: 'add' })
    expect(result.netAmount).toBe(500)
    expect(result.vatAmount).toBe(50)
    expect(result.grossAmount).toBe(550)
  })

  it('100 + 5% VAT → gross=105, vat=5', () => {
    const result = calculateVatCalculator({ amount: 100, vatRate: 5, mode: 'add' })
    expect(result.netAmount).toBe(100)
    expect(result.vatAmount).toBe(5)
    expect(result.grossAmount).toBe(105)
  })

  it('handles fractional amounts: 99.99 + 20% → correct rounding', () => {
    const result = calculateVatCalculator({ amount: 99.99, vatRate: 20, mode: 'add' })
    expect(result.vatAmount).toBeCloseTo(20.0, 1)
    expect(result.grossAmount).toBeCloseTo(119.99, 1)
  })
})

describe('calculateVatCalculator — remove mode', () => {
  it('remove 20% VAT from 1200 → net=1000, vat=200', () => {
    const result = calculateVatCalculator({ amount: 1200, vatRate: 20, mode: 'remove' })
    expect(result.grossAmount).toBe(1200)
    expect(result.netAmount).toBeCloseTo(1000, 2)
    expect(result.vatAmount).toBeCloseTo(200, 2)
  })

  it('remove 10% VAT from 550 → net=500, vat=50', () => {
    const result = calculateVatCalculator({ amount: 550, vatRate: 10, mode: 'remove' })
    expect(result.netAmount).toBeCloseTo(500, 2)
    expect(result.vatAmount).toBeCloseTo(50, 2)
  })

  it('remove 25% VAT from 125 → net=100', () => {
    // net = 125 / 1.25 = 100
    const result = calculateVatCalculator({ amount: 125, vatRate: 25, mode: 'remove' })
    expect(result.netAmount).toBeCloseTo(100, 2)
    expect(result.vatAmount).toBeCloseTo(25, 2)
  })
})

describe('calculateVatCalculator — edge cases', () => {
  it('0% VAT → gross equals net', () => {
    const result = calculateVatCalculator({ amount: 500, vatRate: 0, mode: 'add' })
    expect(result.vatAmount).toBe(0)
    expect(result.grossAmount).toBe(500)
    expect(result.netAmount).toBe(500)
  })

  it('add and remove are inverse operations', () => {
    const added = calculateVatCalculator({ amount: 1000, vatRate: 20, mode: 'add' })
    const removed = calculateVatCalculator({ amount: added.grossAmount, vatRate: 20, mode: 'remove' })
    expect(removed.netAmount).toBeCloseTo(1000, 2)
  })
})
