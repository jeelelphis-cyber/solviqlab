import { describe, it, expect } from 'vitest'
import { calculateTip } from '../lib/calculate.js'

// ─── Reference values cross-checked against standard tip calculation logic ───
// Formula: tipAmount = billWithTax × tipPercent / 100
// totalBill = billWithTax + tipAmount; perPerson = total / numPeople

describe('calculateTip — basic cases', () => {
  it('$100 bill, 20% tip, 1 person, 0 tax → tip=$20, total=$120, perPerson=$120', () => {
    const r = calculateTip({ billAmount: 100, tipPercent: 20, numPeople: 1, taxPercent: 0 })
    expect(r.tipAmount).toBe(20)
    expect(r.totalBill).toBe(120)
    expect(r.totalPerPerson).toBe(120)
    expect(r.taxAmount).toBe(0)
    expect(r.billWithTax).toBe(100)
  })

  it('$100 bill, 20% tip, 4 people, 0 tax → tipPerPerson=$5, totalPerPerson=$30', () => {
    const r = calculateTip({ billAmount: 100, tipPercent: 20, numPeople: 4, taxPercent: 0 })
    expect(r.tipPerPerson).toBe(5)
    expect(r.totalPerPerson).toBe(30)
  })

  it('$85 bill, 20% tip, 4 people, 8% tax → taxAmount=$6.80, billWithTax=$91.80, tip=$18.36, total=$110.16, totalPerPerson=$27.54', () => {
    const r = calculateTip({ billAmount: 85, tipPercent: 20, numPeople: 4, taxPercent: 8 })
    expect(r.taxAmount).toBe(6.80)
    expect(r.billWithTax).toBe(91.80)
    expect(r.tipAmount).toBe(18.36)
    expect(r.totalBill).toBe(110.16)
    expect(r.totalPerPerson).toBe(27.54)
  })

  it('0% tip → tipAmount=0, totalBill = billWithTax', () => {
    const r = calculateTip({ billAmount: 50, tipPercent: 0, numPeople: 1, taxPercent: 10 })
    expect(r.tipAmount).toBe(0)
    expect(r.totalBill).toBe(r.billWithTax)
    expect(r.totalBill).toBe(55)
  })

  it('taxPercent=0 (default) → taxAmount=0, billWithTax = billAmount', () => {
    const r = calculateTip({ billAmount: 75, tipPercent: 15, taxPercent: 0 })
    expect(r.taxAmount).toBe(0)
    expect(r.billWithTax).toBe(75)
  })

  it('numPeople=1 (default) → perPerson = total', () => {
    const r = calculateTip({ billAmount: 60, tipPercent: 18 })
    expect(r.totalPerPerson).toBe(r.totalBill)
    expect(r.tipPerPerson).toBe(r.tipAmount)
  })

  it('large group: $500, 18%, 10 people → verify math', () => {
    const r = calculateTip({ billAmount: 500, tipPercent: 18, numPeople: 10, taxPercent: 0 })
    expect(r.tipAmount).toBe(90)
    expect(r.totalBill).toBe(590)
    expect(r.tipPerPerson).toBe(9)
    expect(r.totalPerPerson).toBe(59)
  })

  it('tip rounds to 2 decimals', () => {
    // $33.33 at 15% = 4.9995 → rounds to 5.00
    const r = calculateTip({ billAmount: 33.33, tipPercent: 15, numPeople: 1, taxPercent: 0 })
    expect(Number.isInteger(r.tipAmount * 100)).toBe(true)
    expect(r.tipAmount).toBe(5)
  })
})

describe('calculateTip — validation / error handling', () => {
  it('throws for billAmount <= 0', () => {
    expect(() => calculateTip({ billAmount: 0, tipPercent: 15 })).toThrow()
    expect(() => calculateTip({ billAmount: -10, tipPercent: 15 })).toThrow()
  })

  it('throws for tipPercent > 100', () => {
    expect(() => calculateTip({ billAmount: 50, tipPercent: 101 })).toThrow()
  })

  it('throws for numPeople < 1', () => {
    expect(() => calculateTip({ billAmount: 50, tipPercent: 15, numPeople: 0 })).toThrow()
    expect(() => calculateTip({ billAmount: 50, tipPercent: 15, numPeople: -1 })).toThrow()
  })

  it('throws for taxPercent > 30', () => {
    expect(() => calculateTip({ billAmount: 50, tipPercent: 15, taxPercent: 31 })).toThrow()
  })

  it('does not throw for valid edge cases', () => {
    expect(() => calculateTip({ billAmount: 0.01, tipPercent: 0, numPeople: 1, taxPercent: 0 })).not.toThrow()
    expect(() => calculateTip({ billAmount: 100000, tipPercent: 100, numPeople: 100, taxPercent: 30 })).not.toThrow()
  })
})

describe('calculateTip — additional coverage', () => {
  it('tipPercent=0 and no tax → tip=0, total=bill, perPerson=bill/n', () => {
    const r = calculateTip({ billAmount: 200, tipPercent: 0, numPeople: 4, taxPercent: 0 })
    expect(r.tipAmount).toBe(0)
    expect(r.totalBill).toBe(200)
    expect(r.totalPerPerson).toBe(50)
  })

  it('all values at maximum boundary', () => {
    const r = calculateTip({ billAmount: 100000, tipPercent: 100, numPeople: 100, taxPercent: 30 })
    expect(r.taxAmount).toBe(30000)
    expect(r.billWithTax).toBe(130000)
    expect(r.tipAmount).toBe(130000)
    expect(r.totalBill).toBe(260000)
    expect(r.totalPerPerson).toBe(2600)
  })

  it('tip with fractional result rounds correctly', () => {
    // $10, 33.33%, 3 people, 0 tax
    const r = calculateTip({ billAmount: 10, tipPercent: 33.33, numPeople: 3, taxPercent: 0 })
    expect(r.tipAmount).toBe(3.33)
    expect(Number.isInteger(r.tipAmount * 100)).toBe(true)
  })
})
