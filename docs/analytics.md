# Analytics Architecture

## Overview

SolviqLab uses a unified analytics module that abstracts all third-party providers
behind a single interface. The application never calls vendor APIs directly — it
calls `analytics.track()` or `analytics.pageView()`, and the manager fans out to
every registered provider.

---

## Architecture

```
src/lib/analytics/
├── types.ts               AnalyticsProvider interface
├── manager.ts             AnalyticsManager — orchestrates providers
├── index.ts               Singleton export + provider registration
└── providers/
    ├── ga4.ts             Google Analytics 4
    ├── clarity.ts         Microsoft Clarity
    └── (future)           GTM, Meta Pixel, LinkedIn Insight, PostHog ...

src/components/analytics/
└── AnalyticsScripts.tsx   Server component — injects <Script> tags
```

### Initialization flow

```
1. Next.js renders root layout (Server Component)
2. AnalyticsScripts checks NODE_ENV === 'production'
   └── false → renders nothing (local dev / CI)
   └── true  → renders <Script> tags for each provider whose env var is set
3. Browser receives the page
4. next/script (strategy="afterInteractive") waits for hydration to complete
5. Scripts execute in order:
   - GA4: loads gtag.js, calls gtag('config', GA_ID)
   - Clarity: injects clarity.ms/tag/PROJECT_ID asynchronously
6. window.gtag and window.clarity are now available
7. analytics.track() / analytics.pageView() calls proxy to both providers
```

---

## Providers

### Google Analytics 4

- **Script:** `https://www.googletagmanager.com/gtag/js?id=<GA_ID>`
- **Init:** `gtag('config', GA_ID, { page_path })`
- **Page views:** manual via `analytics.pageView(url)` → `gtag('config', ...)`
- **Events:** `analytics.track(name, params)` → `gtag('event', name, params)`
- **Automatic:** session, bounce, engagement time (GA4 built-in)

### Microsoft Clarity

- **Script:** loaded inline via the standard Clarity snippet
- **External asset:** `https://www.clarity.ms/tag/<PROJECT_ID>` (async)
- **Page views:** automatic — Clarity observes URL changes natively
- **Events:** `analytics.track(name)` → `clarity('event', name)`
- **Automatic:** session recordings, heatmaps, rage clicks, dead clicks, scroll depth

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Yes | GA4 property ID (`G-XXXXXXXXXX`) |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Yes | Clarity project ID (alphanumeric) |

**Local development:** set in `apps/web/.env.local` (gitignored).  
**Production:** set in Vercel → Project → Settings → Environment Variables.

Removing a variable disables that provider entirely — no code change needed.

---

## How to add a new provider

1. Create `src/lib/analytics/providers/yourprovider.ts`:

```typescript
import type { AnalyticsProvider } from '../types'

export class YourProvider implements AnalyticsProvider {
  readonly name = 'YourProvider'

  init(): void { /* no-op if script handles init */ }

  track(event: string, params?: Record<string, unknown>): void {
    if (typeof window === 'undefined') return
    // call window.yourprovider(...)
  }

  pageView(url: string): void {
    // forward if the provider needs manual page view calls
  }
}
```

2. Add a `<Script>` block to `src/components/analytics/AnalyticsScripts.tsx`:

```tsx
{YOUR_PROVIDER_ID && (
  <Script id="yourprovider-init" strategy="afterInteractive">
    {`/* vendor init snippet with ${YOUR_PROVIDER_ID} */`}
  </Script>
)}
```

3. Register in `src/lib/analytics/index.ts`:

```typescript
if (yourProviderId) manager.register(new YourProvider(yourProviderId))
```

4. Add env var to `.env.local` and Vercel dashboard.

---

## How to disable a provider

Remove (or blank) its environment variable. The guard in `AnalyticsScripts.tsx`
and in `index.ts` ensures no script is injected and no provider is registered.

---

## Privacy and Cookie Consent

**Current status:** no cookie consent system is implemented.

GA4 and Clarity fire immediately on page load in production. There is no
opt-out mechanism. Users cannot decline tracking.

**When consent is added:**

- Wrap `<AnalyticsScripts />` in a consent gate or pass a `consent` prop.
- Gate `analytics.init()` on consent signal (`localStorage`, cookie, or
  a consent provider context).
- GA4 supports Consent Mode v2 — add `gtag('consent', 'default', {...})` before
  the config call to respect regional requirements.

---

## Performance

| Concern | Implementation |
|---|---|
| Main thread blocking | `strategy="afterInteractive"` — scripts load after hydration |
| Duplicate injection | `id=` prop on `<Script>` — Next.js deduplicates across navigations |
| Layout shift | No DOM insertion before paint; both providers are async |
| Dev overhead | `NODE_ENV !== 'production'` guard — zero scripts in dev/test |
| Bundle size | No npm packages added — vendors load from their own CDNs |

---

## CSP

No global Content-Security-Policy header exists in this project. If one is added,
include the following directives:

```
script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms;
connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.clarity.ms;
img-src 'self' https://www.google-analytics.com;
```
