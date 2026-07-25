// ─────────────────────────────────────────────────────────────────────────────
// Script Variants — type definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface ScriptVariant {
  readonly id:   string   // e.g. 'opening_empathy_A', 'hook_coach_promise_B'
  readonly text: string
}

export interface SelectedScript {
  readonly text:       string
  readonly variantIds: {
    readonly opening: string
    readonly insight: string
    readonly hook:    string
  }
}

export interface ScriptContext {
  readonly name:    string
  readonly cluster: string        // 'weight' | 'sleep'
  readonly bmiText: string | null
  readonly score:   number | null
  readonly lang:    'en' | 'uk'
}
