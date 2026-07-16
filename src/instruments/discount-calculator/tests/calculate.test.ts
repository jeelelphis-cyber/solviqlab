import { describe, it, expect } from 'vitest'
import { calculateDiscountCalculator } from '../lib/calculate.js'

describe('calculateDiscountCalculator', () => {
  it('$80 with 25% discount → save $20, pay $60', () => {
    const result = calculateDiscountCalculator({ originalPrice: 80, discountPercent: 25 })
    expect(result.discountAmount).toBe(20)
    expect(result.finalPrice).toBe(60)
  })

  it('$100 with 10% discount → save $10, pay $90', () => {
    const result = calculateDiscountCalculator({ originalPrice: 100, discountPercent: 10 })
    expect(result.discountAmount).toBe(10)
    expect(result.finalPrice).toBe(90)
  })

  it('$249.99 with 30% discount → save $75.00, pay $174.99', () => {
    // discountAmount = round(249.99 * 30/100 * 100)/100 = round(74997*100)/100
    // = round(7499700)/100 = 74.997 → rounds to 75.00
    const result = calculateDiscountCalculator({ originalPrice: 249.99, discountPercent: 30 })
    expect(result.discountAmount).toBeCloseTo(75.0, 2)
    expect(result.finalPrice).toBeCloseTo(174.99, 2)
  })

  it('50% discount on $200 → save $100, pay $100', () => {
    const result = calculateDiscountCalculator({ originalPrice: 200, discountPercent: 50 })
    expect(result.discountAmount).toBe(100)
    expect(result.finalPrice).toBe(100)
  })
})

describe('calculateDiscountCalculator — edge cases', () => {
  it('0% discount → save $0, pay full price', () => {
    const result = calculateDiscountCalculator({ originalPrice: 150, discountPercent: 0 })
    expect(result.discountAmount).toBe(0)
    expect(result.finalPrice).toBe(150)
  })

  it('100% discount → save everything, pay $0', () => {
    const result = calculateDiscountCalculator({ originalPrice: 99, discountPercent: 100 })
    expect(result.discountAmount).toBe(99)
    expect(result.finalPrice).toBe(0)
  })
})
