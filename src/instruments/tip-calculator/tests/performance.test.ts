import { describe, it, expect } from 'vitest'
import { calculateTip } from '../lib/calculate.js'

describe('calculateTip — performance', () => {
  it('single calculation completes in < 5ms', () => {
    const start = performance.now()
    calculateTip({ billAmount: 85, tipPercent: 20, numPeople: 4, taxPercent: 8 })
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(5)
  })

  it('1000 calculations complete in < 100ms total', () => {
    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      calculateTip({ billAmount: 50 + i, tipPercent: 15, numPeople: (i % 10) + 1, taxPercent: i % 30 })
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(100)
  })

  it('each of 1000 calculations averages < 5ms', () => {
    const iterations = 1000
    const start = performance.now()
    for (let i = 0; i < iterations; i++) {
      calculateTip({ billAmount: 100, tipPercent: 20, numPeople: 4, taxPercent: 8 })
    }
    const avgMs = (performance.now() - start) / iterations
    expect(avgMs).toBeLessThan(5)
  })
})
