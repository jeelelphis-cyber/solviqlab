import type { TipCalculatorInput, TipCalculatorOutput } from './types.js'

const round2 = (n: number) => Math.round(n * 100) / 100

export function calculateTip(input: TipCalculatorInput): TipCalculatorOutput {
  const {
    billAmount,
    tipPercent,
    numPeople = 1,
    taxPercent = 0,
  } = input

  // Validation
  if (billAmount <= 0) throw new Error('Bill amount must be greater than 0.')
  if (tipPercent < 0 || tipPercent > 100) throw new Error('Tip percent must be between 0% and 100%.')
  if (!Number.isInteger(numPeople) || numPeople < 1) throw new Error('Number of people must be an integer >= 1.')
  if (taxPercent < 0 || taxPercent > 30) throw new Error('Tax percent must be between 0% and 30%.')

  const taxAmount = billAmount * taxPercent / 100
  const billWithTax = billAmount + taxAmount
  const tipAmount = billWithTax * tipPercent / 100
  const totalBill = billWithTax + tipAmount
  const tipPerPerson = tipAmount / numPeople
  const totalPerPerson = totalBill / numPeople

  return {
    tipAmount: round2(tipAmount),
    totalBill: round2(totalBill),
    tipPerPerson: round2(tipPerPerson),
    totalPerPerson: round2(totalPerPerson),
    billWithTax: round2(billWithTax),
    taxAmount: round2(taxAmount),
  }
}
