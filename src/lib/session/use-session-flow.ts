'use client'

// ─────────────────────────────────────────────────────────────────────────────
// useSessionFlow — React adapter for SessionFlowEngine.
//
// Provides stable state + actions to any component in the flow.
// Engine instance is created once and reused across re-renders.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react'
import { SessionFlowEngine }   from './engine'
import { LocalStorageProvider } from '../user/storage'
import type { SessionState, SessionData, SessionEvent } from './types'

interface SessionFlowActions {
  /** Move to next state in the linear flow, optionally merging data. */
  advance:     (patch?: Partial<SessionData>) => SessionState
  /** Jump to a specific state. */
  goto:        (state: SessionState, patch?: Partial<SessionData>) => void
  /** Merge data without changing state. */
  setData:     (patch: Partial<SessionData>) => void
  /** Fire an explicit analytics event. */
  track:       (event: SessionEvent, meta?: Record<string, unknown>) => void
  /** Reset the session. */
  reset:       () => void
  /** Whether this state has been completed. */
  isCompleted: (state: SessionState) => boolean
}

export interface SessionFlow {
  state:     SessionState
  data:      Readonly<SessionData>
  sessionId: string
  actions:   SessionFlowActions
}

export function useSessionFlow(userId: string): SessionFlow {
  const engineRef = useRef<SessionFlowEngine | null>(null)

  // Lazy-init engine (runs only once per mount)
  if (!engineRef.current) {
    engineRef.current = new SessionFlowEngine(new LocalStorageProvider(), userId)
  }

  const engine = engineRef.current

  const [state, setStateLocal]  = useState<SessionState>(engine.getState())
  const [data,  setDataLocal]   = useState<Readonly<SessionData>>(engine.getData())

  const advance = useCallback((patch?: Partial<SessionData>): SessionState => {
    const next = engine.advance(patch)
    setStateLocal(engine.getState())
    setDataLocal(engine.getData())
    return next
  }, [engine])

  const goto = useCallback((nextState: SessionState, patch?: Partial<SessionData>): void => {
    engine.goto(nextState, patch)
    setStateLocal(engine.getState())
    setDataLocal(engine.getData())
  }, [engine])

  const setData = useCallback((patch: Partial<SessionData>): void => {
    engine.setData(patch)
    setDataLocal(engine.getData())
  }, [engine])

  const track = useCallback((event: SessionEvent, meta?: Record<string, unknown>): void => {
    engine.track(event, meta)
  }, [engine])

  const reset = useCallback((): void => {
    engine.reset()
    setStateLocal(engine.getState())
    setDataLocal(engine.getData())
  }, [engine])

  const isCompleted = useCallback((s: SessionState): boolean => {
    return engine.isCompleted(s)
  }, [engine])

  return {
    state,
    data,
    sessionId: engine.getSessionId(),
    actions: { advance, goto, setData, track, reset, isCompleted },
  }
}
