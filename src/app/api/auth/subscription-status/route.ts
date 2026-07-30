import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getUserSubscriptionStatus } from '@/lib/member/subscription'

export async function GET(_req: NextRequest) {
  const session = await getServerSession()
  const userId = (session?.user as { id?: string } | undefined)?.id

  if (!userId) {
    return NextResponse.json({ isPro: false, tier: 'free', trialDaysRemaining: null })
  }

  const status = await getUserSubscriptionStatus(userId)
  if (!status) {
    return NextResponse.json({ isPro: false, tier: 'free', trialDaysRemaining: null })
  }

  return NextResponse.json(status)
}
