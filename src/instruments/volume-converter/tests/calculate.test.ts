import { describe, it, expect } from 'vitest'
import { calculateVolumeConverter } from '../lib/calculate.js'

// Conversion factors to liters:
// l=1, ml=0.001, cl=0.01, m3=1000, cm3=0.001,
// gal=3.78541, qt=0.946353, pt=0.473176, cup=0.236588,
// floz=0.0295735, tbsp=0.0147868, tsp=0.00492892, ft3=28.3168, in3=0.0163871

describe('calculateVolumeConverter — from liters', () => {
  it('1L → 1000ml, 0.264172gal', () => {
    const result = calculateVolumeConverter({ value: 1, fromUnit: 'l' })
    expect(result.liters).toBe(1)
    expect(result.milliliters).toBe(1000)
    expect(result.gallons).toBeCloseTo(0.2642, 4)
    expect(result.cups).toBeCloseTo(4.2268, 4)
    expect(result.fluidOunces).toBeCloseTo(33.814, 3)
  })
})

describe('calculateVolumeConverter — from gallons', () => {
  it('1 gallon = 3.78541L', () => {
    const result = calculateVolumeConverter({ value: 1, fromUnit: 'gal' })
    expect(result.liters).toBeCloseTo(3.78541, 4)
    expect(result.milliliters).toBeCloseTo(3785.41, 1)
    expect(result.cups).toBeCloseTo(16, 2) // 1 gal = 16 cups
  })

  it('2 gallons → 7.57082L', () => {
    const result = calculateVolumeConverter({ value: 2, fromUnit: 'gal' })
    expect(result.liters).toBeCloseTo(7.5708, 4)
  })
})

describe('calculateVolumeConverter — from cups', () => {
  it('1 cup = 0.236588L, 8floz', () => {
    const result = calculateVolumeConverter({ value: 1, fromUnit: 'cup' })
    expect(result.liters).toBeCloseTo(0.2366, 4)
    expect(result.milliliters).toBeCloseTo(236.59, 1)
    expect(result.fluidOunces).toBeCloseTo(8, 2)
  })

  it('4 cups ≈ 1 quart', () => {
    const result = calculateVolumeConverter({ value: 4, fromUnit: 'cup' })
    // 4 * 0.236588 = 0.946352L ≈ 0.946353L (1 qt)
    expect(result.liters).toBeCloseTo(0.9464, 3)
  })
})

describe('calculateVolumeConverter — from fluid ounces', () => {
  it('1 fl oz = 0.0295735L', () => {
    const result = calculateVolumeConverter({ value: 1, fromUnit: 'floz' })
    expect(result.liters).toBeCloseTo(0.0296, 4)
    expect(result.milliliters).toBeCloseTo(29.57, 1)
  })

  it('8 fl oz ≈ 1 cup', () => {
    const result = calculateVolumeConverter({ value: 8, fromUnit: 'floz' })
    expect(result.cups).toBeCloseTo(1, 2)
    expect(result.liters).toBeCloseTo(0.2366, 3)
  })
})

describe('calculateVolumeConverter — from milliliters', () => {
  it('1000ml → 1L', () => {
    const result = calculateVolumeConverter({ value: 1000, fromUnit: 'ml' })
    expect(result.liters).toBe(1)
    expect(result.gallons).toBeCloseTo(0.2642, 4)
  })
})

describe('calculateVolumeConverter — edge cases', () => {
  it('0 volume → all zeros', () => {
    const result = calculateVolumeConverter({ value: 0, fromUnit: 'l' })
    expect(result.liters).toBe(0)
    expect(result.milliliters).toBe(0)
    expect(result.gallons).toBe(0)
    expect(result.cups).toBe(0)
  })
})
