import { USD_RATES } from './rates.js'
import type { CurrencyConverterInput, CurrencyConverterOutput } from './types.js'

// rates: USD-based record (1 USD = X currency). Falls back to static USD_RATES if not provided.
export function convertCurrency(
  input: CurrencyConverterInput,
  rates: Record<string, number> = USD_RATES,
): CurrencyConverterOutput {
  const { amount, fromCurrency, toCurrency } = input

  if (amount < 0) throw new Error('Amount must be non-negative')
  if (!rates[fromCurrency]) throw new Error(`Unknown currency: ${fromCurrency}`)
  if (!rates[toCurrency]) throw new Error(`Unknown currency: ${toCurrency}`)

  const amountInUSD = amount / rates[fromCurrency]
  const result = amountInUSD * rates[toCurrency]

  const rate = rates[toCurrency] / rates[fromCurrency]
  const inverseRate = rates[fromCurrency] / rates[toCurrency]

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
