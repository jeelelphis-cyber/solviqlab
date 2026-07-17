import { describe, it, expect } from 'vitest'
import { convertCurrency } from '../lib/calculate.js'

describe('convertCurrency — performance', () => {
  it('single conversion completes in < 5ms', () => {
    const start = performance.now()
    convertCurrency({ amount: 1000, fromCurrency: 'USD', toCurrency: 'EUR' })
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(5)
  })

  it('1000 conversions complete in < 100ms', () => {
    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      convertCurrency({ amount: i, fromCurrency: 'USD', toCurrency: 'EUR' })
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(100)
  })

  it('cross-rate conversion (JPY → KRW) completes in < 5ms', () => {
    const start = performance.now()
    convertCurrency({ amount: 100000, fromCurrency: 'JPY', toCurrency: 'KRW' })
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(5)
  })
})
