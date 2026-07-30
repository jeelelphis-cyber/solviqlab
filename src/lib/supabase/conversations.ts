import { createServiceClient } from './server'
import { supabase } from './client'

// All writes use service client (bypasses RLS, safe server-side only)
// All reads use anon client (sufficient for user-scoped queries with userId param)

export interface ConversationMessage {
  id?: string
  user_id: string
  coach_id: string
  role: 'coach' | 'user'
  content: string
  created_at?: string
}

export interface CoachSelection {
  user_id: string
  coach_id: string
  cluster: string | null
  selected_at?: string
}

// Load last N messages for a user+coach pair (server or client)
export async function loadConversation(
  userId: string,
  coachId: string,
  limit = 40,
): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, user_id, coach_id, role, content, created_at')
    .eq('user_id', userId)
    .eq('coach_id', coachId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) { console.error('loadConversation:', error.message); return [] }
  return (data ?? []) as ConversationMessage[]
}

// Save a single message
export async function saveMessage(msg: Omit<ConversationMessage, 'id' | 'created_at'>): Promise<void> {
  const { error } = await createServiceClient().from('conversations').insert(msg)
  if (error) console.error('saveMessage:', error.message)
}

// Save multiple messages at once (bulk insert for history migration)
export async function saveMessages(msgs: Omit<ConversationMessage, 'id' | 'created_at'>[]): Promise<void> {
  if (!msgs.length) return
  const { error } = await createServiceClient().from('conversations').insert(msgs)
  if (error) console.error('saveMessages:', error.message)
}

// Get days since last conversation
export async function getDaysSinceLastConversation(userId: string, coachId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('created_at')
    .eq('user_id', userId)
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error || !data?.length) return null
  const last = new Date(data[0].created_at)
  const diff = Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

// Save/update coach selection
export async function saveCoachSelection(selection: CoachSelection): Promise<void> {
  const { error } = await createServiceClient()
    .from('user_coach_selections')
    .upsert(selection, { onConflict: 'user_id,coach_id' })
  if (error) console.error('saveCoachSelection:', error.message)
}

// Get user's selected coach for a cluster
export async function getCoachForCluster(userId: string, cluster: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_coach_selections')
    .select('coach_id')
    .eq('user_id', userId)
    .eq('cluster', cluster)
    .order('selected_at', { ascending: false })
    .limit(1)

  if (error || !data?.length) return null
  return data[0].coach_id
}

// Server-side: extract topic keywords from recent messages (for memory summary)
export async function getRecentTopics(userId: string, coachId: string): Promise<string[]> {
  const msgs = await loadConversation(userId, coachId, 10)
  const userMsgs = msgs.filter(m => m.role === 'user').map(m => m.content)
  // Simple keyword extraction — topics based on content length and keywords
  const keywords = userMsgs
    .join(' ')
    .toLowerCase()
    .match(/\b(weight|sleep|stress|diet|exercise|pain|energy|goal|plan|habit|water|calories|bmi|workout)\b/g)
  if (!keywords) return []
  return [...new Set(keywords)].slice(0, 5)
}

// Delete all conversations (GDPR / account deletion)
export async function deleteConversations(userId: string): Promise<void> {
  const client = createServiceClient()
  await client.from('conversations').delete().eq('user_id', userId)
  await client.from('user_coach_selections').delete().eq('user_id', userId)
}
