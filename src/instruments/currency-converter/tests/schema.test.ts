import { describe, it, expect } from 'vitest'
import { CurrencyConverterSchema } from '../lib/validate.js'

describe('CurrencyConverterSchema — valid inputs', () => {
  it('accepts valid USD → EUR conversion', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: 100, fromCurrency: 'USD', toCurrency: 'EUR' })
    expect(result.success).toBe(true)
  })

  it('accepts amount = 0', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: 0, fromCurrency: 'USD', toCurrency: 'EUR' })
    expect(result.success).toBe(true)
  })

  it('accepts max amount 1,000,000,000', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: 1_000_000_000, fromCurrency: 'USD', toCurrency: 'EUR' })
    expect(result.success).toBe(true)
  })

  it('accepts same currency (USD → USD)', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: 50, fromCurrency: 'USD', toCurrency: 'USD' })
    expect(result.success).toBe(true)
  })

  it('accepts JPY → KRW', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: 10000, fromCurrency: 'JPY', toCurrency: 'KRW' })
    expect(result.success).toBe(true)
  })

  it('accepts UAH → EUR', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: 5000, fromCurrency: 'UAH', toCurrency: 'EUR' })
    expect(result.success).toBe(true)
  })

  it('accepts BRL → USD', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: 100, fromCurrency: 'BRL', toCurrency: 'USD' })
    expect(result.success).toBe(true)
  })

  it('accepts GBP → CHF', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: 200, fromCurrency: 'GBP', toCurrency: 'CHF' })
    expect(result.success).toBe(true)
  })

  it('accepts decimal amount', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: 99.99, fromCurrency: 'USD', toCurrency: 'EUR' })
    expect(result.success).toBe(true)
  })

  it('accepts MAD currency', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: 100, fromCurrency: 'MAD', toCurrency: 'USD' })
    expect(result.success).toBe(true)
  })
})

describe('CurrencyConverterSchema — invalid inputs', () => {
  it('rejects negative amount', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: -1, fromCurrency: 'USD', toCurrency: 'EUR' })
    expect(result.success).toBe(false)
  })

  it('rejects amount above max (1,000,000,001)', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: 1_000_000_001, fromCurrency: 'USD', toCurrency: 'EUR' })
    expect(result.success).toBe(false)
  })

  it('rejects unknown fromCurrency', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: 100, fromCurrency: 'XYZ', toCurrency: 'EUR' })
    expect(result.success).toBe(false)
  })

  it('rejects unknown toCurrency', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: 100, fromCurrency: 'USD', toCurrency: 'ABC' })
    expect(result.success).toBe(false)
  })

  it('rejects missing amount', () => {
    const result = CurrencyConverterSchema.safeParse({ fromCurrency: 'USD', toCurrency: 'EUR' })
    expect(result.success).toBe(false)
  })

  it('rejects missing fromCurrency', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: 100, toCurrency: 'EUR' })
    expect(result.success).toBe(false)
  })

  it('rejects missing toCurrency', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: 100, fromCurrency: 'USD' })
    expect(result.success).toBe(false)
  })

  it('rejects null amount', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: null, fromCurrency: 'USD', toCurrency: 'EUR' })
    expect(result.success).toBe(false)
  })

  it('rejects string amount', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: 'one hundred', fromCurrency: 'USD', toCurrency: 'EUR' })
    expect(result.success).toBe(false)
  })

  it('rejects lowercase currency code', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: 100, fromCurrency: 'usd', toCurrency: 'EUR' })
    expect(result.success).toBe(false)
  })

  it('rejects empty string currency', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: 100, fromCurrency: '', toCurrency: 'EUR' })
    expect(result.success).toBe(false)
  })

  it('rejects numeric currency code', () => {
    const result = CurrencyConverterSchema.safeParse({ amount: 100, fromCurrency: 840, toCurrency: 'EUR' })
    expect(result.success).toBe(false)
  })
})
