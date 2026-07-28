import { supabase } from './client'
import type { Session } from 'next-auth'

// Upsert user after Google sign-in
export async function syncUser(session: Session): Promise<string | null> {
  const googleId = (session.user as { googleId?: string }).googleId
  if (!googleId) return null

  const { data, error } = await supabase
    .from('users')
    .upsert({
      google_id:  googleId,
      email:      session.user?.email ?? '',
      name:       session.user?.name ?? null,
      avatar_url: session.user?.image ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'google_id' })
    .select('id')
    .single()

  if (error) { console.error('syncUser:', error.message); return null }
  return data?.id ?? null
}

// Migrate localStorage results to Supabase (runs once after sign-in)
export async function migrateLocalData(userId: string): Promise<void> {
  if (typeof window === 'undefined') return

  // Check if already migrated
  const migrated = localStorage.getItem(`migrated_${userId}`)
  if (migrated) return

  try {
    const history: unknown[] = JSON.parse(localStorage.getItem('solviq_history') ?? '[]')
    if (history.length === 0) { localStorage.setItem(`migrated_${userId}`, '1'); return }

    const rows = (history as Array<{
      slug?: string; name?: string; result_value?: number | null;
      result_label?: string | null; unit?: string | null;
      cluster?: string | null; completed_at?: string
    }>).map(item => ({
      user_id:         userId,
      instrument_slug: item.slug ?? '',
      instrument_name: item.name ?? '',
      result_value:    item.result_value ?? null,
      result_label:    item.result_label ?? null,
      unit:            item.unit ?? null,
      cluster:         item.cluster ?? null,
      completed_at:    item.completed_at ?? new Date().toISOString(),
    }))

    const { error } = await supabase.from('results').upsert(rows, { ignoreDuplicates: true })
    if (!error) {
      localStorage.setItem(`migrated_${userId}`, '1')
    }
  } catch (e) {
    console.error('migrateLocalData:', e)
  }
}
