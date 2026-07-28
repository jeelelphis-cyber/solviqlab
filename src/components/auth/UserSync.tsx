'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { syncUser, migrateLocalData } from '@/lib/supabase/user-sync'

export function UserSync() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated' || !session) return

    async function run() {
      const userId = await syncUser(session!)
      if (userId) await migrateLocalData(userId)
    }

    run()
  }, [session, status])

  return null
}
