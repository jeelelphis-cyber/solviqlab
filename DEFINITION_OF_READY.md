# SolviqLab — Definition of Ready

> A task is not ready for development until it passes every gate below.
> If any gate is RED — stop. Fix the gap first.

---

## What is Definition of Ready?

Definition of Ready (DoR) is a mandatory checklist that every task,
feature, or sprint must pass **before a single line of code is written**.

It exists to prevent:
- Building the wrong thing correctly
- Discovering security issues after deployment
- Breaking the platform contract mid-sprint
- Wasting engineering time on under-specified work

**Rule:** If a task skips DoR, it is not a sprint task. It is a draft.

---

## The Eight Gates

### Gate 1 — Problem
*Do we understand the problem well enough to solve it?*

- [ ] The user problem is stated in one sentence (not a feature request)
- [ ] We know who specifically has this problem (persona)
- [ ] We know what happens if we don't solve it
- [ ] We have at least one data point that this problem is real (user feedback, analytics, research)

**RED if:** The task starts with "let's add..." without a stated problem.

---

### Gate 2 — Research
*Have we looked before we leaped?*

- [ ] Existing solutions reviewed (what do best-in-class products do?)
- [ ] Platform contracts reviewed (does this already exist somewhere in the codebase?)
- [ ] Dependencies identified (what breaks if we add this?)
- [ ] Technical feasibility confirmed (can we actually build this with current stack?)

**RED if:** No research was done. Opinion is not research.

---

### Gate 3 — UX / Experience
*Does the experience meet our Gold Standard?*

- [ ] User journey mapped (entry → value → exit)
- [ ] Mobile experience considered (not just desktop)
- [ ] Error states designed (what does the user see when it breaks?)
- [ ] Empty states designed (what does the user see on first load?)
- [ ] Localization considered (will this work in all 8+ languages?)

**RED if:** UX is "we'll figure it out during development."

---

### Gate 4 — Architecture
*Does the design fit the platform?*

- [ ] Uses existing platform contracts (events, graph, member, manifest)
- [ ] Does not duplicate existing functionality
- [ ] DB schema change reviewed (migration written before sprint starts)
- [ ] API contract defined (request/response types specified)
- [ ] Does this product write to the Intelligence Graph? (if not — why not?)

**RED if:** The implementation creates a new pattern instead of extending an existing one.

---

### Gate 5 — Security
*Could this be exploited?*

- [ ] Authentication: who can access this? (anonymous / authenticated / pro / admin)
- [ ] Authorization: what can each role do?
- [ ] Input validation: all user inputs validated server-side
- [ ] Rate limiting: is this endpoint protected?
- [ ] RLS policies: does the DB enforce access at row level?
- [ ] Secrets: no API keys, tokens, or passwords in client code
- [ ] OWASP Top 10 reviewed for this feature type

**RED if:** Security was not considered. Security is never an afterthought.

---

### Gate 6 — AI Review
*If AI is involved — is it safe and controllable?*

- [ ] System prompt reviewed and approved
- [ ] AI cannot access data outside its permitted scope
- [ ] Fallback defined (what happens when AI fails or returns garbage?)
- [ ] Cost estimated (tokens per request × expected volume)
- [ ] Output validation: AI responses are validated before showing to user
- [ ] Hallucination risk assessed for this use case

**RED if:** AI feature has no fallback or no cost estimate.

---

### Gate 7 — SEO / Discoverability
*Will this feature be found?*

- [ ] Page has unique title and meta description in all active languages
- [ ] URL structure follows platform convention
- [ ] Structured data added if applicable (FAQ, HowTo, etc.)
- [ ] Internal links updated (does anything link to this new page?)
- [ ] Core Web Vitals impact estimated

**RED if:** Feature adds a new page without SEO review.

---

### Gate 8 — Observability
*Will we know if this breaks?*

- [ ] Events defined: what platform events does this feature emit?
- [ ] Success metric defined: how do we know this feature is working?
- [ ] Failure metric defined: how do we know this feature is broken?
- [ ] Error logging added
- [ ] Dashboard updated (or will be updated in same sprint)

**RED if:** After deployment, we have no way to measure if the feature is working.

---

## Sprint Entry Checklist

Before a task enters a sprint, the team lead confirms:

```
Task: _______________________________________________
Author: _____________________________________________
Date reviewed: ______________________________________

Gate 1 — Problem          [ ] PASS  [ ] FAIL
Gate 2 — Research         [ ] PASS  [ ] FAIL
Gate 3 — UX               [ ] PASS  [ ] FAIL
Gate 4 — Architecture     [ ] PASS  [ ] FAIL
Gate 5 — Security         [ ] PASS  [ ] FAIL
Gate 6 — AI Review        [ ] PASS  [ ] FAIL  [ ] N/A
Gate 7 — SEO              [ ] PASS  [ ] FAIL  [ ] N/A
Gate 8 — Observability    [ ] PASS  [ ] FAIL

DECISION:  [ ] READY FOR SPRINT  [ ] NEEDS WORK  [ ] REJECTED

Notes:
```

---

## Who Reviews?

| Gate | Reviewer |
|------|----------|
| Problem | Product Lead |
| Research | Tech Lead |
| UX | Product Lead |
| Architecture | Chief Architect |
| Security | Security Reviewer (or Tech Lead) |
| AI Review | AI Lead |
| SEO | SEO Lead |
| Observability | Tech Lead |

In early stage (pre-team): all gates are reviewed by the founder/architect.

---

## What Happens When a Task Fails?

1. Task returns to backlog with a clear reason
2. The gap is documented
3. Task is re-submitted when the gap is addressed
4. No exceptions. No "we'll fix it later."

**"We'll fix it later" is how technical debt is born.**

---

## Relationship to Other Documents

| Document | Purpose |
|----------|---------|
| Constitution | Why we exist and our principles |
| Platform Spec | What we build and how it connects |
| Engineering Bible | How we write code |
| Gold Standards | Pass/fail criteria for each product type |
| **Definition of Ready** | **Gate before building anything** |
| Definition of Done | Gate after building (QA, deploy, measure) |

---

*Last updated: 2026-07-31*
*Owner: Chief Architect*
*Review: Each sprint retrospective*
