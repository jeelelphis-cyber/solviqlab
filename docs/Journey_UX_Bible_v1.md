# Journey UX Bible v1.0
*SolviqLab — Product Experience Foundation*

*Status: Canonical. All V4 UI decisions defer to this document.*
*Owner: Product Director*
*Updated: 2026-07-23*

---

## Part I — Philosophy

### The Core Belief

A person does not come to SolviqLab for a calculator.

They come with a problem.

"I want to lose weight."
"I can't sleep."
"I'm worried about money."

The calculator is the door. The journey is the product.

Every UI decision must honor this distinction. We are not building a results page. We are building the first moment of a relationship.

---

### The One Sentence Rule

Every screen, every component, every word of copy must answer one question:

> **Does this increase the probability that the user takes the next step?**

If the answer is no — remove it.

---

### The Companion Principle

SolviqLab is not a tool. It is a companion.

A good companion does three things:

1. **Observes** — notices what you've done without being asked.
2. **Understands** — synthesizes what it knows into something meaningful.
3. **Guides** — suggests the next step with confidence, not options.

The UI must communicate all three at every interaction. The user should never feel like they are operating software. They should feel like someone is paying attention.

---

### The Moment That Matters

The critical moment in the user journey is the **10-second window after a result**.

At this moment the user has:
- Just received new information about themselves (their BMI, their sleep score, their financial health)
- A natural decision: leave, or go deeper

If we fail this moment — they leave.
If we win this moment — they begin a journey.

Everything in V4 is built to win this moment.

---

## Part II — The Emotional Arc

Understanding the user's emotional state at each journey phase is the foundation of all copy and design decisions.

### Phase 1: Discovery
**Emotional state:** Curious but skeptical. "Is this going to be useful?"

The user has just calculated something. They have a result but no context. They don't know what to do with it.

**What they need:** To feel that the system noticed them. That this result means something. That there is a path forward.

**Tone:** Warm acknowledgment → gentle forward momentum.

*Wrong:* "Your BMI is 29.8. You are overweight."
*Right:* "Your profile is taking shape. One data point saved — let's build the full picture."

---

### Phase 2: Assessment
**Emotional state:** Invested but anxious. "Is this going to judge me?"

The user has enough data for an assessment. They are about to share more about themselves. This is a trust moment.

**What they need:** To feel safe. The assessment is not a judgment — it's a map. The output is not a verdict — it's a starting point.

**Tone:** Reassuring competence. "We have enough to help you now."

*Wrong:* "Complete assessment to continue."
*Right:* "You've built enough of a profile. 3 minutes — and we'll know exactly where to start."

---

### Phase 3: Planning
**Emotional state:** Hopeful and motivated. "I want to start."

The user has been assessed. They have a strategy. This is the peak motivation moment in the entire journey. It must not be wasted on form fields.

**What they need:** To feel the plan is *theirs*. That setting a goal is an act of ownership, not a data entry task.

**Tone:** Confident, personal. "Your strategy is ready. Let's make it yours."

*Wrong:* "Enter your goal weight."
*Right:* "Based on your profile, a realistic target is 74 kg. Does that feel right?"

---

### Phase 4: Execution
**Emotional state:** Committed but needs reinforcement. "Am I doing this right?"

The user has a plan. They are doing check-ins. They need to feel that progress — even small — is recognized.

**What they need:** Visible momentum. The feeling that the system sees their effort.

**Tone:** Encouraging accountability. "Week 3. You're ahead of where most people are at this stage."

*Wrong:* "Check-in complete."
*Right:* "Another week of data. Your plan is adapting to your results."

---

### Phase 5: Habit
**Emotional state:** Proud but potentially directionless. "What do I do now?"

The user has completed their journey. This is a retention-critical moment. The product must celebrate the win and immediately offer the next horizon.

**What they need:** Celebration that doesn't feel empty, and a clear next invitation.

**Tone:** Genuine recognition → natural continuation.

*Wrong:* "Goal achieved."
*Right:* "You did it. That took discipline. Ready to explore what's next?"

---

## Part III — Retention Psychology

### The Progress Bias

Humans are wired to continue things they've started. This is the Zeigarnik Effect — incomplete tasks occupy more mental bandwidth than complete ones.

**Rule:** Always show the user how much progress they've already made before showing how far they still have to go.

*Wrong:* "5 steps left"
*Right:* "You're 33% closer to your personal plan."

The percentage framing converts a distance into momentum.

---

### The Unlock Mechanic

Humans will work harder for a visible reward than for an abstract benefit.

Every step must preview what it unlocks. Not as a list of features — as a promise of personal value.

*Wrong:* "Next: Assessment. Then: Strategy."
*Right:* "Complete this → unlock your personal strategy. One step away from a plan that adapts to you."

The unlock must feel earned, not automated.

---

### The Sunk Cost Advantage

When a user has completed 2 steps of a 6-step journey, they are statistically far more likely to complete the remaining 4 than someone who has completed 0. This is a product advantage — use it.

**Rule:** Always remind the user of what they've already invested.

*Wrong:* "Ready for step 3?"
*Right:* "You've already done the hard part — 2 steps in. The next step takes 3 minutes."

---

### The Endowment Effect

Users value things they feel they own. The moment we present the journey as *their* journey — not a generic product — retention increases.

**Rule:** Use "your" ownership language consistently.

*Wrong:* "The weight loss plan has been created."
*Right:* "Your plan is live. Built around your data, your pace, your goal."

---

### Loss Aversion Framing

Humans are 2x more motivated by avoiding a loss than achieving a gain.

**Rule:** Frame inaction as losing something already earned — not as missing a future benefit.

*Wrong:* "Complete the assessment to unlock your strategy."
*Right:* "Your data is ready. Don't let it sit unused — 3 minutes to turn it into a plan."

---

### The Single Next Step Principle

The biggest conversion killer in multi-step journeys is choice paralysis.

**Absolute Rule:** The user must always see exactly ONE next step. Never two. Never a menu. Never "here are your options."

The recommendation engine has already computed the optimal next step. Trust it. Present it as the only option.

---

## Part IV — CTA Principles

### The Formula

Every primary CTA must follow this structure:

```
[Action verb] + [Personal benefit or identity claim]
```

**Examples:**
- "Continue My Journey" → action + ownership
- "Unlock My Strategy" → action + reward
- "Build My Plan" → action + ownership
- "See My Results" → action + personal possession
- "Start Your Assessment" → action + beginning

**Never:**
- "Continue" (too generic, no benefit)
- "Submit" (form language, not journey language)
- "Next" (direction with no meaning)
- "Go" (meaningless)
- "OK" (confirmation language)

---

### CTA Hierarchy

Every screen has maximum 2 CTAs:

1. **Primary** — one action, highest visual weight, benefit-focused copy
2. **Secondary** (optional) — lower stakes, lower visual weight, skips or saves for later

If you have 3 CTAs, you have too many. Remove the weakest.

---

### The "Why Now" Hook

Every CTA must be preceded by a short "why now" statement that creates urgency without being manipulative.

*Wrong:* No context, just a button.
*Right:* "Your data is ready — personalization takes 3 minutes." → [Build My Plan →]

The "why now" hook is always 1 sentence maximum. It explains what happens when the user clicks — not what they're clicking on.

---

## Part V — Visual Hierarchy Rules

### The F-Pattern Is Dead

Users don't read — they scan. On a result page, eye movement is vertical, not horizontal. Design for vertical scanning.

**Layout rule:** Most important element → second most important → CTA. Always top-to-bottom, never side-by-side for primary content.

---

### Typography Scale

Journey components use exactly 4 text sizes:

| Role | Size | Weight | Usage |
|------|------|--------|-------|
| Hero statement | 20–24px | 700 | "Your profile is taking shape." |
| Body | 14px | 400 | Supporting explanation copy |
| Label | 11px | 600 | Phase badge, step counter, metadata |
| Micro | 10px | 500 | "After this: → → →" |

Never use more than 4 sizes in one component. Hierarchy comes from weight and color, not size escalation.

---

### Color System — Journey Layer

The journey uses a distinct but harmonious color system on top of the base design:

| Semantic | Color | Usage |
|----------|-------|-------|
| Progress/Primary | Blue 600 | Progress bars, primary CTA |
| Achievement | Emerald 500 | Completed steps, checkmarks |
| Attention | Amber 500 | Assessment ready, important next step |
| Momentum | Violet 500 | AI readiness, unlock previews |
| Neutral | Slate 200/700 | Inactive steps, secondary text |

**Rule:** One semantic per screen. Never mix achievement green and attention amber on the same component.

---

### Spacing System

Journey components use 4-point multiples exclusively:

- `4px` (1) — internal icon padding
- `8px` (2) — between label and body text
- `12px` (3) — between sections within a card
- `16px` (4) — standard component padding
- `20px` (5) — generous component padding (hero areas)
- `24px` (6) — between separate components

**Rule:** Never use odd numbers. Never use 15px, 11px, 7px. The eye detects inconsistency.

---

### Border Radius

Journey components use `rounded-2xl` (16px) for cards — matching the calculator cards above them.

Internal elements use `rounded-xl` (12px).
Badges and pills use `rounded-full`.

Never mix `rounded-lg` with `rounded-2xl` in the same component.

---

## Part VI — Micro-Interaction Rules

### The Principle of Earned Animation

Animation exists to communicate meaning — not to impress. Every animation must answer: "What information does this communicate?"

**Allowed animations:**

| Animation | Purpose | Duration |
|-----------|---------|----------|
| Fade in + slide up | Component appeared after a user action | 400ms |
| Progress fill | Value increased | 600ms, ease-out |
| Checkmark draw | Step completed | 300ms |
| Button press scale | Tactile response | 100ms |
| Pulsing dot | Live/updating state | Continuous, slow |

**Forbidden:**
- Bounce animations (childish)
- Spinning loaders that last > 1s (impatience)
- Parallax (disorienting on mobile)
- Auto-playing sequences the user didn't trigger

---

### The Entry Animation

When JourneyExperience appears after a calculator result:

1. Component fades in from bottom (8px slide) over 400ms
2. Progress bar fills from 0 to current value over 600ms (600ms delay)
3. Phase badge dot begins pulsing

This sequence communicates: "Something happened, the system responded."

---

### The Hover State

All interactive elements must respond to hover within 150ms:
- Buttons: slight background darkening + subtle scale (1.01)
- Cards that link: border color shift toward blue
- CTA button: arrow icon translates 2px right

Never animate text content on hover. Only containers and icons.

---

## Part VII — Trust Mechanics

### The "Why This?" Principle

Every recommendation must include an explanation of why it was chosen. Not a marketing reason — a logical one.

The user has a natural question when they see a next step: "Why this? Why now? Who decided?"

The answer must be:
1. Specific to their situation (not generic)
2. Logical (cause → effect)
3. 1 sentence maximum

**Formula:**
> "Without [X], we can't build [Y] that accounts for [Z]."

**Examples:**
- "Without your calorie data, we can't build a weight plan that fits your actual lifestyle."
- "Your sleep score suggests your metabolism may be affected — the assessment confirms or rules this out."
- "This step adds the missing piece to your profile — you're 1 data point away from your personal strategy."

---

### The Data Transparency Rule

Never say "our algorithm decided." Never imply magic.

Always show that the recommendation comes from the user's own data.

*Wrong:* "We recommend the Weight Assessment."
*Right:* "Based on your BMI (29.8) and 2 completed steps, your next highest-value action is the Weight Assessment."

The user's own data is the most persuasive argument.

---

### The Social Proof Exception

Social proof ("1 million users") is forbidden in journey components.

Journey experience is personal. Social proof breaks the "this is built for me" feeling.

Use social proof only on landing pages and registration prompts — never inside an active journey.

---

## Part VIII — Mobile-First Rules

### The Thumb Zone

On mobile, the primary CTA must always fall within the thumb zone: roughly the bottom 60% of the screen.

Journey components are designed to be scrolled to naturally — the CTA appears after the context has been read.

Never place the CTA above the explanation.

---

### Touch Targets

All interactive elements: minimum 44px height, 44px width (Apple HIG standard).

Never let text-only links serve as the primary interaction. Wrap them in a container with adequate tap area.

---

### One Column Always

Journey components never use a 2-column grid. The reading flow is linear, top to bottom, on all screen sizes.

The progress preview ("After this: Assessment → Strategy → Plan") wraps naturally.

---

## Part IX — Component Architecture Rules

### The Single Responsibility Rule

One component, one purpose.

`JourneyExperience` — the full first-impression block
`ProgressRail` — only the progress visualization
`NextStepBlock` — only the recommendation + CTA
`PhaseLabel` — only the phase badge

Never build a component that does 2 things. When in doubt: split.

---

### Data Contract

Journey components read ONLY from `IntentState` via `getIntentState(cluster)`.

No direct engine calls. No static config. No hardcoded copy that duplicates what's in the domain.

The exception: `PHASE_PREVIEW` (static per-phase copy) lives in the component layer — it is UI copy, not domain logic.

---

### Copy Location

All user-facing strings in journey components must be declared as named constants at the top of the component file, or in a `journey-copy.ts` file.

Never embed copy strings inside JSX. This makes future localization and A/B testing impossible.

```typescript
// journey-copy.ts
export const COPY = {
  ctaDiscovery:   'Continue My Journey',
  ctaAssessment:  'Start My Assessment',
  ctaPlanning:    'Build My Plan',
  whyPrefix:      'Without this,',
} as const
```

---

## Part X — A/B Testing Framework

### What to Test First

V4-2 establishes the baseline. The first A/B tests focus on the three highest-leverage variables:

1. **CTA copy** — "Continue My Journey" vs "Build My Personal Plan" vs "Unlock My Strategy"
2. **Progress framing** — "Step 2 of 6" vs "33% closer" vs progress segments only
3. **Why-this placement** — above CTA vs below CTA vs inside CTA hover state

### How to Test

Use the existing A/B mechanism (hash % 3 from V3-02). Assign variants in `JourneyExperience` props. Track via GA4 `journey_cta_click` event with `variant` parameter.

### Success Metric

One metric: **next-step click-through rate** after a calculator result.

Baseline (current): measure on first deploy.
Target: 35%+ CTR within 30 days.

---

## Appendix — Rejected Patterns

These patterns were considered and rejected. Do not re-introduce them.

| Pattern | Why rejected |
|---------|-------------|
| Modal overlays after result | Interrupt pattern — creates anxiety, not momentum |
| Auto-redirect to next step | Removes user agency — kills trust |
| Progress expressed as % alone | Abstract — "33%" means nothing without context |
| Multiple next-step options | Choice paralysis — kills conversion |
| Gamification badges | Trivializes real personal health goals |
| Social comparison ("you're in the top 20%") | Irrelevant to personal journey; feels hollow |
| Email capture before value delivery | Too early — user hasn't experienced value yet |
| Chat/AI overlay on first visit | Overwhelming for new users — introduce after 2+ steps |

---

*This document is the canonical UX foundation for all V4 product decisions.*
*Changes require Product Director approval and a new version number.*
*Next review: after V4-2 implementation and first 7-day retention data.*
