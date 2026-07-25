// ─────────────────────────────────────────────────────────────────────────────
// DecisionEngineImpl — deterministic rule-based decision engine for Coach Brain.
//
// Evaluates CoachPersonaConfig.decisionRules against the current UserGraph.
// No LLM calls here — pure rule evaluation. Same graph + same rules = same result.
//
// Architecture Bible v2.1 §03 P-17: Brain never knows which persona it runs.
// The persona config carries all decision logic. DecisionEngine is persona-agnostic.
//
// IMPORTANT: CoachDecisionRule.condition is a human-readable string today.
// Until the Rule Engine Spec DSL lands (AR-1 required before Phase 2B), personas
// supply an EvaluableDecisionRule with a real predicate function. The engine
// accepts both: real predicate takes priority, string condition falls back to
// always-true (acts as "default / catch-all" rule).
// ─────────────────────────────────────────────────────────────────────────────

import type { UserGraph }            from '../../graph/types'
import type { CoachPersonaConfig, CoachDecisionRule, CoachAction } from '../contracts'
import type { CoachDecision, ScriptType, MotivationState, CoachPersonaId } from '../domain/types'

// ── EvaluableDecisionRule ─────────────────────────────────────────────────────

/**
 * Extends CoachDecisionRule with an optional real predicate.
 *
 * Personas that want deterministic evaluation supply `evaluate`.
 * If omitted, the rule always matches (useful for default / fallback rules).
 * When the Rule Engine Spec DSL lands, this interface will be replaced by
 * the compiled DSL expression — shape-compatible, so callers won't break.
 */
export interface EvaluableDecisionRule extends CoachDecisionRule {
  /**
   * Optional runtime predicate. Receives the full UserGraph and returns
   * true when the condition described by `condition` is satisfied.
   *
   * If not provided, the condition is treated as always-true.
   */
  readonly evaluate?: (graph: UserGraph) => boolean
}

// ── CoachPersonaConfigWithEvaluableRules ─────────────────────────────────────

/**
 * CoachPersonaConfig variant where decisionRules may include runtime predicates.
 * The Brain accepts this type so persona configs can supply real evaluators.
 */
export interface CoachPersonaConfigWithEvaluableRules
  extends Omit<CoachPersonaConfig, 'decisionRules'> {
  readonly decisionRules: readonly EvaluableDecisionRule[]
}

// ── Default values derived from CoachAction ───────────────────────────────────

function defaultScriptTypeForAction(action: CoachAction): ScriptType {
  if (action.type === 'set_script_type') return action.value
  return 'morning_standard'
}

function defaultMotivationState(action: CoachAction): MotivationState {
  if (action.type === 'set_motivation_state') return action.value
  return 'medium'
}

function defaultInterventionLevel(
  action: CoachAction,
): 1 | 2 | 3 | 4 | 5 | null {
  if (action.type === 'set_intervention_level') return action.value
  return null
}

// ── DecisionEngineImpl ────────────────────────────────────────────────────────

export class DecisionEngineImpl {
  /**
   * Evaluate all decision rules in descending priority order.
   * Returns an array with at most one CoachDecision (the winning rule).
   * Returns an empty array if no rules match.
   *
   * @param graph   - Current UserGraph for the user.
   * @param persona - CoachPersonaConfig carrying the decision rules to evaluate.
   * @param userId  - User ID to stamp into the resulting decision.
   * @param trigger - Trigger label stamped into the decision for audit traceability.
   */
  async evaluate(
    graph:   UserGraph,
    persona: CoachPersonaConfig | CoachPersonaConfigWithEvaluableRules,
    userId:  string,
    trigger: string,
  ): Promise<readonly CoachDecision[]> {
    // Sort rules by priority descending; first matching rule wins.
    const sorted = [...persona.decisionRules].sort((a, b) => b.priority - a.priority)

    let winner: EvaluableDecisionRule | null = null

    for (const rawRule of sorted) {
      const rule = rawRule as EvaluableDecisionRule

      const matches = typeof rule.evaluate === 'function'
        ? rule.evaluate(graph)
        : true   // string-only condition = always-true (catch-all / default behaviour)

      if (matches) {
        winner = rule
        break
      }
    }

    if (winner === null) return []

    const action     = winner.action
    const scriptType = defaultScriptTypeForAction(action)
    const motState   = defaultMotivationState(action)
    const intLevel   = defaultInterventionLevel(action)

    const decision: CoachDecision = {
      decisionId:        crypto.randomUUID(),
      userId,
      personaId:         persona.coachId as unknown as CoachPersonaId,
      trigger,
      scriptType,
      motivationState:   motState,
      interventionLevel: intLevel,
      rationale:         winner.condition,   // human-readable — the condition string
      firedRuleId:       winner.ruleId,
      decidedAt:         new Date().toISOString(),
    }

    return [decision]
  }
}
