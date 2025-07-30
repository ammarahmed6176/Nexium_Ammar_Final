'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import type { User } from '@supabase/supabase-js'
import { Moon, Sun, Settings, LogOut } from 'lucide-react'

type FormData = {
  name: string
  idea: string
  targetAudience: string
  tone: string
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    idea: '',
    targetAudience: '',
    tone: '',
  })
  const [pitch, setPitch] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [username, setUsername] = useState('')
  const [saveMsg, setSaveMsg] = useState('')
  const [isGuest, setIsGuest] = useState(false)
  const [saving, setSaving] = useState(false)
interface PitchItem {
  id: string
  name: string
  pitch: string
  [key: string]: string
}

const [pitchHistory, setPitchHistory] = useState<PitchItem[]>([])

  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      const guest = localStorage.getItem('guest_mode') === 'true'
      setIsGuest(guest)
      if (guest) return

      let attempts = 0
      let userData = null

      while (attempts < 5) {
        const { data } = await supabase.auth.getUser()
        if (data.user) {
          userData = data.user
          break
        }
        await new Promise((res) => setTimeout(res, 300))
        attempts++
      }

      if (!userData) {
        router.push('/')
      } else {
        setUser(userData)
        setUsername(userData.user_metadata?.username ?? '')
        fetchHistory(userData.id)
      }
    }

    checkAccess()
  }, [router])

  const fetchHistory = async (userId: string) => {
    const { data, error } = await supabase
      .from('pitches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching history:', error)
    } else {
      setPitchHistory(data || [])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setMessage('')
    try {
      const response = await axios.post('/api/generate', formData)
      setPitch(response.data.pitch)
    }catch (err) {
  if (err instanceof Error) {
    console.error(err.message)
  } else {
    console.error('Unknown error occurred.')
  }
}
finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (isGuest) {
      localStorage.removeItem('guest_mode')
      router.push('/')
    } else {
      await supabase.auth.signOut()
      router.push('/')
    }
  }

  const handleSaveSettings = async () => {
    if (isGuest || !user) return
    const { error } = await supabase.auth.updateUser({ data: { username } })
    setSaveMsg(error ? '❌ Failed to update username.' : '✅ Username saved!')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  const handleClearForm = () => {
    setFormData({ name: '', idea: '', targetAudience: '', tone: '' })
    setPitch('')
  }

  const handleDeleteAccount = async () => {
    if (isGuest) return alert("Guest accounts cannot delete data.")
    const confirmed = confirm('⚠️ Are you sure you want to delete your account? This cannot be undone.')
    if (!confirmed || !user) return
    await supabase.rpc('delete_user')
    await supabase.auth.signOut()
    router.push('/')
  }

  const speakPitch = () => {
    if (!pitch) return
    const utterance = new SpeechSynthesisUtterance(pitch)
    speechSynthesis.speak(utterance)
  }

  const copyPitch = () => {
    navigator.clipboard.writeText(pitch)
  }

  const exportPitch = () => {
    const blob = new Blob([pitch], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pitch.txt'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const savePitch = async () => {
    if (!user || !pitch) return
    setSaving(true)

    const { error } = await supabase.from('pitches').insert([
      {
        user_id: user.id,
        pitch,
        name: formData.name,
        idea: formData.idea,
        targetaudience: formData.targetAudience,
        tone: formData.tone,
      },
    ])

    if (error) {
      console.error('❌ Error saving pitch:', error)
    } else {
      await fetchHistory(user.id)
    }

    setSaving(false)
  }

 return (
  <div
    className="min-h-screen bg-cover bg-center bg-no-repeat"
    style={{
      backgroundImage: "url('/bg.jpg')",
    }}
  >
    <main
      className={`min-h-screen transition-colors duration-300 py-10 px-4 ${
        darkMode ? 'text-white' : 'text-gray-900'
      }`}
    >
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Header */}
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-md">
            CREATIVE PITCHES
          </h1>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 border rounded-full ${
                darkMode ? 'bg-white/20' : 'bg-gray-200'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 border rounded-full ${
                darkMode ? 'bg-white/20' : 'bg-gray-200'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={handleLogout} className="p-2 bg-red-500 text-white rounded-full">
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition"
            >
              {showHistory ? 'Hide History' : 'Show History'}
            </button>
          </div>
        </header>

        {/* Settings */}
        {showSettings && (
          <section
            className={`p-6 rounded-xl shadow space-y-4 border ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/90 border-gray-300'
            }`}
          >
            {!isGuest && (
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  disabled
                  value={user?.email ?? ''}
                  className="w-full px-3 py-2 rounded text-sm bg-gray-100 dark:bg-gray-700 text-black dark:text-white"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm bg-white dark:bg-gray-900 dark:border-gray-700 text-black dark:text-white"
                placeholder="e.g. john_doe"
                disabled={isGuest}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleSaveSettings} className="bg-blue-600 text-white px-4 py-1 rounded text-sm" disabled={isGuest}>
                Save
              </button>
              <button onClick={handleClearForm} className="bg-yellow-500 text-white px-4 py-1 rounded text-sm">
                Clear Inputs
              </button>
              <button onClick={handleDeleteAccount} className="bg-red-600 text-white px-4 py-1 rounded text-sm" disabled={isGuest}>
                Delete Account
              </button>
            </div>
            {saveMsg && <p className="text-sm mt-2">{saveMsg}</p>}
            {isGuest && <p className="text-sm mt-2 text-yellow-600">⚠️ Guest Mode — settings would not be saved.</p>}
          </section>
        )}

        {/* Form */}
        <section
          className={`p-6 rounded-xl shadow space-y-4 border ${
            darkMode ? 'bg-gray-800 border-black' : 'bg-white/90 border-black'
          }`}
        >
          {['name', 'targetAudience', 'tone'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium mb-2 capitalize">
                {field === 'name' ? 'Name' : field.replace(/([A-Z])/g, ' $1')}
              </label>
              <input
                name={field}
                value={(formData as Record<string, string>)[field]}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded text-sm bg-[#9ddfff]
 dark:bg-gray-900 dark:border-black text-black dark:text-white"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-2">Startup Idea</label>
            <textarea
              name="idea"
              value={formData.idea}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border rounded text-sm bg-[#9ddfff]
 dark:bg-gray-900 dark:border-black text-black dark:text-white"
              />
          </div>
          <button onClick={handleSubmit} disabled={loading} className="w-full py-2 bg-black text-white rounded">
            {loading ? 'Generating...' : 'Generate Pitch'}
          </button>
        </section>

        {/* Output & Buttons */}
        {pitch && (
          <section
            className={`p-6 rounded-xl border shadow space-y-4 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/90 border-gray-300'
            }`}
          >
            <p className="whitespace-pre-wrap">{pitch}</p>
            <div className="flex flex-col sm:flex-row gap-14">
              <button onClick={speakPitch} className="bg-gray-900 text-white px-8 py-2 rounded">
                🔊 Speak
              </button>
              <button onClick={copyPitch} className="bg-gray-900 text-white px-8 py-2 rounded">
                📋 Copy
              </button>
              <button onClick={exportPitch} className="bg-gray-900 text-white px-8 py-2 rounded">
                ⬇️ Export
              </button>
              {!isGuest && (
                <button onClick={savePitch} disabled={saving} className="bg-gray-900 text-white px-8 py-2 rounded">
                  {saving ? 'Saving...' : '💾 Save'}
                </button>
              )}
            </div>
          </section>
        )}

        {/* Pitch History */}
        {!isGuest && showHistory && (
          <section
            className={`p-5 rounded-xl text-sm border shadow ${
              darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white/90 border-gray-300'
            }`}
          >
            <h2 className="text-lg font-semibold mb-2">📜 Pitch History</h2>
            {pitchHistory.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No saved pitches yet.</p>
            ) : (
              <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {pitchHistory.map((item) => (
                  <li key={item.id} className="border-b pb-1">
                    <strong>{item.name}:</strong> {item.pitch}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Error Message */}
        {message && (
          <div
            className={`p-3 rounded text-sm border ${
              darkMode ? 'bg-red-900 text-red-200 border-red-600' : 'bg-red-100 text-red-800 border-red-300'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </main>
  </div>
)
}