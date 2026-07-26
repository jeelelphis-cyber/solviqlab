'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AccountService } from '@/lib/account/service'
import type { InstrumentResult } from '@/lib/products/types'

function detectCluster(slug: string, metadata: Record<string, unknown>): string {
  if (typeof metadata['cluster'] === 'string') return metadata['cluster']
  if (slug.includes('sleep')) return 'sleep'
  if (slug.includes('pregnancy') || slug.includes('due-date') || slug.includes('ovulation')) return 'pregnancy'
  if (slug.includes('bmi') || slug.includes('body-fat') || slug.includes('tdee') ||
      slug.includes('weight') || slug.includes('calorie') || slug.includes('bmr')) return 'weight'
  if (slug.includes('loan') || slug.includes('mortgage') || slug.includes('saving') ||
      slug.includes('invest') || slug.includes('retire') || slug.includes('tax') ||
      slug.includes('salary') || slug.includes('finance') || slug.includes('budget') ||
      slug.includes('debt') || slug.includes('roi') || slug.includes('compound')) return 'finance'
  return 'other'
}

export function AccountAutoSave() {
  const pathname = usePathname()
  const lang = pathname.split('/')[1] ?? 'en'

  useEffect(() => {
    function onResult(e: Event) {
      const detail = (e as CustomEvent).detail as InstrumentResult | undefined
      if (!detail?.slug) return
      AccountService.saveToHistory({
        slug: detail.slug,
        name: detail.name,
        value: detail.value,
        label: detail.label ?? null,
        unit: detail.unit ?? null,
        cluster: detectCluster(detail.slug, detail.metadata),
        lang,
        timestamp: Date.now(),
      })
    }
    window.addEventListener('solviqlab:result', onResult)
    return () => window.removeEventListener('solviqlab:result', onResult)
  }, [lang])

  return null
}
