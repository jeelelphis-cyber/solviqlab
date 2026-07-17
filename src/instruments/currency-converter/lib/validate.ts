import { z } from 'zod'
import { USD_RATES } from './rates.js'

const VALID_CURRENCIES = Object.keys(USD_RATES)

export const CurrencyConverterSchema = z.object({
  amount: z.number().min(0, 'AMOUNT_NEGATIVE').max(1_000_000_000, 'AMOUNT_TOO_HIGH'),
  fromCurrency: z.string().refine(c => VALID_CURRENCIES.includes(c), 'INVALID_FROM_CURRENCY'),
  toCurrency: z.string().refine(c => VALID_CURRENCIES.includes(c), 'INVALID_TO_CURRENCY'),
})
