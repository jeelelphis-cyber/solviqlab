import { describe, it, expect } from 'vitest'
import { calculateTemperatureConverter } from '../lib/calculate.js'

// Formulas:
// C from F: (F - 32) * 5/9
// C from K: K - 273.15
// Output: { celsius, fahrenheit: C*9/5+32, kelvin: C+273.15 }
// All rounded to 2dp.

describe('calculateTemperatureConverter — from Celsius', () => {
  it('0°C → 32°F, 273.15K', () => {
    const result = calculateTemperatureConverter({ value: 0, fromUnit: 'C' })
    expect(result.celsius).toBe(0)
    expect(result.fahrenheit).toBe(32)
    expect(result.kelvin).toBe(273.15)
  })

  it('100°C → 212°F, 373.15K', () => {
    const result = calculateTemperatureConverter({ value: 100, fromUnit: 'C' })
    expect(result.celsius).toBe(100)
    expect(result.fahrenheit).toBe(212)
    expect(result.kelvin).toBe(373.15)
  })

  it('-40°C → -40°F (only point where scales coincide)', () => {
    const result = calculateTemperatureConverter({ value: -40, fromUnit: 'C' })
    expect(result.celsius).toBe(-40)
    expect(result.fahrenheit).toBe(-40)
  })

  it('37°C (body temp) → 98.6°F', () => {
    const result = calculateTemperatureConverter({ value: 37, fromUnit: 'C' })
    expect(result.fahrenheit).toBeCloseTo(98.6, 1)
  })
})

describe('calculateTemperatureConverter — from Fahrenheit', () => {
  it('32°F → 0°C, 273.15K', () => {
    const result = calculateTemperatureConverter({ value: 32, fromUnit: 'F' })
    expect(result.celsius).toBe(0)
    expect(result.kelvin).toBe(273.15)
  })

  it('212°F → 100°C', () => {
    const result = calculateTemperatureConverter({ value: 212, fromUnit: 'F' })
    expect(result.celsius).toBe(100)
  })

  it('0°F → -17.78°C', () => {
    // C = (0-32)*5/9 = -160/9 = -17.7778 → -17.78
    const result = calculateTemperatureConverter({ value: 0, fromUnit: 'F' })
    expect(result.celsius).toBeCloseTo(-17.78, 2)
  })

  it('-40°F → -40°C', () => {
    const result = calculateTemperatureConverter({ value: -40, fromUnit: 'F' })
    expect(result.celsius).toBe(-40)
  })
})

describe('calculateTemperatureConverter — from Kelvin', () => {
  it('273.15K → 0°C, 32°F', () => {
    const result = calculateTemperatureConverter({ value: 273.15, fromUnit: 'K' })
    expect(result.celsius).toBe(0)
    expect(result.fahrenheit).toBe(32)
  })

  it('373.15K → 100°C', () => {
    const result = calculateTemperatureConverter({ value: 373.15, fromUnit: 'K' })
    expect(result.celsius).toBe(100)
  })

  it('0K → -273.15°C (absolute zero)', () => {
    const result = calculateTemperatureConverter({ value: 0, fromUnit: 'K' })
    expect(result.celsius).toBe(-273.15)
  })
})

describe('calculateTemperatureConverter — edge cases', () => {
  it('output is rounded to 2 decimal places', () => {
    const result = calculateTemperatureConverter({ value: 1, fromUnit: 'C' })
    // 1°C = 33.8°F — exact, no rounding needed, but check it's a number with ≤2dp
    expect(result.fahrenheit).toBe(33.8)
  })
})
