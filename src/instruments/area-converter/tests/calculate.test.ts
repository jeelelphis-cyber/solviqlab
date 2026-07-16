import { describe, it, expect } from 'vitest'
import { calculateAreaConverter } from '../lib/calculate.js'

// Conversion factors to m²:
// m2=1, km2=1e6, cm2=0.0001, mm2=1e-6, ft2=0.092903, in2=0.00064516,
// yd2=0.836127, mi2=2589988.11, acre=4046.8564, ha=10000

describe('calculateAreaConverter — from square meters', () => {
  it('1m² → 10.7639ft², 0.0001ha', () => {
    const result = calculateAreaConverter({ value: 1, fromUnit: 'm2' })
    expect(result.squareMeters).toBe(1)
    expect(result.squareFeet).toBeCloseTo(10.7639, 4)
    expect(result.hectares).toBeCloseTo(0.0001, 4)
    expect(result.acres).toBeCloseTo(0.000247, 4)
  })
})

describe('calculateAreaConverter — from acres', () => {
  it('1 acre = 4046.8564m²', () => {
    const result = calculateAreaConverter({ value: 1, fromUnit: 'acre' })
    expect(result.squareMeters).toBeCloseTo(4046.8564, 2)
    expect(result.hectares).toBeCloseTo(0.4047, 4)
  })

  it('2.471 acres ≈ 1 hectare', () => {
    // 10000 / 4046.8564 ≈ 2.4711
    const result = calculateAreaConverter({ value: 2.4711, fromUnit: 'acre' })
    expect(result.squareMeters).toBeCloseTo(10000, 0)
    expect(result.hectares).toBeCloseTo(1, 3)
  })
})

describe('calculateAreaConverter — from hectares', () => {
  it('1 hectare = 10000m²', () => {
    const result = calculateAreaConverter({ value: 1, fromUnit: 'ha' })
    expect(result.squareMeters).toBe(10000)
    expect(result.acres).toBeCloseTo(2.4711, 4)
    expect(result.squareFeet).toBeCloseTo(107639.1042, 0)
  })
})

describe('calculateAreaConverter — from square feet', () => {
  it('1ft² → 0.092903m²', () => {
    const result = calculateAreaConverter({ value: 1, fromUnit: 'ft2' })
    expect(result.squareMeters).toBeCloseTo(0.0929, 4)
  })

  it('10.7639ft² ≈ 1m²', () => {
    const result = calculateAreaConverter({ value: 10.7639, fromUnit: 'ft2' })
    expect(result.squareMeters).toBeCloseTo(1, 2)
  })
})

describe('calculateAreaConverter — from square kilometers', () => {
  it('1km² = 1,000,000m²', () => {
    const result = calculateAreaConverter({ value: 1, fromUnit: 'km2' })
    expect(result.squareMeters).toBe(1000000)
    expect(result.hectares).toBeCloseTo(100, 2)
    expect(result.acres).toBeCloseTo(247.1054, 2)
  })
})

describe('calculateAreaConverter — edge cases', () => {
  it('0 area → all zeros', () => {
    const result = calculateAreaConverter({ value: 0, fromUnit: 'm2' })
    expect(result.squareMeters).toBe(0)
    expect(result.squareFeet).toBe(0)
    expect(result.hectares).toBe(0)
    expect(result.acres).toBe(0)
  })
})
