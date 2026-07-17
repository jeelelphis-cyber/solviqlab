export interface TipCalculatorInput {
  billAmount: number      // pre-tax bill
  tipPercent: number      // e.g. 15, 18, 20
  numPeople?: number      // default 1
  taxPercent?: number     // optional tax % to add before tipping (default 0)
}

export interface TipCalculatorOutput {
  tipAmount: number       // total tip
  totalBill: number       // bill + tax + tip
  tipPerPerson: number
  totalPerPerson: number
  billWithTax: number     // bill + tax (before tip)
  taxAmount: number       // tax amount in currency
}
