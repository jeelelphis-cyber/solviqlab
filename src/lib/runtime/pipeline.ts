import type { EventHandler } from '../events/types'

// ── PipelineStage ─────────────────────────────────────────────────────────────
// A single stage in the platform pipeline.
// Each stage maps to one domain service with an explicit priority.

export interface PipelineStage {
  readonly name: string
  readonly priority: number
  readonly description: string
  readonly async?: boolean
  readonly build: () => EventHandler['handle']
}

// ── PipelineDefinition ────────────────────────────────────────────────────────
// Declarative description of the platform pipeline.
// Defines what runs, in what order, and why.
//
// V3-10F.1: Add a new capability = add one entry here.
// EventBus ordering is derived from this definition — never hardcoded.

export interface PipelineDefinition {
  readonly name: string
  readonly version: string
  readonly stages: readonly PipelineStage[]
}

// ── buildHandlers ─────────────────────────────────────────────────────────────
// Converts a PipelineDefinition into EventHandler[] for EventBus registration.
// This is the bridge between declarative config and runtime execution.

export function buildHandlers(definition: PipelineDefinition): EventHandler[] {
  return definition.stages.map(stage => ({
    name:     `[${definition.name}] ${stage.name}`,
    priority: stage.priority,
    async:    stage.async ?? false,
    handle:   stage.build(),
  }))
}
