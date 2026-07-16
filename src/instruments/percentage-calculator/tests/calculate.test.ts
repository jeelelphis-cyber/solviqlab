import { describe, it, expect } from 'vitest'
import { calculatePercentageCalculator } from '../calculate.js'

describe('percent-of mode — What is X% of Y?', () => {
  it('15% of 200 = 30', () => {
    const r = calculatePercentageCalculator({ mode: 'percent-of', a: 15, b: 200 })
    expect(r.roundedResult).toBe(30)
  })
  it('25% of 400 = 100', () => {
    const r = calculatePercentageCalculator({ mode: 'percent-of', a: 25, b: 400 })
    expect(r.roundedResult).toBe(100)
  })
  it('100% of 75 = 75', () => {
    const r = calculatePercentageCalculator({ mode: 'percent-of', a: 100, b: 75 })
    expect(r.roundedResult).toBe(75)
  })
  it('0% of any = 0', () => {
    const r = calculatePercentageCalculator({ mode: 'percent-of', a: 0, b: 999 })
    expect(r.roundedResult).toBe(0)
  })
})

describe('is-what-percent mode — X is what % of Y?', () => {
  it('30 is 25% of 120', () => {
    const r = calculatePercentageCalculator({ mode: 'is-what-percent', a: 30, b: 120 })
    expect(r.roundedResult).toBe(25)
  })
  it('50 is 50% of 100', () => {
    const r = calculatePercentageCalculator({ mode: 'is-what-percent', a: 50, b: 100 })
    expect(r.roundedResult).toBe(50)
  })
  it('1 is 1% of 100', () => {
    const r = calculatePercentageCalculator({ mode: 'is-what-percent', a: 1, b: 100 })
    expect(r.roundedResult).toBe(1)
  })
})

describe('percent-change mode — % change from X to Y?', () => {
  it('50 to 75 = +50% increase', () => {
    const r = calculatePercentageCalculator({ mode: 'percent-change', a: 50, b: 75 })
    expect(r.roundedResult).toBe(50)
    expect(r.isIncrease).toBe(true)
  })
  it('100 to 80 = -20% decrease', () => {
    const r = calculatePercentageCalculator({ mode: 'percent-change', a: 100, b: 80 })
    expect(r.roundedResult).toBe(-20)
    expect(r.isIncrease).toBe(false)
  })
  it('200 to 200 = 0% change', () => {
    const r = calculatePercentageCalculator({ mode: 'percent-change', a: 200, b: 200 })
    expect(r.roundedResult).toBe(0)
  })
  it('negative base: -50 to -25 = 50% increase', () => {
    const r = calculatePercentageCalculator({ mode: 'percent-change', a: -50, b: -25 })
    expect(r.roundedResult).toBeCloseTo(50, 1)
  })
})

describe('percent-adjust mode — increase/decrease X by Y%', () => {
  it('500 increased by 20% = 600', () => {
    const r = calculatePercentageCalculator({ mode: 'percent-adjust', a: 500, b: 20, direction: 'increase' })
    expect(r.roundedResult).toBe(600)
  })
  it('500 decreased by 20% = 400', () => {
    const r = calculatePercentageCalculator({ mode: 'percent-adjust', a: 500, b: 20, direction: 'decrease' })
    expect(r.roundedResult).toBe(400)
  })
  it('default direction (increase) — 100 by 10% = 110', () => {
    const r = calculatePercentageCalculator({ mode: 'percent-adjust', a: 100, b: 10 })
    expect(r.roundedResult).toBe(110)
  })
  it('0% change returns original value', () => {
    const r = calculatePercentageCalculator({ mode: 'percent-adjust', a: 250, b: 0, direction: 'increase' })
    expect(r.roundedResult).toBe(250)
  })
})

describe('output shape', () => {
  it('always returns roundedResult, result, mode, a, b', () => {
    const r = calculatePercentageCalculator({ mode: 'percent-of', a: 10, b: 50 })
    expect(typeof r.result).toBe('number')
    expect(typeof r.roundedResult).toBe('number')
    expect(r.mode).toBe('percent-of')
    expect(r.a).toBe(10)
    expect(r.b).toBe(50)
  })
})
