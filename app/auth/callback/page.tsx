'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        localStorage.removeItem('guest_mode') // clear guest flag if any
        router.push('/dashboard')
      }
    })

    // fallback: if already signed in (e.g. reload or redirect back)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        localStorage.removeItem('guest_mode')
        router.push('/dashboard')
      }
    })

    return () => {
      subscription.subscription?.unsubscribe()
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-black dark:text-white">
      <p className="text-lg font-semibold">🔄 Logging you in, please wait...</p>
    </div>
  )
}
