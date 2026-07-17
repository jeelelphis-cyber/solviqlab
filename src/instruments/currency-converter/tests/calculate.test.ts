import { describe, it, expect } from 'vitest'
import { convertCurrency } from '../lib/calculate.js'
import { USD_RATES } from '../lib/rates.js'

describe('convertCurrency — basic conversions', () => {
  it('USD → EUR: 100 USD → 92.40 EUR', () => {
    const result = convertCurrency({ amount: 100, fromCurrency: 'USD', toCurrency: 'EUR' })
    expect(result.result).toBe(92.40)
    expect(result.fromCode).toBe('USD')
    expect(result.toCode).toBe('EUR')
  })

  it('EUR → USD: 100 EUR → ~108.23 USD', () => {
    const result = convertCurrency({ amount: 100, fromCurrency: 'EUR', toCurrency: 'USD' })
    expect(result.result).toBeCloseTo(108.23, 1)
  })

  it('same currency USD → USD: rate = 1.0, result = amount', () => {
    const result = convertCurrency({ amount: 250, fromCurrency: 'USD', toCurrency: 'USD' })
    expect(result.rate).toBe(1.0)
    expect(result.result).toBe(250)
    expect(result.inverseRate).toBe(1.0)
  })

  it('large amount: 1,000,000 USD → EUR', () => {
    const result = convertCurrency({ amount: 1_000_000, fromCurrency: 'USD', toCurrency: 'EUR' })
    expect(result.result).toBe(924000)
  })

  it('zero amount: result = 0', () => {
    const result = convertCurrency({ amount: 0, fromCurrency: 'USD', toCurrency: 'EUR' })
    expect(result.result).toBe(0)
  })
})

describe('convertCurrency — rate calculations', () => {
  it('rate = USD_RATES[to] / USD_RATES[from]', () => {
    const result = convertCurrency({ amount: 1, fromCurrency: 'USD', toCurrency: 'EUR' })
    const expected = USD_RATES['EUR']! / USD_RATES['USD']!
    expect(result.rate).toBeCloseTo(expected, 4)
  })

  it('inverseRate = USD_RATES[from] / USD_RATES[to]', () => {
    const result = convertCurrency({ amount: 1, fromCurrency: 'USD', toCurrency: 'EUR' })
    const expected = USD_RATES['USD']! / USD_RATES['EUR']!
    expect(result.inverseRate).toBeCloseTo(expected, 4)
  })

  it('rate × inverseRate ≈ 1.0 (within floating point tolerance)', () => {
    const result = convertCurrency({ amount: 100, fromCurrency: 'EUR', toCurrency: 'GBP' })
    expect(result.rate * result.inverseRate).toBeCloseTo(1.0, 4)
  })
})

describe('convertCurrency — cross rates', () => {
  it('JPY → KRW cross rate', () => {
    const result = convertCurrency({ amount: 1000, fromCurrency: 'JPY', toCurrency: 'KRW' })
    const expectedRate = USD_RATES['KRW']! / USD_RATES['JPY']!
    expect(result.rate).toBeCloseTo(expectedRate, 3)
    expect(result.result).toBeCloseTo(1000 * expectedRate, 2)
  })

  it('UAH → EUR conversion', () => {
    const result = convertCurrency({ amount: 1000, fromCurrency: 'UAH', toCurrency: 'EUR' })
    const expectedRate = USD_RATES['EUR']! / USD_RATES['UAH']!
    expect(result.rate).toBeCloseTo(expectedRate, 4)
    expect(result.result).toBeCloseTo(1000 * expectedRate, 2)
  })
})

describe('convertCurrency — error handling', () => {
  it('throws for unknown fromCurrency', () => {
    expect(() => convertCurrency({ amount: 100, fromCurrency: 'XYZ', toCurrency: 'USD' }))
      .toThrow('Unknown currency: XYZ')
  })

  it('throws for unknown toCurrency', () => {
    expect(() => convertCurrency({ amount: 100, fromCurrency: 'USD', toCurrency: 'ABC' }))
      .toThrow('Unknown currency: ABC')
  })

  it('throws for negative amount', () => {
    expect(() => convertCurrency({ amount: -1, fromCurrency: 'USD', toCurrency: 'EUR' }))
      .toThrow('Amount must be non-negative')
  })
})

describe('convertCurrency — rounding', () => {
  it('result rounds to 2 decimals', () => {
    const result = convertCurrency({ amount: 1, fromCurrency: 'EUR', toCurrency: 'USD' })
    const decimals = result.result.toString().split('.')[1]?.length ?? 0
    expect(decimals).toBeLessThanOrEqual(2)
  })

  it('rate rounds to 4 decimals', () => {
    const result = convertCurrency({ amount: 1, fromCurrency: 'EUR', toCurrency: 'GBP' })
    const decimals = result.rate.toString().split('.')[1]?.length ?? 0
    expect(decimals).toBeLessThanOrEqual(4)
  })
})
