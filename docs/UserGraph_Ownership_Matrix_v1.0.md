# UserGraph Ownership Matrix v1.0
## SolviqLab Coach Platform — Mia

**Document type:** Product Specification  
**Version:** 1.0  
**Date:** 2026-07-25  
**Status:** Foundational — governs all data ownership in the Coach Platform  
**Author:** Product Architecture  
**Source of truth for types:** `/Users/macbook/AIFabrica/CALCO/apps/web/src/lib/graph/types.ts`

---

## Purpose

This document establishes ownership of every field in `UserGraph`. Every field has exactly one owner. Only the owner may write. Any engine may read from any field.

**Why this matters:** Without a single owner per field, two engines will eventually write conflicting values to the same field. In a localStorage system with no server arbitration, conflicts are silent and corrupt user data permanently. This document prevents that by making ownership a named rule enforced in code review.

**Enforcement:** In code review, any write to a `UserGraph` field that does not come from the field's declared owner in this document must be rejected.

---

## Definitions

| Term | Definition |
|------|-----------|
| **Owner** | The single engine or component authorized to write this field |
| **Reader** | Any engine or component that reads this field (no restriction) |
| **Written When** | The event or lifecycle moment that triggers a write |
| **PII** | Personally Identifiable Information — subject to GDPR/CCPA |
| **Behavioral** | Inferred from user behavior — never directly stated |
| **Computed** | Derived algorithmically from other fields |
| **Stated** | Directly entered by the user |

---

## Engine Registry

The following engines are recognized owners. Any new engine must be registered here before being granted write access.

| Engine ID | Location | Responsibility |
|-----------|----------|---------------|
| `UserEngine` | EventBus P10 | User identity initialization |
| `ProfileEngine` | EventBus P20 | Assessment scoring and profile recalculation |
| `RecommendationEngine` | EventBus P40 | Next-step recommendations |
| `AnalyticsEngine` | EventBus P80 | Analytics (fire-and-forget, no graph writes) |
| `CoachBrain` | `src/lib/coach/brain/` | Memory, goals, habits, communication style |
| `JourneyEngine` | `src/lib/journey/` | Journey phase, progress, completed steps |
| `AssessmentEngine` | `src/lib/assessment/` | Assessment scores and confidence |
| `IdentityEngine` | Registration/auth flow | Identity fields (name, userType) |
| `CoachPlannerImpl` | `src/lib/coach/planner/` | Daily plan and task assignments |
| `SchedulerEngine` | `src/lib/coach/scheduler/` | Daily history timestamps |
| `RetentionEngine` | `src/lib/retention/` | Dormancy and reminder tracking |
| `PremiumEngine` | `src/lib/premium/` | Tier, quotas, entitlements |
| `PreferencesEngine` | Settings component | User preferences |

---

## COMPLETE OWNERSHIP MATRIX

---

### Node: `identity` (IdentityNode)

| Field | Owner | Read By | Written When | Type | Sensitive |
|-------|-------|---------|-------------|------|-----------|
| `identity.name` | `IdentityEngine` | CoachBrain, RendererEngine, all templates | Registration form submission OR coach quiz name question | Stated | PII |
| `identity.userType` | `IdentityEngine` | PremiumEngine, all engines | Registration completed (→ `'authenticated'`) or on init (→ `'anonymous'`) | Computed | No |
| `identity.language` | `UserEngine` | All templating engines | First page load (inferred from URL locale `[lang]`) | Behavioral | No |
| `identity.timezone` | `UserEngine` | SchedulerEngine, RetentionEngine | First page load (`Intl.DateTimeFormat().resolvedOptions().timeZone`) | Behavioral | No |
| `identity.age` | `IdentityEngine` | CoachBrain, AssessmentEngine | Registration form (if collected) or calculator input (BMR/TDEE asks age) | Stated | PII |
| `identity.updatedAt` | `UserEngine` | Diagnostics only | On any UserEngine write | Computed | No |
| `identity.confidence` | `UserEngine` | Diagnostics | On UserEngine write | Computed | No |

**Privacy note:** `identity.name` and `identity.age` are PII. They must not appear in analytics event payloads in raw form. Age may appear as a bucketed range (18-24, 25-34, etc.).

---

### Node: `goals` (GoalsNode)

| Field | Owner | Read By | Written When | Type | Sensitive |
|-------|-------|---------|-------------|------|-----------|
| `goals.items` | `CoachBrain` | CoachPlannerImpl, DecisionEngine, all recommendation engines | Coach quiz completion, chat interaction, or explicit goal setting | Stated | Behavioral |
| `goals.items[n].id` | `CoachBrain` | All (read-only ID) | On goal creation | Computed | No |
| `goals.items[n].text` | `CoachBrain` | CoachPlannerImpl, Renderer | On goal creation from quiz answers | Stated | Behavioral |
| `goals.items[n].status` | `CoachBrain` | JourneyEngine, DecisionEngine | When goal status changes (active → completed → paused) | Computed | No |
| `goals.items[n].priority` | `CoachBrain` | CoachPlannerImpl | On goal creation; inferred from quiz urgency signals | Behavioral | No |
| `goals.items[n].addedAt` | `CoachBrain` | RetentionEngine | On goal creation | Computed | No |
| `goals.updatedAt` | `CoachBrain` | Diagnostics | On any goal write | Computed | No |
| `goals.confidence` | `CoachBrain` | DecisionEngine | Updated when goal confidence changes | Computed | No |

**Conflict rule:** If CoachBrain attempts to write a goal with the same `text` as an existing goal, it must update the existing entry rather than create a duplicate. Duplicate detection is case-insensitive, trimmed.

---

### Node: `habits` (HabitsNode)

| Field | Owner | Read By | Written When | Type | Sensitive |
|-------|-------|---------|-------------|------|-----------|
| `habits.items` | `CoachBrain` | CoachPlannerImpl, AssessmentEngine | Coach quiz completion; assessment flow habit questions | Stated | Behavioral |
| `habits.items[n].id` | `CoachBrain` | All (read-only ID) | On habit creation | Computed | No |
| `habits.items[n].name` | `CoachBrain` | CoachPlannerImpl, Renderer | On habit creation | Stated | Behavioral |
| `habits.items[n].frequency` | `CoachBrain` | CoachPlannerImpl | On habit creation (inferred from quiz response) | Behavioral | No |
| `habits.items[n].sentiment` | `CoachBrain` | DecisionEngine, CoachPlannerImpl | On habit creation (inferred from quiz emotional tone) | Behavioral | No |
| `habits.updatedAt` | `CoachBrain` | Diagnostics | On any habit write | Computed | No |
| `habits.confidence` | `CoachBrain` | DecisionEngine | On habit confidence update | Computed | No |

---

### Node: `assessments` (AssessmentsNode)

| Field | Owner | Read By | Written When | Type | Sensitive |
|-------|-------|---------|-------------|------|-----------|
| `assessments.items` | `AssessmentEngine` | CoachBrain, ProfileEngine, DecisionEngine, CoachPlannerImpl | `platform:assessment_completed` fires; preliminary score on calculator result | Computed | No |
| `assessments.items[n].clusterId` | `AssessmentEngine` | All | On assessment entry creation | Computed | No |
| `assessments.items[n].score` | `AssessmentEngine` | CoachBrain, DecisionEngine, UI | After scoring algorithm runs | Computed | No |
| `assessments.items[n].confidence` | `AssessmentEngine` | CoachBrain, DecisionEngine | Updated as more instruments complete | Computed | No |
| `assessments.items[n].assessedAt` | `AssessmentEngine` | RetentionEngine, JourneyEngine | On assessment completion | Computed | No |
| `assessments.updatedAt` | `AssessmentEngine` | Diagnostics | On any assessment write | Computed | No |
| `assessments.confidence` | `AssessmentEngine` | Diagnostics | On AssessmentEngine write | Computed | No |

**Important:** `ProfileEngine` (P20) reads assessments to compute `overallConfidenceDelta` but does NOT write to `assessments`. `ProfileEngine` writes to its own internal state only. The `platform:profile_recalculated` event carries the computed output.

---

### Node: `journey` (JourneyNode)

| Field | Owner | Read By | Written When | Type | Sensitive |
|-------|-------|---------|-------------|------|-----------|
| `journey.activeCluster` | `JourneyEngine` | CoachBrain, DecisionEngine, CoachPlannerImpl, UI | Calculator result processed (inferred cluster) OR assessment completed | Behavioral | No |
| `journey.currentPhase` | `JourneyEngine` | CoachBrain, CoachStateMachine, UI | State machine transition (see `COACH_TRANSITIONS` in state-machine/types.ts) | Computed | No |
| `journey.progress` | `JourneyEngine` | UI, CoachBrain | On task completion, milestone, or plan delivery | Computed | No |
| `journey.completedSteps` | `JourneyEngine` | CoachBrain, DecisionEngine, GateEngine | After each step completion event | Computed | No |
| `journey.updatedAt` | `JourneyEngine` | Diagnostics | On any journey write | Computed | No |
| `journey.confidence` | `JourneyEngine` | Diagnostics | On JourneyEngine write | Computed | No |

**Conflict rule:** `journey.completedSteps` is append-only. Steps are never removed. If the same step would be added twice (idempotency), the write is silently skipped. Step ID uniqueness is enforced by the JourneyEngine before writing.

---

### Node: `coachMemory` (CoachMemoryNode)

| Field | Owner | Read By | Written When | Type | Sensitive |
|-------|-------|---------|-------------|------|-----------|
| `coachMemory.facts` | `CoachBrain` | LLM prompt builder, Renderer, all coach templates | On `mia_fact_stored`, quiz completion, milestone reached, reactivation | Behavioral | Behavioral |
| `coachMemory.facts[n].id` | `CoachBrain` | All (read-only) | On fact creation | Computed | No |
| `coachMemory.facts[n].text` | `CoachBrain` | LLM, templates | On fact creation | Behavioral | Behavioral |
| `coachMemory.facts[n].category` | `CoachBrain` | DecisionEngine | On fact creation | Computed | No |
| `coachMemory.facts[n].importance` | `CoachBrain` | LLM (context prioritization) | On fact creation | Computed | No |
| `coachMemory.facts[n].addedAt` | `CoachBrain` | RetentionEngine | On fact creation | Computed | No |
| `coachMemory.communicationStyle` | `CoachBrain` | Renderer, LLM prompt builder | After coach quiz completion (inferred from answer patterns) | Behavioral | No |
| `coachMemory.preferredTopics` | `CoachBrain` | RecommendationEngine | Inferred from calculator usage patterns, quiz answers | Behavioral | No |
| `coachMemory.updatedAt` | `CoachBrain` | Diagnostics | On any coachMemory write | Computed | No |
| `coachMemory.confidence` | `CoachBrain` | DecisionEngine | On CoachBrain write | Computed | No |

**Privacy note:** `coachMemory.facts` may contain sensitive personal data (weight, medical conditions, emotional state). Do not expose in URLs, logs, or analytics payloads. In GA4, send `fact_count` not `fact_text`.

**Fact limit:** Maximum 50 facts. When the limit is reached, `CoachBrain` must prune facts with `importance: 'low'` that are older than 30 days. Pruning is logged but not reversible.

---

### Node: `preferences` (PreferencesNode)

| Field | Owner | Read By | Written When | Type | Sensitive |
|-------|-------|---------|-------------|------|-----------|
| `preferences.language` | `PreferencesEngine` | All templating engines, SchedulerEngine | Settings change OR URL locale change | Stated | No |
| `preferences.responseLength` | `PreferencesEngine` | LLM prompt builder, Renderer | Settings change OR inferred from user reading pattern | Stated/Behavioral | No |
| `preferences.notificationsEnabled` | `PreferencesEngine` | SchedulerEngine, RetentionEngine | User toggles notifications in settings OR browser permission response | Stated | No |
| `preferences.updatedAt` | `PreferencesEngine` | Diagnostics | On any preferences write | Computed | No |
| `preferences.confidence` | `PreferencesEngine` | Diagnostics | On PreferencesEngine write | Computed | No |

**Note:** `preferences.language` and `identity.language` may diverge. `preferences.language` is the user's explicit setting. `identity.language` is inferred from the URL. The Renderer must use `preferences.language` when it exists; fall back to `identity.language` otherwise.

---

### Node: `retention` (RetentionNode)

| Field | Owner | Read By | Written When | Type | Sensitive |
|-------|-------|---------|-------------|------|-----------|
| `retention.daysSinceActive` | `RetentionEngine` | CoachBrain, UI, GateEngine | Nightly scheduled check; on `morning_checkin_completed` (reset to 0) | Computed | No |
| `retention.dormancyLevel` | `RetentionEngine` | CoachBrain, NotificationEngine | On `inactivity_detected` event | Computed | No |
| `retention.lastReminderFiredAt` | `RetentionEngine` | RetentionEngine (cooldown check) | On `reengagement_triggered` | Computed | No |
| `retention.updatedAt` | `RetentionEngine` | Diagnostics | On any retention write | Computed | No |
| `retention.confidence` | `RetentionEngine` | Diagnostics | On RetentionEngine write | Computed | No |

**Conflict rule:** `retention.daysSinceActive` is computed from actual timestamps in `dailyHistory`. It must never be manually set to an arbitrary value. The RetentionEngine computes it by comparing `dailyHistory.entries[last_entry].date` to today's date.

---

### Node: `premium` (PremiumNode)

| Field | Owner | Read By | Written When | Type | Sensitive |
|-------|-------|---------|-------------|------|-----------|
| `premium.tier` | `PremiumEngine` | All feature-gated components, CoachBrain, SchedulerEngine | Registration (→ `'free'`), payment (→ `'pro'`), cancellation expiry (→ `'free'`) | Stated | No |
| `premium.quotaUsedToday` | `PremiumEngine` | All quota-limited features | On each quota-consuming action (LLM call, video generation) | Computed | No |
| `premium.quotaLimit` | `PremiumEngine` | All quota-limited features | On tier change | Computed | No |
| `premium.updatedAt` | `PremiumEngine` | Diagnostics | On any premium write | Computed | No |
| `premium.confidence` | `PremiumEngine` | Diagnostics | On PremiumEngine write | Computed | No |

**Security note:** `premium.tier` in localStorage is the client-side cache. For any paid feature access decision, the canonical source is the server/payment provider (Stripe). The localStorage value is used for UI rendering only. Never use localStorage `premium.tier` alone to gate server-side operations.

---

### Node: `dailyHistory` (DailyHistoryNode)

| Field | Owner | Read By | Written When | Type | Sensitive |
|-------|-------|---------|-------------|------|-----------|
| `dailyHistory.entries` | `SchedulerEngine` (entry creation) | CoachBrain, RetentionEngine, UI analytics | On first interaction of the day (creates today's entry) | Computed | No |
| `dailyHistory.entries[n].date` | `SchedulerEngine` | All | On entry creation | Computed | No |
| `dailyHistory.entries[n].morningVideoWatched` | `SchedulerEngine` | CoachBrain, UI | On `mia_video_watched` event | Computed | No |
| `dailyHistory.entries[n].eveningCheckinDone` | `SchedulerEngine` | CoachBrain, UI | On `evening_checkin_completed` event | Computed | No |
| `dailyHistory.entries[n].tasksAssigned` | `CoachPlannerImpl` | UI, CoachBrain | On `today_plan_generated` event | Computed | No |
| `dailyHistory.entries[n].tasksCompleted` | `CoachPlannerImpl` | CoachBrain, UI, RetentionEngine | On `today_plan_task_completed` event | Computed | No |
| `dailyHistory.entries[n].moodValue` | `SchedulerEngine` | CoachBrain, LLM, UI charts | On morning or evening check-in | Stated | Behavioral |
| `dailyHistory.entries[n].moodContext` | `SchedulerEngine` | CoachBrain | On check-in (identifies which check-in wrote the value) | Computed | No |
| `dailyHistory.entries[n].energyValue` | `SchedulerEngine` | CoachBrain, LLM, UI charts | On morning or evening check-in | Stated | Behavioral |
| `dailyHistory.entries[n].energyContext` | `SchedulerEngine` | CoachBrain | On check-in | Computed | No |
| `dailyHistory.entries[n].notes` | `SchedulerEngine` | CoachBrain, LLM | On check-in (if user adds free-text note) | Stated | PII-adjacent |
| `dailyHistory.entries[n].videoWatchDuration` | `SchedulerEngine` | CoachBrain, AnalyticsEngine | On `mia_video_watched` | Computed | No |
| `dailyHistory.updatedAt` | `SchedulerEngine` | Diagnostics | On any dailyHistory write | Computed | No |
| `dailyHistory.confidence` | `SchedulerEngine` | Diagnostics | On SchedulerEngine write | Computed | No |

**Retention rule:** Maximum 90 entries. When the 91st entry is created, the oldest entry is pruned automatically by `SchedulerEngine`. Pruned entries cannot be recovered (localStorage has no archive tier). This is a known limitation — cloud sync (future) will resolve this.

**Privacy note:** `dailyHistory.entries[n].notes` may contain sensitive free-text about the user's health, emotions, or life circumstances. Treat as PII-adjacent. Do not log or expose in analytics.

---

### Root-Level Fields (UserGraph)

| Field | Owner | Read By | Written When | Type | Sensitive |
|-------|-------|---------|-------------|------|-----------|
| `userId` | `UserEngine` | All | On UserGraph creation (first calculator use) | Computed | No (it's a random UUID) |
| `createdAt` | `UserEngine` | Diagnostics, analytics | On UserGraph creation (once only) | Computed | No |
| `updatedAt` | `UserEngine` | Diagnostics, sync | On any graph write (root level) | Computed | No |
| `version` | `UserEngine` | Migration system | On schema version change | Computed | No |

---

## Write Conflict Resolution

### Rule 1: Single Owner, No Exceptions
If two engines attempt to write the same field, the build fails at code review — not at runtime. Ownership violations are structural, not race conditions.

### Rule 2: Append-Only Arrays
`goals.items`, `habits.items`, `assessments.items`, `coachMemory.facts`, `journey.completedSteps`, `dailyHistory.entries` — these are append-only. The owner appends; it never replaces the array. Deletes are explicit operations with dedicated methods.

### Rule 3: Entry ID Deduplication
Before appending to any items array, the owner must check if an entry with the same logical identity (by `id`, by `clusterId`, or by `text` for facts) already exists. If yes: update the existing entry. Never create duplicates.

### Rule 4: Timestamp Authority
`updatedAt` on each node is always the ISO timestamp of the most recent write to that node. The node owner is responsible for setting it on every write. The GraphUpdater utility must enforce this.

### Rule 5: Null Safety
No engine may write `undefined` to a field. If a value is unknown, it must be written as `null`. The TypeScript types enforce this at compile time — all optional fields use `T | null`, not `T | undefined`.

---

## Field Lifecycle

### Creation
Fields are created when their owning engine first writes to them. Fields that are required for a functioning UserGraph are initialized by `UserEngine` on graph creation with sensible defaults (empty arrays, `null` for optional scalars).

### Update
Each write overwrites the previous value (for scalars) or appends a new entry (for arrays). Ownership determines who may update.

### Archival
There is no soft-delete or archival in the current localStorage system. Deleted data is removed from the array permanently. When goals are completed, their `status` changes to `'completed'` — they are NOT removed from the array. This allows Mia to reference past goals.

### Pruning
`dailyHistory.entries`: Pruned at 90 entries by `SchedulerEngine`.  
`coachMemory.facts`: Pruned at 50 entries by `CoachBrain` (removes oldest low-importance facts).

---

## Migration Rules

The UserGraph `version` field enables schema migrations when the types change.

### Current version: 1

### Migration strategy (localStorage-only era)
1. On app init, `UserEngine` reads `UserGraph.version` from localStorage.
2. If `version < CURRENT_VERSION`, run the migration chain.
3. Each migration is a pure function: `(graph: UserGraph_vN) => UserGraph_v(N+1)`.
4. Migrations are stored in `/src/lib/graph/migrations/`.
5. After migration completes, write the migrated graph back to localStorage.
6. If migration fails: do NOT clear the graph. Log the error and serve the old graph (partial data is better than no data).

### Breaking changes (requires migration)
- Adding a required field → migration sets the field to its default value
- Renaming a field → migration copies old field to new, deletes old
- Changing a field type → migration converts existing values to new type

### Non-breaking changes (no migration)
- Adding a new optional field (`T | null`) → reads as `null` in old graphs, handled by `?? null` defaults
- Adding new array entries → backward compatible

---

## Privacy Classification

| Classification | Fields | Handling |
|---------------|--------|---------|
| **PII** | `identity.name`, `identity.age` | Never log, never send to GA4 raw, encrypt in cloud sync |
| **PII-adjacent** | `dailyHistory.entries[n].notes`, `coachMemory.facts[n].text` (if contains health data) | Do not expose in URLs or analytics; cloud encrypted |
| **Behavioral** | `goals.items[n].text`, `habits.items`, `assessments.items`, `coachMemory.communicationStyle` | May use in product analytics (aggregated) but not in ad targeting |
| **Computed/Technical** | All `updatedAt`, `confidence`, `version`, `userId` | Standard handling; `userId` is a random UUID, not linkable to real identity |
| **Non-sensitive** | `identity.language`, `identity.timezone`, `preferences.*`, `premium.tier`, `retention.*`, `journey.*` | Normal product analytics use acceptable |

**GDPR right to erasure:** When a user requests data deletion, the following must be cleared: `identity.name`, `identity.age`, `goals.items[n].text`, `habits.items[n].name`, `coachMemory.facts`, `dailyHistory.entries[n].notes`. All computed and technical fields may be retained for product analytics.
