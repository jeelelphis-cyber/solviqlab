// ─────────────────────────────────────────────────────────────────────────────
// PolicyEngine — Guard Rails for Platform Actions
//
// Runs after StrategyEngine (P50 in the pipeline).
// Answers: "Is this user allowed to proceed with this action?"
//
// V3-10G: implements core business rules.
// Future: plug in premium gates, age restrictions, health risk flags.
// ─────────────────────────────────────────────────────────────────────────────

import type { PolicyResult, PolicyInput, PolicyViolation } from './types'

export class PolicyEngine {

  check(input: PolicyInput): PolicyResult {
    const violations: PolicyViolation[] = []
    const reasons: string[] = []

    // R-01: Anonymous users must register before saving an adaptive plan
    if (input.userType === 'anonymous') {
      violations.push('registration_required')
      reasons.push('Create a free account to save your personalized plan and track progress.')
    }

    // R-02: One active plan per cluster (prevent plan spam)
    if (input.existingPlanCount >= 1 && input.userType === 'anonymous') {
      // Already covered by registration_required
    }

    // R-03: Assessment score too low → block fast-track (handled by StrategyEngine,
    //        but PolicyEngine provides a second layer)
    if (input.assessmentScore < 20) {
      violations.push('cluster_blocked')
      reasons.push('Your data is insufficient for a reliable plan. Complete more health instruments first.')
    }

    const requiresRegistration = violations.includes('registration_required')
    const requiresPremium      = violations.includes('premium_required')

    return {
      allowed:              violations.length === 0,
      violations,
      reasons,
      requiresRegistration,
      requiresPremium,
    }
  }
}

let _policyEngine: PolicyEngine | null = null
export function getPolicyEngine(): PolicyEngine {
  _policyEngine ??= new PolicyEngine()
  return _policyEngine
}
