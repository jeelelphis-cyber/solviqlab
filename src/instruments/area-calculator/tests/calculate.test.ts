import { describe, it, expect } from 'vitest'
import { calculateAreaCalculator } from '../lib/calculate.js'

describe('calculateAreaCalculator — rectangle', () => {
  it('5×3 → area=15, perimeter=16', () => {
    const r = calculateAreaCalculator({ shape: 'rectangle', a: 5, b: 3 })
    expect(r.area).toBe(15)
    expect(r.perimeter).toBe(16)
  })
  it('square via rectangle (a=b) → area=25', () => {
    const r = calculateAreaCalculator({ shape: 'rectangle', a: 5, b: 5 })
    expect(r.area).toBe(25)
  })
})

describe('calculateAreaCalculator — square', () => {
  it('side=4 → area=16, perimeter=16', () => {
    const r = calculateAreaCalculator({ shape: 'square', a: 4 })
    expect(r.area).toBe(16)
    expect(r.perimeter).toBe(16)
  })
})

describe('calculateAreaCalculator — circle', () => {
  it('r=5 → area=78.5398, perimeter=31.4159', () => {
    const r = calculateAreaCalculator({ shape: 'circle', a: 5 })
    expect(r.area).toBeCloseTo(78.5398, 3)
    expect(r.perimeter).toBeCloseTo(31.4159, 3)
  })
  it('r=1 → area=π', () => {
    const r = calculateAreaCalculator({ shape: 'circle', a: 1 })
    expect(r.area).toBeCloseTo(Math.PI, 4)
  })
})

describe('calculateAreaCalculator — triangle', () => {
  it('base=10, height=6 → area=30', () => {
    const r = calculateAreaCalculator({ shape: 'triangle', a: 10, b: 6 })
    expect(r.area).toBe(30)
  })
  it('perimeter=0 (only 2 sides known — not computable)', () => {
    const r = calculateAreaCalculator({ shape: 'triangle', a: 5, b: 4 })
    expect(r.perimeter).toBe(0)
  })
})

describe('calculateAreaCalculator — trapezoid (FIXED: uses h for height)', () => {
  it('base1=10, base2=6, height=4 → area=32', () => {
    // area = (10+6)/2 * 4 = 8 * 4 = 32
    const r = calculateAreaCalculator({ shape: 'trapezoid', a: 10, b: 6, h: 4 })
    expect(r.area).toBe(32)
  })
  it('base1=8, base2=4, height=5 → area=30', () => {
    const r = calculateAreaCalculator({ shape: 'trapezoid', a: 8, b: 4, h: 5 })
    expect(r.area).toBe(30)
  })
  it('equal bases (parallelogram case) base=6, height=3 → area=18', () => {
    const r = calculateAreaCalculator({ shape: 'trapezoid', a: 6, b: 6, h: 3 })
    expect(r.area).toBe(18)
  })
})

describe('calculateAreaCalculator — ellipse', () => {
  it('semi-axes a=5, b=3 → area=47.1239', () => {
    const r = calculateAreaCalculator({ shape: 'ellipse', a: 5, b: 3 })
    expect(r.area).toBeCloseTo(Math.PI * 5 * 3, 3)
  })
  it('circle case: a=b=4 → area=π*16', () => {
    const r = calculateAreaCalculator({ shape: 'ellipse', a: 4, b: 4 })
    expect(r.area).toBeCloseTo(Math.PI * 16, 3)
  })
})
