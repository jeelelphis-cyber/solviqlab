import { USD_RATES } from './rates.js'
import type { CurrencyConverterInput, CurrencyConverterOutput } from './types.js'

export function convertCurrency(input: CurrencyConverterInput): CurrencyConverterOutput {
  const { amount, fromCurrency, toCurrency } = input

  if (amount < 0) throw new Error('Amount must be non-negative')
  if (!USD_RATES[fromCurrency]) throw new Error(`Unknown currency: ${fromCurrency}`)
  if (!USD_RATES[toCurrency]) throw new Error(`Unknown currency: ${toCurrency}`)

  // Convert via USD as base
  const amountInUSD = amount / USD_RATES[fromCurrency]
  const result = amountInUSD * USD_RATES[toCurrency]

  const rate = USD_RATES[toCurrency] / USD_RATES[fromCurrency]
  const inverseRate = USD_RATES[fromCurrency] / USD_RATES[toCurrency]

  const round = (n: number, decimals: number = 4) =>
    Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals)

  return {
    result: round(result, 2),
    rate: round(rate, 4),
    inverseRate: round(inverseRate, 4),
    fromCode: fromCurrency,
    toCode: toCurrency,
  }
}
