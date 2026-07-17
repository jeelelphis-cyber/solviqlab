export interface CurrencyConverterInput {
  amount: number
  fromCurrency: string  // currency code e.g. 'USD'
  toCurrency: string
}

export interface CurrencyConverterOutput {
  result: number
  rate: number        // 1 fromCurrency = X toCurrency
  inverseRate: number // 1 toCurrency = X fromCurrency
  fromCode: string
  toCode: string
}
