import Script from 'next/script'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const IS_PROD = process.env.NODE_ENV === 'production'

/**
 * Server component — injects the GA4 bootstrap script with Google Consent Mode v2 defaults.
 *
 * Rules:
 * - Renders nothing outside of production.
 * - Consent defaults are set to DENIED before gtag('config') fires.
 *   wait_for_update:500 gives ConsentBanner 500 ms to read localStorage and
 *   call gtag('consent','update') before GA4 sends any data.
 * - Clarity is NOT loaded here. It is conditionally mounted inside ConsentBanner
 *   after the user grants analytics consent.
 * - Script IDs prevent Next.js from inserting the same script twice across
 *   SPA navigations.
 *
 * To add a future tag-based provider (GTM, Meta Pixel, LinkedIn):
 *   1. Add its env var.
 *   2. Add its <Script> block below.
 *   3. Gate it behind consent inside ConsentBanner.
 */
export function AnalyticsScripts() {
  if (!IS_PROD) return null

  return (
    <>
      {/* ── Google Analytics 4 with Consent Mode v2 ─────────────────────────── */}
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {[
              'window.dataLayer=window.dataLayer||[];',
              'function gtag(){dataLayer.push(arguments);}',
              // Consent Mode v2: deny everything by default.
              // ConsentBanner calls gtag("consent","update") within wait_for_update ms.
              `gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});`,
              `gtag('js',new Date());`,
              `gtag('config','${GA_ID}',{page_path:window.location.pathname});`,
            ].join('')}
          </Script>
        </>
      )}

      {/* ── Future: Google Tag Manager ──────────────────────────────────────── */}
      {/* Add NEXT_PUBLIC_GTM_CONTAINER_ID and uncomment when GTM is provisioned */}

      {/* ── Future: Meta Pixel ──────────────────────────────────────────────── */}
      {/* Add NEXT_PUBLIC_META_PIXEL_ID and gate behind marketing consent       */}

      {/* ── Future: LinkedIn Insight ────────────────────────────────────────── */}
      {/* Add NEXT_PUBLIC_LINKEDIN_PARTNER_ID and gate behind marketing consent  */}
    </>
  )
}
