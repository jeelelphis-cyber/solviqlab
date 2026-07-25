// ─────────────────────────────────────────────────────────────────────────────
// ResponseValidator — validates LLM output before it reaches the user.
//
// Single responsibility: run all safety checks on a completed response
// and return a structured decision. Owns SafetyPolicy.
// ─────────────────────────────────────────────────────────────────────────────

import type { SafetyPolicy, SafetyResult } from '../safety-policy'

export interface ValidationResult {
  readonly passed:  boolean
  readonly reason:  string | null
  readonly layer:   'input' | 'output'
}

export class ResponseValidator {
  constructor(private readonly safetyPolicy: SafetyPolicy) {}

  checkInput(userMessage: string): ValidationResult {
    const result = this.safetyPolicy.checkInput(userMessage)
    return { passed: result.passed, reason: result.reason, layer: 'input' }
  }

  checkOutput(content: string): ValidationResult {
    const result = this.safetyPolicy.checkOutput(content)
    return { passed: result.passed, reason: result.reason, layer: 'output' }
  }
}
