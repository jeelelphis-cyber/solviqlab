'use client'

// Fires journey analytics events via IntersectionObserver.
// This is a zero-render component — returns null always.
// Attach it once per page where journey cards appear.

import { useEffect } from 'react'

interface Props {
  readonly slug: string
  readonly journeyId: string | null
  readonly trackingLabel: string | null
  readonly nextSlug: string | null
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function fire(event: string, params: Record<string, string | number | null>) {
  try {
    window.gtag?.('event', event, params)
  } catch {}
}

export function JourneyAnalyticsObserver({ slug, journeyId, trackingLabel, nextSlug }: Props) {
  useEffect(() => {
    if (!journeyId) return

    // ── Journey section viewed ────────────────────────────────────────────────
    const section = document.getElementById('journey-next-step')
    if (!section) return

    let nextStepFired = false
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !nextStepFired) {
            nextStepFired = true
            fire('journey_next_step_viewed', {
              current_slug: slug,
              journey_id: journeyId,
              tracking_label: trackingLabel,
              next_slug: nextSlug,
            })
          }
        })
      },
      { threshold: 0.5 }
    )
    sectionObserver.observe(section)

    // ── CTA clicks (data-journey-cta attribute) ───────────────────────────────
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-journey-cta]') as HTMLElement | null
      if (!target) return
      const label = target.dataset.journeyCta
      const next  = target.dataset.journeyNext
      if (target.dataset.journeySticky) {
        fire('journey_sticky_cta_clicked', { label: label ?? '', next_slug: next ?? '' })
      } else {
        fire('journey_cta_clicked', {
          current_slug: slug,
          journey_id: journeyId,
          label: label ?? '',
          next_slug: next ?? '',
        })
      }
    }
    document.addEventListener('click', handleClick)

    // ── Sticky CTA shown — tracked by StickyCTA component directly ────────────
    // We fire journey_section_viewed once on mount as a baseline
    fire('journey_section_loaded', {
      current_slug: slug,
      journey_id: journeyId,
    })

    return () => {
      sectionObserver.disconnect()
      document.removeEventListener('click', handleClick)
    }
  }, [slug, journeyId, trackingLabel, nextSlug])

  return null
}
