# Coach Architecture v1.2
*SolviqLab — AI Coach System Design*

*Status: Approved (v1.1). Implementation may begin.*
*Owner: Product Director*
*Date: 2026-07-23*
*Changes from v1.1: Priority as named type (not numbers), Trigger → Decision → Reason → Recommendation split, coach_version added.*

---

## What Coach Is — And Is Not

**Is:** A Runtime interpreter. Coach reads existing data (IntentState, Assessment, Strategy, Plan) and translates it into contextual human language. It explains what happened, what it means, and what to do next.

**Is not:** A chatbot. A GPT wrapper. A conversational interface. A new engine.

The user should never feel they are "talking to AI." They should feel that someone who knows their data is speaking directly to them.

---

## Part 0 — Success Metrics

Coach exists to move users forward through their journey. These are the measurable outcomes that define success:

| Metric | Definition | Target |
|--------|-----------|--------|
| **Next-step CTR after Coach message** | % of users who click the Coach's primary action | +15% vs. no Coach |
| **Assessment completion rate** | % of users who complete Assessment after Coach explains it | Baseline on first deploy |
| **Plan creation rate** | % of assessed users who set a goal and create a plan | Baseline on first deploy |
| **Weekly check-in rate** | % of active-plan users who check in each week | >60% |
| **Journey abandonment** | % of users who stop after step 1 (calculator only) | Reduce from baseline |
| **Message dismissal rate** | % of Coach messages explicitly closed without action | <30% (high = irrelevant messages) |

**Measurement:** All Coach message impressions and CTA clicks tracked via GA4 `coach_message_shown` and `coach_cta_click` events with `trigger`, `type`, and `phase` parameters.

**Baseline rule:** Measure for 7 days before any A/B testing. No optimization before baseline exists.

---

## Core Principle

> The user's own data is the most persuasive argument.
> *(Journey UX Bible v1.0, Part VII)*

Every Coach message must be derivable from `IntentState`. If a message cannot be backed by actual user data — it should not exist.

---

## Part I — Responsibilities

Coach has exactly five responsibilities:

| # | Responsibility | When |
|---|---------------|------|
| 1 | **Explain** | "Your score is 58/100 — here's what that means for your weight plan." |
| 2 | **Encourage** | "Week 3 done. You're ahead of where most people are at this stage." |
| 3 | **Warn** | "Your last check-in shows a 22% gap. Your plan is adapting — here's why." |
| 4 | **Celebrate** | "You did it. 12 weeks. That took consistency." |
| 5 | **Prepare** | "Your strategy is ready. Setting a goal takes 1 minute — here's what to expect." |

Coach never: guesses, makes up data, provides medical advice, or speaks when it has nothing specific to say.

---

## Part II — Inputs

Coach reads **exclusively** from `IntentState` via `getIntentState(cluster)` — P-16 compliance.

```typescript
interface CoachInput {
  readonly intent:  IntentState       // full aggregate — phase, plan, assessment, strategy
  readonly trigger: CoachTrigger      // what event caused this message
  readonly lang:    string            // for future i18n
}
```

No direct engine calls. No network requests. No external APIs (MVP).

### Data Coach can use from IntentState:

| Data | Source | Example use |
|------|--------|-------------|
| Phase | `intent.currentPhase` | Tone selection |
| Score | `intent.latestAssessment.overall_score` | "Your score is 58/100" |
| Top insight | `intent.latestAssessment.insights[0]` | "Your biggest opportunity is..." |
| Dimension with lowest score | `intent.latestAssessment.dimension_scores` | "Focus area: Recovery" |
| Strategy name | `intent.latestStrategy.selected_strategy_name` | "Your Balanced strategy targets..." |
| Plan goal | `intent.activePlan.goal` | "Lose 8kg by March 2027" |
| Plan progress % | derived from check_ins + milestones | "You're 34% of the way there" |
| Last check-in | `intent.activePlan.check_ins.at(-1)` | "Week 3: on track" |
| Deviation % | `lastCheckIn.deviation_percent` | "22% below milestone" |
| Check-ins count | `intent.activePlan.check_ins.length` | "6 weeks of data" |
| Completed instruments | `intent.completedInstruments.length` | "3 data points in your profile" |
| Recommendation | `intent.recommendationDecision.reasons[0]` | Why-this explanation |

---

## Part III — Trigger Events

These are the lifecycle moments that can produce a Coach message.

```typescript
type CoachPriority = 'critical' | 'high' | 'normal' | 'low'
// critical → warning (off-track, overdue), high → celebration/milestone,
// normal → guidance, low → reflection

type CoachReason =
  | 'excellent_score'        // assessment score ≥ 80
  | 'good_score'             // assessment score 60–79
  | 'missing_dimension'      // one cluster dimension scored very low
  | 'low_score'              // assessment score < 60
  | 'on_track'               // check-in deviation within tolerance
  | 'off_track'              // check-in deviation exceeds threshold
  | 'check_in_overdue'       // >7 days since last check-in
  | 'milestone_reached'      // milestone.is_completed flipped to true
  | 'goal_achieved'          // plan.status → 'completed'
  | 'first_result'           // very first instrument result
  | 'assessment_unlocked'    // 3+ instruments completed
  | 'no_context'             // dashboard:viewed with no actionable context

interface CoachDecision {
  readonly trigger: CoachTrigger    // what lifecycle event fired
  readonly reason:  CoachReason     // why this specific message was chosen
}
```

```typescript
type CoachTrigger =
  // Assessment flow
  | 'assessment:completed'       // score just computed
  | 'assessment:strategy_ready'  // strategy selected after assessment

  // Plan flow
  | 'plan:created'               // first plan built (goal set)
  | 'plan:check_in'              // user just logged a check-in
  | 'plan:check_in_overdue'      // >7 days since last check-in
  | 'plan:milestone_reached'     // a milestone marked is_completed
  | 'plan:adapted'               // plan adapted after check-in (deviation detected)
  | 'plan:completed'             // plan status → 'completed'

  // Journey flow
  | 'journey:first_result'       // very first instrument result (welcome)
  | 'journey:assessment_unlocked'// 3+ instruments completed, assessment available

  // Passive
  | 'dashboard:viewed'           // user opens dashboard — show most relevant message
```

**Rule:** Each trigger maps to exactly ONE CoachMessage (or null if no message is appropriate). Never queue multiple messages from one trigger.

---

## Part III.5 — Anti-Spam Rules

Coach must never feel intrusive. These rules are enforced by CoachEngine before generating any message:

| Rule | Definition |
|------|-----------|
| **One message per screen load** | If a message was already shown this session, CoachEngine returns null for all lower-priority triggers |
| **No repeat messages** | If `message_id` is in `CoachMemory.shown_message_ids`, do not show again |
| **Celebration shown once** | `type: 'celebration'` messages are auto-dismissed after first display and never repeated |
| **Warning deactivates when resolved** | A `plan:check_in_overdue` warning must not appear if user just checked in (trigger no longer active) |
| **Cooling period** | Same trigger category cannot fire again within 24 hours (except `dashboard:viewed` which uses `priority` logic) |
| **Empty is valid** | Returning null is always correct. No message is better than an irrelevant message. |

```typescript
// CoachEngine enforces these before calling any handler
function canShow(trigger: CoachTrigger, memory: CoachMemory): boolean {
  // No repeats
  const candidateId = buildMessageId(trigger, cluster, phase)
  if (memory.shown_message_ids.includes(candidateId)) return false

  // Cooling period for same category
  if (memory.last_shown_at) {
    const hoursSince = (Date.now() - new Date(memory.last_shown_at).getTime()) / 3_600_000
    if (hoursSince < 24 && sameCategory(trigger, memory.last_trigger)) return false
  }

  return true
}
```

---

## Part IV — Message Types

```typescript
type CoachMessageType =
  | 'insight'       // explains what the data means
  | 'warning'       // flags something that needs attention
  | 'motivation'    // encourages continued effort
  | 'explanation'   // explains why a recommendation was made
  | 'celebration'   // marks an achievement
  | 'reflection'    // summarizes progress to date
  | 'preparation'   // prepares user for next step
```

### Visual mapping (for UI layer):

| Type | Color | Icon |
|------|-------|------|
| insight | Blue | → |
| warning | Amber | ⚠ |
| motivation | Violet | ↑ |
| explanation | Slate | ◦ |
| celebration | Emerald | ✓ |
| reflection | Blue | ~ |
| preparation | Violet | → |

---

## Part V — Output Contract

```typescript
interface CoachMessage {
  readonly message_id:  string              // deterministic: `${trigger}:${cluster}:${phase}`
  readonly cluster:     IntentCluster
  readonly phase:       IntentPhase
  readonly decision:    CoachDecision       // trigger + reason that produced this message
  readonly type:        CoachMessageType
  readonly priority:    CoachPriority       // 'critical' | 'high' | 'normal' | 'low'
  readonly title:       string              // 1 sentence, max ~60 chars
  readonly body:        string              // 1–2 sentences. Data-specific.
  readonly actions:     readonly CoachAction[]  // 0–2 actions
  readonly generated_at: string            // ISO timestamp
  readonly data_snapshot: {               // what data was used to generate this message
    readonly score?:        number
    readonly strategy?:     string
    readonly week?:         number
    readonly progress_pct?: number
    readonly deviation?:    number
  }
}

interface CoachAction {
  readonly label: string    // per CTA formula: [Action verb] + [Personal benefit]
  readonly href:  string
  readonly type:  'primary' | 'secondary'
}
```

`data_snapshot` serves two purposes: debugging (why did Coach say this?) and future LLM upgrade path (LLM receives snapshot instead of full IntentState).

---

## Part V.5 — Message Lifecycle

Every CoachMessage passes through these states:

```
generated → displayed → [acknowledged | dismissed] → expired
```

| State | Definition | Triggered by |
|-------|-----------|-------------|
| `generated` | CoachEngine returned a message | `coachEngine.generate()` called |
| `displayed` | Message rendered in UI | Component mounts with message |
| `acknowledged` | User clicked a primary action | CTA click → `coach_cta_click` GA4 event |
| `dismissed` | User closed/ignored the message | Explicit close button OR navigating away |
| `expired` | Trigger condition no longer valid | Check on next screen load |

**State transitions:**
- `displayed` → writes `message_id` to `CoachMemory.shown_message_ids`
- `acknowledged` → writes to `CoachMemory.acknowledged_ids`, celebration messages auto-expire
- `dismissed` → writes to `CoachMemory.dismissed_ids`, message never shown again
- `expired` — checked at generate time: if trigger is no longer valid (e.g., check-in completed after overdue warning), return null

**No persistent UI state is stored for lifecycle** — it is derived from `CoachMemory` on every render.

---

## Part V.6 — Coach Memory

Coach needs minimal persistent memory to enforce Anti-Spam rules and avoid repeating itself.

```typescript
// src/lib/coach/types.ts
interface CoachMemory {
  readonly last_message_id:   string | null    // most recent shown message
  readonly last_trigger:      CoachTrigger | null
  readonly last_shown_at:     string | null    // ISO timestamp
  readonly shown_message_ids: readonly string[]   // all shown (cap at 50)
  readonly acknowledged_ids:  readonly string[]   // user took action
  readonly dismissed_ids:     readonly string[]   // explicitly closed
}
```

**Storage:** `localStorage` key `coach_memory_{cluster}` via UserEngine (same storage pattern as IntentState). One `CoachMemory` per cluster.

**UserEngine additions required:**
```typescript
getCoachMemory(cluster: IntentCluster): CoachMemory
setCoachMemory(cluster: IntentCluster, memory: CoachMemory): void
```

**Memory hygiene:** `shown_message_ids` is capped at 50 entries (FIFO). Older entries are pruned to prevent localStorage bloat.

---

## Part VI — Tone Rules

Tone is determined by `intent.currentPhase`, per Journey UX Bible Part II:

| Phase | Tone | Example |
|-------|------|---------|
| discovery | Warm acknowledgment | "Your first data point is saved." |
| assessment | Reassuring competence | "This score is a starting point, not a verdict." |
| planning | Confident, personal | "Your strategy is built for your pace." |
| execution | Encouraging accountability | "Week 4. You're doing the work." |
| habit | Genuine recognition | "You did it. That took discipline." |

**Rules:**
- Max 2 sentences in `body`
- Always reference a specific data point (score, week, %, name)
- Never say "our algorithm" — say "your data shows"
- Never generic praise — tie it to specific progress

---

## Part VII — Personalization Rules

| Rule | Wrong | Right |
|------|-------|-------|
| Use actual score | "Your assessment is complete." | "Your score is 58/100." |
| Use strategy name | "Your strategy is ready." | "Your Balanced strategy is ready." |
| Use plan goal | "You're making progress." | "You're 34% toward your 74 kg goal." |
| Use check-in count | "Good work." | "Week 5. 5 check-ins in." |
| Use cluster | "Your health journey" | "Your weight journey" |
| Name the dimension | "Focus on improvement." | "Recovery is your biggest opportunity." |

If no specific data is available for a field — the message should not be generated (return null).

---

## Part VIII — Priority & Surfacing Rules

**Only ONE Coach message is visible at a time.** (Single Next Step Principle, UX Bible Part III)

Priority order when multiple triggers could apply:

```
Priority 1 (show first):
  warning > celebration

Priority 2:
  explanation > motivation > preparation

Priority 3:
  reflection > insight
```

**Surfacing locations:**
- `DashboardCoachInsight` — always shows the highest-priority message for the primary cluster
- `AssessmentClient ResultScreen` — shows `assessment:completed` message
- `ActivePlanView` — shows `plan:check_in` or `plan:check_in_overdue`
- `PlannerClient CompletedState` — shows `plan:completed` celebration

Each location requests ONE message for ONE trigger. The Coach decides if a message should be shown.

---

## Part IX — Three-Layer Architecture

Coach separates **what to say** from **how to say it** from **how to display it**.

```
CoachEngine.recommend()
       ↓
CoachRecommendation   ← what Coach decided (data only, no text)
       ↓
CoachRenderer.render()
       ↓
CoachMessage          ← what the UI receives (text + actions)
       ↓
UI Component          ← renders the message (DashboardCoachInsight etc.)
```

This separation allows future renderers (card, video, checklist) without changing CoachEngine.

### CoachRecommendation (data layer)

```typescript
// What Coach decided — no rendered text yet
interface CoachRecommendation {
  readonly recommendation_id: string       // deterministic: `${trigger}:${cluster}:${phase}`
  readonly cluster:    IntentCluster
  readonly phase:      IntentPhase
  readonly decision:   CoachDecision       // what fired + why this specific message was chosen
  readonly type:       CoachMessageType
  readonly priority:   CoachPriority       // 'critical' | 'high' | 'normal' | 'low'
  readonly template_id: string             // which copy template to use
  readonly data:       CoachDataContext    // variables for template interpolation
  readonly coach_version: string           // '1.0', '1.1', '2.0' — for analytics attribution
  readonly generated_at: string
}

interface CoachDataContext {
  readonly score?:         number
  readonly strategy?:      string
  readonly week?:          number
  readonly progress_pct?:  number
  readonly deviation?:     number
  readonly dimension?:     string          // lowest-scoring dimension label
  readonly goal?:          string
  readonly check_in_count?: number
}
```

### CoachRenderer (presentation layer)

```typescript
// Turns a recommendation into displayable text
// MVP: TextRenderer (rule-based copy from coach-copy.ts)
// Premium: LLMRenderer (sends data_context to LLM, receives enhanced body)

interface CoachRenderer {
  render(rec: CoachRecommendation, lang: string): CoachMessage
}

class TextRenderer implements CoachRenderer {
  render(rec, lang): CoachMessage {
    const template = COACH_COPY[rec.template_id]   // from coach-copy.ts
    return {
      ...rec,
      title:   interpolate(template.title, rec.data),
      body:    interpolate(template.body,  rec.data),
      actions: template.actions(rec.data, lang),
    }
  }
}
```

### CoachEngine API

```typescript
class CoachEngine {
  /**
   * Decide what to say (recommendation only — no text generation).
   * Returns null if Anti-Spam rules or data conditions prevent a message.
   * Pure function.
   */
  recommend(input: CoachInput, memory: CoachMemory): CoachRecommendation | null
}

// Usage in UI:
const recommendation = coachEngine.recommend({ intent, trigger, lang }, memory)
const message = recommendation ? renderer.render(recommendation, lang) : null
```

### Example handler (assessment:completed)

```typescript
function handleAssessmentCompleted(intent: IntentState): CoachRecommendation | null {
  const { latestAssessment } = intent
  if (!latestAssessment) return null

  const score    = latestAssessment.overall_score
  const lowestDim = [...latestAssessment.dimension_scores]
    .sort((a, b) => a.score - b.score)[0]

  const reason: CoachReason = score >= 80 ? 'excellent_score'
    : score >= 60              ? 'good_score'
    : lowestDim                ? 'missing_dimension'
    :                            'low_score'

  return {
    recommendation_id: `assessment:completed:${intent.clusterId}`,
    cluster:     intent.clusterId,
    phase:       intent.currentPhase,
    decision:    { trigger: 'assessment:completed', reason },
    type:        score >= 60 ? 'insight' : 'explanation',
    priority:    score >= 80 ? 'high' : score >= 60 ? 'normal' : 'critical',
    template_id: reason,                   // directly maps to coach-copy.ts key
    data: {
      score,
      dimension: lowestDim?.label,
      strategy:  intent.latestStrategy?.selected_strategy_name,
    },
    coach_version: COACH_VERSION,
    generated_at: new Date().toISOString(),
  }
}
```

---

## Part X — Runtime Integration

```
solviqlab:result (assessment slug)
    ↓
EventBus P40 → stores AssessmentResult
EventBus P60 → RecommendationEngine refreshes
    ↓
platform:intent_state_updated emitted
    ↓
AssessmentClient listens → reads IntentState
    ↓
CoachEngine.recommend({ intent, trigger: 'assessment:completed', lang }, memory)
    ↓
CoachMessage → rendered in ResultScreen
```

Coach is called **after** IntentState is updated. Never before. Never during pipeline execution.

No new pipeline stages needed for MVP. Coach is a pure read-layer on top of IntentState.

---

## Part XI — Future LLM Integration (Premium Tier)

The architecture is designed so that LLM can replace the `body` field without changing anything else:

```typescript
// MVP (Rule-based)
const message = coachEngine.generate(input)
// message.body = "Your biggest opportunity is Recovery (42/100)."

// Premium (LLM-enhanced)
const message = coachEngine.generate(input)
const enhancedBody = await llm.enhance(message.body, message.data_snapshot)
// enhancedBody = "Recovery is where the plan starts — your 42/100 there is
//                 actually better than most people at the same stage.
//                 The Balanced strategy addresses this in weeks 2–4."
```

LLM receives `data_snapshot` (not full IntentState) — minimal, deterministic context.
`title`, `actions`, `type`, `priority` are always rule-based — never LLM-generated.

---

## Part XII — File Structure

```
src/lib/coach/
  engine.ts          ← CoachEngine class, recommend()
  renderer.ts        ← TextRenderer (MVP), interface CoachRenderer
  types.ts           ← CoachRecommendation, CoachMessage, CoachMemory,
                        CoachTrigger, CoachMessageType, CoachDataContext
  handlers/
    assessment.ts    ← assessment:completed, assessment:strategy_ready
    plan.ts          ← plan:created, plan:check_in, plan:adapted, plan:completed
    journey.ts       ← journey:first_result, journey:assessment_unlocked
    dashboard.ts     ← dashboard:viewed (selects highest-priority for cluster)
  coach-copy.ts      ← all title/body templates as named constants (no inline strings)
  index.ts
```

---

## Part XIII — What Coach Does NOT Do (Scope Boundaries)

| Out of Scope | Why |
|-------------|-----|
| Conversational UI (chatbox) | Coach is a message layer, not a conversation |
| User input / questions | Coach speaks, doesn't listen (MVP) |
| Push notifications | Separate Retention system (V4-5) |
| Medical advice | Legal boundary — never diagnose |
| Predictions | Coach explains past/present, not forecasts |
| Cross-cluster intelligence | Each cluster's Coach is independent (MVP) |
| Emotion detection | No behavioral input — only data input |

---

## Approval Checklist

- [x] Product Director approves this document *(v1.1 — conditional approval)*
- [x] CoachEngine location confirmed (`src/lib/coach/`)
- [x] Three-layer architecture confirmed (Recommendation → Renderer → Message)
- [x] Trigger list confirmed (13 triggers — Part III)
- [x] Message type list confirmed (7 types — Part IV)
- [x] Anti-Spam Rules confirmed (Part III.5)
- [x] Message Lifecycle confirmed (Part V.5)
- [x] Coach Memory confirmed (Part V.6 — `coach_memory_{cluster}` in localStorage)
- [x] Success Metrics confirmed (Part 0)
- [x] Surfacing locations confirmed (4 locations — Part VIII)
- [x] LLM upgrade path confirmed (Part XI — body only, title/actions always rule-based)
- [x] First handler to implement: `assessment:completed`
- [x] UserEngine additions required: `getCoachMemory()`, `setCoachMemory()`

---

*This document defines the architecture only. No code is written until this document is approved.*
*Next document after approval: Coach Implementation Sprint spec.*
*LLM integration spec: Coach_LLM_Integration_v1.md (separate, post-Premium)*
