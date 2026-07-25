// ─────────────────────────────────────────────────────────────────────────────
// SafetyPolicy — guards input and output at the LLM boundary.
//
// Phase 1: Pattern-based blocking (prompt injection, medical claims).
// Phase 3+: LLM-based safety classifier as a second pass.
// ─────────────────────────────────────────────────────────────────────────────

export interface SafetyResult {
  readonly passed: boolean
  readonly reason: string | null
  readonly action: 'allow' | 'block'
}

const PROMPT_INJECTION_PATTERNS = [
  /ignore (all |previous |prior )?instructions/i,
  /you are now/i,
  /forget (everything|your|all)/i,
  /\[system\]/i,
  /\<\|im_start\|\>/i,
]

const MAX_INPUT_LENGTH = 2000

const MEDICAL_CLAIM_PATTERNS = [
  /you (have|may have|likely have) (cancer|diabetes|covid|depression)/i,
  /you (should|must) (stop|start) taking/i,
  /(will|can) cure your/i,
  /guaranteed (to|results?)/i,
]

export class SafetyPolicy {
  checkInput(message: string): SafetyResult {
    if (message.length > MAX_INPUT_LENGTH) {
      return { passed: false, reason: 'Message too long', action: 'block' }
    }

    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (pattern.test(message)) {
        return { passed: false, reason: 'Prompt injection detected', action: 'block' }
      }
    }

    return { passed: true, reason: null, action: 'allow' }
  }

  checkOutput(response: string): SafetyResult {
    for (const pattern of MEDICAL_CLAIM_PATTERNS) {
      if (pattern.test(response)) {
        return { passed: false, reason: 'Medical claim detected in output', action: 'block' }
      }
    }

    return { passed: true, reason: null, action: 'allow' }
  }
}

export const safetyPolicy = new SafetyPolicy()
