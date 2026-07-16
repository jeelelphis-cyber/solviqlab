import { describe, it, expect } from 'vitest'
import { calculateVolumeCalculator } from '../lib/calculate.js'

// All results rounded to 4 decimal places by the code.
// Default: b defaults to a, h defaults to a if not provided.

describe('calculateVolumeCalculator — cube', () => {
  it('cube a=3 → volume=27', () => {
    const result = calculateVolumeCalculator({ shape: 'cube', a: 3 })
    expect(result.volume).toBe(27)
  })

  it('cube a=5 → volume=125', () => {
    const result = calculateVolumeCalculator({ shape: 'cube', a: 5 })
    expect(result.volume).toBe(125)
  })
})

describe('calculateVolumeCalculator — sphere', () => {
  it('sphere r=5 → volume≈523.5988', () => {
    // V = 4/3 * π * 5³ = 4/3 * π * 125 = 523.5988...
    const result = calculateVolumeCalculator({ shape: 'sphere', a: 5 })
    expect(result.volume).toBeCloseTo(523.5988, 4)
  })

  it('sphere r=1 → volume≈4.1888', () => {
    // V = 4/3 * π = 4.18879...
    const result = calculateVolumeCalculator({ shape: 'sphere', a: 1 })
    expect(result.volume).toBeCloseTo(4.1888, 4)
  })
})

describe('calculateVolumeCalculator — cylinder', () => {
  it('cylinder r=3, h=10 → volume≈282.7433', () => {
    // V = π * 3² * 10 = 90π ≈ 282.7433
    const result = calculateVolumeCalculator({ shape: 'cylinder', a: 3, h: 10 })
    expect(result.volume).toBeCloseTo(282.7433, 4)
  })

  it('cylinder r=2, h=5 → volume≈62.8319', () => {
    // V = π * 4 * 5 = 20π ≈ 62.83185... rounded to 4dp = 62.8319
    const result = calculateVolumeCalculator({ shape: 'cylinder', a: 2, h: 5 })
    expect(result.volume).toBeCloseTo(62.8319, 4)
  })

  it('cylinder without h → h defaults to a (r=r, h=r)', () => {
    // hVal = h ?? a = a; V = π * a² * a = π * a³
    const result = calculateVolumeCalculator({ shape: 'cylinder', a: 3 })
    expect(result.volume).toBeCloseTo(Math.PI * 27, 4)
  })
})

describe('calculateVolumeCalculator — cone', () => {
  it('cone r=4, h=9 → volume≈150.7964', () => {
    // V = 1/3 * π * 16 * 9 = 48π ≈ 150.7964
    const result = calculateVolumeCalculator({ shape: 'cone', a: 4, h: 9 })
    expect(result.volume).toBeCloseTo(150.7964, 4)
  })

  it('cone r=3, h=6 → volume≈56.5487', () => {
    // V = 1/3 * π * 9 * 6 = 18π ≈ 56.5487
    const result = calculateVolumeCalculator({ shape: 'cone', a: 3, h: 6 })
    expect(result.volume).toBeCloseTo(56.5487, 4)
  })
})

describe('calculateVolumeCalculator — rectangular prism', () => {
  it('rect_prism a=4, b=3, h=5 → volume=60', () => {
    const result = calculateVolumeCalculator({ shape: 'rect_prism', a: 4, b: 3, h: 5 })
    expect(result.volume).toBe(60)
  })

  it('rect_prism a=2, b=2, h=10 → volume=40', () => {
    const result = calculateVolumeCalculator({ shape: 'rect_prism', a: 2, b: 2, h: 10 })
    expect(result.volume).toBe(40)
  })
})

describe('calculateVolumeCalculator — edge cases', () => {
  it('zero radius → volume=0', () => {
    const result = calculateVolumeCalculator({ shape: 'sphere', a: 0 })
    expect(result.volume).toBe(0)
  })
})
