'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    const checkSession = async () => {
      const isGuest = localStorage.getItem('guest_mode') === 'true'
      if (isGuest) return

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email_confirmed_at) {
        router.push('/dashboard')
      }
    }

    checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const isGuest = localStorage.getItem('guest_mode') === 'true'
      if (!isGuest && session?.user?.email_confirmed_at) {
        router.push('/dashboard')
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [router])

  const handleLogin = async () => {
    if (!/\S+@\S+\.\S+/.test(email)) {
      setMessage('❌ Enter a valid email')
      return
    }

   const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: true,
    emailRedirectTo: `${location.origin}/auth/callback`, // ✅ ensures proper redirection
  },
})

    if (error) {
      setMessage(`❌ ${error.message}`)
    } else {
setMessage('Magic link sent! Check your email.')

    }
  }

  const continueAsGuest = () => {
    localStorage.setItem('guest_mode', 'true')
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-white dark:bg-gray-900 transition-colors duration-300 text-gray-900 dark:text-white relative">
      
      {/* Dark Mode Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {darkMode ? '🌞 Light' : '🌙 Dark'}
        </button>
      </div>

      {/* Intro Panel */}
      <section className="md:w-1/2 p-10 space-y-6">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">
          Welcome to Creative Pitches
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300">
          ✨ Turn your startup ideas into compelling pitches with AI assistance. Whether you are refining an elevator pitch or preparing to fundraise, Creative Pitches is your copilot.
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li>🎯 Tailored to your target audience</li>
          <li>🗣️ Matches your preferred tone</li>
          <li>🧠 Saves and manages past pitches</li>
        </ul>
      </section>

      {/* Auth Panel */}
      <section className="md:w-1/2 w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-md space-y-6 border border-gray-200 dark:border-gray-700 mx-4 my-10 md:my-0">
        <div>
          <h2 className="text-2xl font-semibold text-center">Login or Continue</h2>
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            Log in via email or continue as guest.
          </p>
        </div>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white text-black dark:bg-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />

        <button
          onClick={handleLogin}
          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
        >
          Login with Magic Link
        </button>

        <div className="text-center text-xs text-gray-500 dark:text-gray-400">or</div>

        <button
          onClick={continueAsGuest}
          className="w-full py-2 rounded-lg bg-gray-700 hover:bg-gray-800 text-white font-semibold transition"
        >
          Continue as Guest
        </button>

        {message && (
  <div
    className={`mt-6 w-full max-w-md rounded-lg px-5 py-4 shadow-sm border text-sm font-medium text-center transition-all duration-300
      ${
        message.toLowerCase().startsWith('magic')
          ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-700'
          : 'bg-red-100 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-100 dark:border-red-700'
      }`}
    role="alert"
    aria-live="polite"
  >
    {message}
  </div>
)}


      </section>
    </main>
  )
}
