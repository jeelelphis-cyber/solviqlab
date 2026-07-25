# Product Gates v1.0
## SolviqLab Coach Platform — Mia

**Document type:** Product Specification  
**Version:** 1.0  
**Date:** 2026-07-25  
**Status:** Foundational — governs all monetization touchpoints  
**Author:** Product Architecture  
**Companion documents:** Product_State_Machine_v1.0.md, CEO_Demo_Flow_v1.0.md

---

## Core Principle

**A gate must feel like a reward, not a wall.**

The user must believe, at the gate moment, that they are being offered something they have already partly experienced and want more of — not that they are being stopped and asked to pay before they can continue.

This is achieved by one rule: **value delivery before ask, always.** The ask only appears after the user has received something they didn't expect to receive for free.

**The psychological sequence is always:**

1. User gets free value they did not expect
2. User experiences a tangible outcome or insight
3. User wants to continue that experience
4. Mia names the next level of that experience explicitly
5. Mia makes the offer
6. Offer is time-limited or access-limited, not manipulative

**What we never do:**
- Lock content the user has already seen (paywall regression)
- Show the gate before delivering the value that makes the gate make sense
- Use countdown timers on landing pages (manufactured urgency)
- Show the price before showing the benefit
- Use dark patterns (pre-checked "annual" box, hidden cancellation)

---

## Gate Architecture

Four gates are defined. Each maps to a specific user state from the Product State Machine and a specific moment in the value delivery sequence.

| Gate | Name | Trigger State | Conversion Target |
|------|------|--------------|-------------------|
| Gate 1 | After First Video | `video_watched` | Registration (free) |
| Gate 2 | After 3-Day Streak | `daily_active` (streak: 3) | Premium subscription |
| Gate 3 | After First Milestone | `milestone_reached` (Week 1) | Annual subscription |
| Gate 4 | Re-engagement | `reactivated` | Reactivation + upsell |

---

## Gate 1: After First Video — "I Want This Every Day"

**Trigger:** `mia_video_watched` event fires (user watched ≥80% of personalized Mia video)  
**User state at this point:** `video_watched`  
**This is Gate 1** of the funnel — it converts anonymous curiosity into a named, accountable user.

---

### What the user just experienced (value delivered)

- A personalized 90-second video from Mia that mentioned their specific BMI, sleep score, or health number
- The realization that Mia "knows" something real about them — not a template persona
- A moment of being seen: someone (even an AI) identified their specific situation and addressed it
- The beginning of hope: "maybe this is different from the other tools I've tried"

**This is the highest-emotional-intensity moment in the free tier.** The gate must fire at this exact moment, while the emotional memory is fresh.

---

### The gate moment

**Sequence:** Video ends → Coach Quiz → Today's Plan (free, immediate) → Registration gate

The gate does not appear at the end of the video. It appears after the user has received their **first free plan** — the quiz + plan sequence is included in the free tier deliberately. By the time the registration gate appears, the user has:
1. Seen the personalized video
2. Answered 3–5 questions about their life
3. Received a real, specific plan for today

The gate is: "This plan is yours. To access it tomorrow, and every day after, I need your email."

**What Mia says:**
> "Your plan for today is ready. I built it based on what you told me — your actual situation, not a template.
>
> To send you tomorrow's plan, I need one thing from you: your email. That's it. No payment. No credit card. I just need to know where to reach you.
>
> Sign up takes 20 seconds."

**What the user sees:**
- Today's plan visible in the background (partially visible, not blurred — blurring is a dark pattern)
- Registration form in a modal or slide panel
- Single field visible first: email input
- Password appears after email is entered (progressive disclosure reduces friction)
- Mia's avatar with the above copy
- CTA button: "Send Me Tomorrow's Plan" (not "Sign Up" — frame the benefit, not the action)

**Emotional state:** Motivated and invested. They just built something (their plan). Registration protects what they built.

---

### Free vs Paid at this gate

| Feature | Anonymous | Registered (Free) | Premium |
|---------|-----------|------------------|---------|
| Today's plan | ✓ (one day only) | ✓ (daily) | ✓ (daily + evening) |
| Mia intro video | ✓ (once) | ✓ (daily morning) | ✓ (morning + evening) |
| Progress tracking | ✗ | ✓ | ✓ |
| 7-day trial (full Pro) | ✗ | ✓ on registration | — |
| Multiple goals | ✗ | ✗ | ✓ |
| Data export | ✗ | ✗ | ✓ |

---

### Conversion mechanics

**Urgency:** "Your plan expires at midnight. After that, Mia will generate a new one for tomorrow — but today's specific plan won't be available." (Truthful urgency — daily plans are genuinely daily.)

**Social proof:** Not used at Gate 1. The user has not yet been shown peer data. Adding social proof here would feel premature and trust-eroding.

**Risk reversal:** "No payment. No credit card. 7-day free trial of everything. Cancel any time." This copy appears directly below the email field.

**Friction reduction:** 
- OAuth option (Google, Apple) reduces to zero-field entry
- No phone number required, ever
- No date of birth required at registration

---

### If user declines

User closes the registration modal or clicks "Maybe later":
- Plan remains visible and usable for the current session
- Modal does not reappear for 30 minutes
- After 30 minutes, a small persistent banner appears (not modal): "Your plan expires tonight. Save it with your email."
- If user returns the next day without registering: the plan is gone, but Mia offers to rebuild it. "It's been a day. Your plan has reset. It'll take 3 minutes to rebuild it." — this creates natural re-engagement without pressure.

**What Mia says on decline:**
> "No problem. Your plan is active until midnight. Come back if you want to save it."

Mia does not express disappointment or use guilt. She acknowledges the decision as valid.

---

### Success metric

**Target conversion rate:** 35% of users who reach `video_watched` state complete registration  
**Measurement:** `registration_completed` events / `mia_video_watched` events (30-day rolling)  
**Leading indicator:** `registration_started` rate (shows intent; low started + low completed = friction in form)

---

## Gate 2: After 3-Day Streak — "You've Built Momentum"

**Trigger:** `daily_streak_updated` fires with `currentStreak === 3`  
**User state at this point:** `daily_active` (registered, 3 consecutive check-ins)  
**This is the primary revenue gate** — it converts registered free users into paying subscribers.

---

### What the user just experienced (value delivered)

- 3 consecutive days of using the product (a habit beginning to form)
- 3 personalized morning routines from Mia
- First visible progress: energy scores, task completion, small behavioral changes
- Mia has referenced something from Day 1 in Day 3's message — the user felt remembered
- The beginning of trust: "She actually knows my journey, not just my data"

**3 days is the minimum threshold for the user to have experienced Mia as a habit, not a novelty.** Research on habit formation suggests that the "habit loop" feeling begins around day 3. This is when the user first has a sense of what they would lose by stopping.

---

### The gate moment

**Timing:** Gate 2 appears in the morning routine on Day 3, after the morning check-in is complete — not before. The user must earn the gate by completing the check-in first.

**What Mia says:**
> "Day 3. You've shown up three days in a row. That's not willpower — that's the beginning of a pattern.
>
> The people who reach their goals aren't the ones who try hardest. They're the ones who keep showing up. You've already done the hardest part.
>
> I want to show you what your next 30 days can look like. That requires the full coaching system — which you've been using during your trial.
>
> Your trial ends in [N] days. After that, I can continue what we've started for [price]/month. That's less than one meal out.
>
> I'd like to keep going with you."

**What the user sees:**
- Full-screen moment (not modal) — this is a significant offer, it deserves full attention
- Day 3 streak displayed prominently ("3 consecutive days")
- A simple before/after comparison: Day 1 energy score vs. Day 3 energy score (if available)
- A 30-day projection: "If you continue at this pace..." (not a promise, a projection)
- Two options: "Keep Going (Pro)" and "Continue Free Trial" (trial still active — no pressure)
- Monthly and annual pricing visible simultaneously

**Emotional state:** Proud of consistency, curious about potential, evaluating whether to commit.

---

### Free vs Paid at this gate

| Feature | Free (post-trial) | Premium |
|---------|-------------------|---------|
| Today's plan | ✓ (basic, 1 goal) | ✓ (full, multiple goals) |
| Morning Mia message | ✓ (text only) | ✓ (video + text) |
| Evening check-in | ✗ | ✓ |
| Progress charts | ✓ (7-day only) | ✓ (full history) |
| Plan adaptation | ✗ (static plan) | ✓ (Mia adapts weekly) |
| Multiple clusters | ✗ | ✓ |
| Data export | ✗ | ✓ |
| Priority support | ✗ | ✓ |

---

### Conversion mechanics

**Urgency:** Trial countdown is visible — truthful urgency. "Your trial ends in [N] days" is a fact, not manufactured pressure. The offer changes slightly as trial days decrease:
- Days 7–4: "You're on track. Continue when ready."
- Days 3–2: "Trial ending soon. Lock in your plan."
- Day 1: "Last day of trial. Your progress is saved — continue from here."

**Social proof:** "Most people who reach day 3 continue." If available: "[N] users in [country] joined this week." (Only use if n > 100 to avoid implying scarcity.)

**Risk reversal:** "Cancel any time. No questions asked. Your data stays saved for 90 days after cancellation."

**Annual vs Monthly:** Annual is shown first with the discount prominent ("Save 40%"). Monthly is shown as the "pay as you go" option. No default selection — user must choose actively.

---

### If user declines

User clicks "Continue Free Trial" or dismisses:
- Gate closes, user continues with trial
- No repeat of this exact gate for 48 hours
- On trial day 6 (one day before expiry): final pre-expiry offer, different framing: "Tomorrow your trial ends. Your streak is at [N] days — don't break it."
- On trial day 7 expiry: plan continues at free tier (reduced features) with persistent banner. No lock-out — locking out a user who has a habit destroys goodwill.

**What Mia says on decline:**
> "Understood. Your plan continues. I'll check in with you on the last day of your trial."

---

### Success metric

**Target conversion rate:** 25% of users who reach day 3 streak convert to paid within 7 days  
**Measurement:** `premium_started` events / `daily_streak_updated(streak: 3)` events (30-day rolling)  
**Secondary metric:** Annual vs monthly split (target: 40% annual — higher LTV)  
**Leading indicator:** Gate 2 view-to-start rate (user clicked "Keep Going" vs. dismissed)

---

## Gate 3: After First Milestone — "What's Possible in Month 2"

**Trigger:** `milestone_reached` fires with `milestoneId === 'week_1_complete'`  
**User state at this point:** Premium (if converted at Gate 2) OR free trial approaching expiry  
**Purpose:** Annual subscription upsell for monthly subscribers; reactivation offer for lapsed free users.

---

### What the user just experienced (value delivered)

- Week 1 complete — 7 consecutive days of coaching interaction
- First measurable result (mood scores improved, at least one habit established)
- Mia's week 1 review: a personalized summary of what changed in 7 days
- The user has a data-backed story about themselves for the first time: "I went from energy: 2/5 to energy: 3.5/5 in one week"
- They believe, for the first time, that the next month could be different from previous attempts

**This is the highest-trust moment in the product lifecycle.** The user has earned a result. They now believe in the method.

---

### The gate moment

**Timing:** Gate 3 appears in the Week 1 review session — after Mia has delivered the full week review, not before.

**What Mia says (for annual upsell to monthly subscriber):**
> "You've had a real week. Not a 'I tried for a day' week — a full seven-day week where you showed up.
>
> Your energy went from [Day 1 score] to [Day 7 score]. Your task completion rate was [N]%.
>
> Here's what I know about week 2: the results compound. The people who make the biggest changes aren't the ones who work hardest in week 1 — they're the ones who keep a monthly commitment. 
>
> If you're on a monthly plan, switching to annual locks in your price and saves you [amount]. That's [N] months at your current results rate.
>
> If you want to commit to the next 90 days, I'll build your monthly plan today."

**What Mia says (for free trial user approaching expiry):**
> "One week. You actually did it.
>
> Your sleep score is up. Your energy patterns have shifted. Here's what the next month looks like if we keep going — [specific projection].
>
> The trial is ending in [N] days. I want to keep working with you. Here's what that costs — and what you get."

**What the user sees:**
- Week 1 data visualization: energy, mood, task completion over 7 days
- Side-by-side: Day 1 vs. Day 7 (the most emotionally powerful comparison possible)
- Month 2 projection (framed as "based on your week 1 pattern")
- Annual plan offer with the monthly equivalent price prominently displayed
- "Commit to Month 2" CTA (not "Upgrade" — frame the commitment, not the transaction)

**Emotional state:** Achievement, pride, genuine belief in continued results. This is the highest-motivation moment for a purchase decision.

---

### Free vs Paid at this gate

| Feature | Monthly Pro | Annual Pro |
|---------|-------------|------------|
| All Pro features | ✓ | ✓ |
| Monthly cost | $[X]/mo | $[X × 0.60]/mo |
| Price lock | ✗ (subject to change) | ✓ (locked for 12 months) |
| Month 2 plan personalization | Standard | Deep (Mia rebuilds for month 2 goals) |
| Quarterly progress review | ✗ | ✓ |

---

### Conversion mechanics

**Urgency:** The week 1 review is a natural milestone — the urgency is inherent in the achievement, not manufactured. "You've built this momentum. Annual locks it in." 

**Social proof:** "Users who commit to 90 days are [N]x more likely to reach their goal." (Use only if data-backed.)

**Risk reversal:** "Cancel within 30 days for a full refund. No questions asked." Annual subscriptions without a refund guarantee are conversion blockers.

**Scarcity:** Not used. We do not manufacture scarcity.

---

### If user declines

- Monthly subscriber continues on monthly
- Free trial user: same Gate 2 close flow applies
- Gate 3 does not repeat for 14 days
- Month 2 daily plans include a persistent (non-intrusive) "Switch to Annual" option in account settings — not pushed in Mia messages

**What Mia says on decline:**
> "Understood. Your month 2 plan starts tomorrow either way. I'll be here."

---

### Success metric

**Target conversion rate (monthly → annual):** 20% of monthly subscribers who reach week 1 milestone convert to annual within 72 hours  
**Target conversion rate (free trial → paid at week 1):** 15% additional conversion beyond Gate 2  
**Measurement:** `premium_started(billing_cycle: 'annual')` / `milestone_reached(milestoneId: 'week_1_complete')`

---

## Gate 4: Re-engagement Gate — "I Saved Your Progress"

**Trigger:** `user_reactivated` fires (user returned after 5+ days of inactivity)  
**User state at this point:** `reactivated` (returning from `inactive_3d` or worse)  
**Purpose:** Reduce churn, reestablish habit, upsell if relevant.

---

### What the user just experienced (value delivered)

- Mia sent a re-engagement message that was not guilt-inducing
- The message specifically did NOT mention the streak they broke or count the days they missed
- The message said: "Your progress is saved. Pick up where you left off."
- User opened the app — this is a voluntary return, not a forced one

**The value delivered is the absence of punishment.** The user expected to be scolded. Instead, they were welcomed. This is the gate moment.

---

### The gate moment

**Timing:** Gate 4 appears after the re-engagement welcome screen — not before Mia has acknowledged the return.

**Sequence:**
1. User opens app
2. Mia welcome-back screen: "You're back. Your plan is adjusted for today. Ready?"
3. User sees today's adapted plan (plan has been rebuilt for the gap period)
4. If user is on free tier or lapsed trial: soft upsell appears within the first session, not on the welcome screen
5. Upsell framing: "While you were away, I held your spot. To make sure that never gets interrupted again..."

**What Mia says (welcome back, no upsell yet):**
> "You're back.
>
> I'm not going to count the days you were away — that's not how this works. I've updated your plan based on where you actually are today, not where you were when you left.
>
> [Today's plan is below. It's shorter than usual — one task. That's all I need from you today.]"

**What Mia says (upsell, within first session):**
> "You came back. That matters more than the streak you broke.
>
> The reason people come back is because something here is working — even if the consistency isn't perfect yet.
>
> If you want to make sure you always have a plan waiting for you — even after a break — that's what Pro does. Your plan adapts. Mia adjusts. You don't start over.
>
> [Option: Continue as-is] [Option: Go Pro — $X/month]"

**What the user sees:**
- Clean welcome-back screen (no streak counter visible — it would show the broken streak)
- Today's plan: shorter than usual (2–3 tasks maximum on return day)
- Mia's acknowledgment of the gap without drama
- Upsell shown as a card within the plan, not a modal — user can scroll past it

**Emotional state:** Cautious relief. "She didn't judge me. Maybe I can actually continue."

---

### Free vs Paid at this gate

| Feature | Free (returning) | Premium (returning) |
|---------|-----------------|---------------------|
| Plan after gap | Basic (manual) | Auto-adapted by Mia |
| Welcome-back message | Standard | Personalized (references specific gap context) |
| Today's plan | ✓ (reduced) | ✓ (Mia-calibrated) |
| "Accountability mode" | ✗ | ✓ (Mia checks in if 2 days pass) |

---

### Conversion mechanics

**Urgency:** Not applicable. A returning user is in a fragile emotional state. Urgency is counterproductive here. The only urgency is organic: they want to rebuild the habit they lost.

**Social proof:** "Most people who come back after a break reach their goal eventually. The ones who don't are the ones who don't come back at all." (Normalize the return; make the decision to stay feel correct.)

**Risk reversal:** "If you subscribe and break your streak again — nothing changes. Your plan stays. Mia adjusts. You don't lose progress."

---

### If user declines

User dismisses the upsell:
- No repeat for 7 days
- User continues on free tier with full functionality
- The adapted plan (shorter, achievable) is the primary retention mechanism — no gate friction on day 1 of return

**What Mia says on decline:**
> "Understood. Let's just focus on today."

---

### Success metric

**Target re-engagement rate:** 40% of `inactive_3d` users who receive re-engagement message open the app within 48 hours  
**Target reactivation-to-paid conversion:** 10% of reactivated free users convert to paid within 14 days of return  
**Key leading metric:** Day 1 task completion rate for returning users (if they complete 1 task on return day, 60% continue for 3+ more days — data hypothesis to validate)

---

## Gate Sequencing Rules

**No two gates fire within the same session.** If a user somehow triggers multiple gate conditions simultaneously (e.g., streak of 3 + reactivation), Gate 1 (or the earlier-stage gate) takes priority.

**Gates are one-directional.** A user who has seen Gate 3 does not see Gate 1 or Gate 2 again, even if they cancel and re-register.

**Gate state is persisted.** Gate exposure is written to `journey.completedSteps` (e.g., `'gate_1_shown'`, `'gate_2_declined'`). This prevents re-showing gates and enables post-hoc analysis of gate conversion rates.

**Gate events for analytics:**

| Event | What it tracks |
|-------|---------------|
| `gate_shown` | Gate became visible (impression) |
| `gate_converted` | User took the primary CTA |
| `gate_declined` | User dismissed or clicked secondary action |
| `gate_ignored` | Gate was shown but user did not interact (scrolled past) |
