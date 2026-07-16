import { describe, it, expect } from 'vitest'
import { calculateLengthConverter } from '../lib/calculate.js'

// Conversion factors used by the code:
// 1 m = 1, 1 km = 1000m, 1 cm = 0.01m, 1 mm = 0.001m
// 1 ft = 0.3048m, 1 in = 0.0254m, 1 yd = 0.9144m, 1 mi = 1609.344m
// 1 nm (nautical mile) = 1852m

describe('calculateLengthConverter — from meters', () => {
  it('1m → all units', () => {
    const result = calculateLengthConverter({ value: 1, fromUnit: 'm' })
    expect(result.meters).toBe(1)
    expect(result.kilometers).toBeCloseTo(0.001, 6)
    expect(result.centimeters).toBe(100)
    expect(result.feet).toBeCloseTo(3.2808, 4)
    expect(result.inches).toBeCloseTo(39.3701, 4)
    expect(result.miles).toBeCloseTo(0.000621, 5)
  })
})

describe('calculateLengthConverter — from miles', () => {
  it('1 mile → 1609.344m, 5280ft', () => {
    const result = calculateLengthConverter({ value: 1, fromUnit: 'mi' })
    expect(result.meters).toBeCloseTo(1609.344, 3)
    expect(result.kilometers).toBeCloseTo(1.609344, 6)
    expect(result.feet).toBeCloseTo(5280, 1)
    expect(result.inches).toBeCloseTo(63360, 1)
  })

  it('5 miles → 8046.72m', () => {
    const result = calculateLengthConverter({ value: 5, fromUnit: 'mi' })
    expect(result.meters).toBeCloseTo(8046.72, 2)
    expect(result.kilometers).toBeCloseTo(8.04672, 5)
  })
})

describe('calculateLengthConverter — from feet', () => {
  it('1ft → 0.3048m, 12in', () => {
    const result = calculateLengthConverter({ value: 1, fromUnit: 'ft' })
    expect(result.meters).toBeCloseTo(0.3048, 4)
    expect(result.inches).toBeCloseTo(12, 4)
    expect(result.centimeters).toBeCloseTo(30.48, 2)
  })

  it('3ft → 0.9144m (1 yard)', () => {
    const result = calculateLengthConverter({ value: 3, fromUnit: 'ft' })
    expect(result.meters).toBeCloseTo(0.9144, 4)
  })
})

describe('calculateLengthConverter — from kilometers', () => {
  it('1km → 1000m, 0.621371mi', () => {
    const result = calculateLengthConverter({ value: 1, fromUnit: 'km' })
    expect(result.meters).toBe(1000)
    expect(result.miles).toBeCloseTo(0.621371, 5)
    expect(result.feet).toBeCloseTo(3280.8399, 3)
  })
})

describe('calculateLengthConverter — from inches', () => {
  it('12 inches → 1ft, 0.3048m', () => {
    const result = calculateLengthConverter({ value: 12, fromUnit: 'in' })
    expect(result.feet).toBeCloseTo(1, 4)
    expect(result.meters).toBeCloseTo(0.3048, 4)
  })
})

describe('calculateLengthConverter — edge cases', () => {
  it('0 length → all zeros', () => {
    const result = calculateLengthConverter({ value: 0, fromUnit: 'm' })
    expect(result.meters).toBe(0)
    expect(result.kilometers).toBe(0)
    expect(result.feet).toBe(0)
    expect(result.inches).toBe(0)
    expect(result.miles).toBe(0)
  })
})
