// ─────────────────────────────────────────────────────────────────────────────
// Member Platform — Subscription
//
// isPro() is the ONLY function that decides PRO access.
// Never duplicate this logic. Always import from here.
// ─────────────────────────────────────────────────────────────────────────────

import { createServiceClient } from '@/lib/supabase/server'

const GRACE_PERIOD_DAYS = 3

export type MemberUser = {
  id: string
  email: string
  trialExpiresAt: string | null
  stripeStatus: 'active' | 'past_due' | 'canceled' | 'trialing' | null
  stripePeriodEnd: string | null
}

export type SubscriptionStatus = {
  isPro: boolean
  tier: 'free' | 'trial' | 'pro'
  trialDaysRemaining: number | null
}

// Single source of truth — used everywhere
export function isPro(user: MemberUser): boolean {
  const now = new Date()

  if (user.stripeStatus === 'active' || user.stripeStatus === 'trialing') return true

  if (user.stripeStatus === 'past_due' && user.stripePeriodEnd) {
    const grace = new Date(user.stripePeriodEnd)
    grace.setDate(grace.getDate() + GRACE_PERIOD_DAYS)
    return now < grace
  }

  if (user.trialExpiresAt && now < new Date(user.trialExpiresAt)) return true

  return false
}

export function getSubscriptionStatus(user: MemberUser): SubscriptionStatus {
  const now = new Date()
  const isUserPro = isPro(user)

  if (!isUserPro) return { isPro: false, tier: 'free', trialDaysRemaining: null }

  if (user.stripeStatus === 'active') return { isPro: true, tier: 'pro', trialDaysRemaining: null }

  if (user.trialExpiresAt) {
    const daysRemaining = Math.max(
      0,
      Math.ceil((new Date(user.trialExpiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    )
    return { isPro: true, tier: 'trial', trialDaysRemaining: daysRemaining }
  }

  return { isPro: true, tier: 'pro', trialDaysRemaining: null }
}

// Server-side: fetch user + compute status
export async function getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, email, trial_expires_at, stripe_status, stripe_period_end')
    .eq('id', userId)
    .single()

  if (error || !data) return null

  const user: MemberUser = {
    id: data.id,
    email: data.email,
    trialExpiresAt: data.trial_expires_at,
    stripeStatus: data.stripe_status,
    stripePeriodEnd: data.stripe_period_end,
  }

  return getSubscriptionStatus(user)
}

// Server-side: check and throw if not PRO
export async function requirePro(userId: string | null): Promise<SubscriptionStatus> {
  if (!userId) throw new Error('UNAUTHORIZED')
  const status = await getUserSubscriptionStatus(userId)
  if (!status?.isPro) throw new Error('TRIAL_EXPIRED')
  return status
}
