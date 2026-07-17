import { USD_RATES } from './rates.js'

export interface LiveRatesResult {
  rates: Record<string, number>
  updatedAt: string   // ISO timestamp from API
  isLive: boolean     // false = static fallback
}

// open.er-api.com — free, no API key, 1500 req/month
// Next.js revalidate: 86400 = refresh cache every 24 hours
export async function fetchLiveRates(): Promise<LiveRatesResult> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 86400 },
    })

    if (!res.ok) throw new Error(`API error: ${res.status}`)

    const data = await res.json() as {
      result: string
      rates: Record<string, number>
      time_last_update_utc: string
    }

    if (data.result !== 'success' || !data.rates) throw new Error('Invalid API response')

    return {
      rates: data.rates,
      updatedAt: data.time_last_update_utc,
      isLive: true,
    }
  } catch {
    // Silent fallback to static rates — never break the page
    return {
      rates: USD_RATES,
      updatedAt: new Date().toISOString(),
      isLive: false,
    }
  }
}
