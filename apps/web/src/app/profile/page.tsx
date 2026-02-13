'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerNav } from '@/components/customer-nav'
import { isCustomerLoggedIn, getCustomerUser, setCustomerAuth, customerLogout } from '@/lib/auth'
import customerApi from '@/lib/customer-api'
import { User, Save, Mail, Phone, MapPin, Globe, Trash2, Download, Loader2, ArrowLeft, LogOut } from 'lucide-react'

const CITIES = ['Delhi NCR', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune']

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'mr', label: 'Marathi' },
  { code: 'kn', label: 'Kannada' },
]

interface ProfileData {
  id: string
  phone: string
  name: string | null
  email: string | null
  avatarUrl: string | null
  preferredLanguage: string
  city: string | null
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [language, setLanguage] = useState('en')

  useEffect(() => {
    if (!isCustomerLoggedIn()) {
      router.push('/login?redirect=/profile')
      return
    }
    fetchProfile()
  }, [router])

  const fetchProfile = async () => {
    try {
      const res = await customerApi.get('/users/me')
      const data = res.data as ProfileData
      setProfile(data)
      setName(data.name || '')
      setEmail(data.email || '')
      setCity(data.city || '')
      setLanguage(data.preferredLanguage || 'en')
    } catch {
      setMessage({ type: 'error', text: 'Failed to load profile.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Name is required.' })
      return
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const payload: Record<string, string> = {
        name: name.trim(),
        preferredLanguage: language,
      }
      if (email.trim()) payload.email = email.trim()
      if (city) payload.city = city

      const res = await customerApi.patch('/users/me', payload)
      const updated = res.data as ProfileData
      setProfile(updated)

      // Sync localStorage user data
      const currentUser = getCustomerUser()
      if (currentUser) {
        setCustomerAuth(localStorage.getItem('customer_token') || '', {
          ...currentUser,
          name: updated.name || currentUser.name,
        })
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    setExporting(true)
    try {
      const res = await customerApi.get('/users/me/data-export')
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bharatclap-data-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMessage({ type: 'success', text: 'Data exported and downloaded!' })
      setTimeout(() => setMessage(null), 3000)
    } catch {
      setMessage({ type: 'error', text: 'Failed to export data.' })
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return
    if (!confirm('FINAL WARNING: All your data including bookings, reviews, and personal information will be permanently deleted.')) return

    setDeleting(true)
    try {
      await customerApi.delete('/users/me')
      customerLogout()
      router.push('/')
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete account.' })
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerNav />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
        </div>
      </div>
    )
  }

  const initials = (name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNav />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-[#FF6B00] flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile?.name || 'Your Profile'}</h1>
              <p className="text-gray-500 text-sm mt-1">Manage your account details</p>
              {profile?.createdAt && (
                <p className="text-gray-400 text-xs mt-1">
                  Member since {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`rounded-xl px-4 py-3 mb-6 text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-[#FF6B00]" />
            Personal Information
          </h2>

          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-gray-400" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition"
              />
            </div>

            {/* Phone (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-gray-400" />
                Phone Number
              </label>
              <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500">
                {profile?.phone || 'Not set'}
              </div>
              <p className="text-xs text-gray-400 mt-1">Phone number cannot be changed</p>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gray-400" />
                City
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition bg-white"
              >
                <option value="">Select a city</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-gray-400" />
                Preferred Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition bg-white"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="mt-8 w-full py-3 bg-[#FF6B00] hover:bg-[#E55E00] text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Data & Account Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Data & Account</h2>

          <div className="space-y-3">
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-left disabled:opacity-60"
            >
              {exporting ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#FF6B00]" />
              ) : (
                <Download className="h-5 w-5 text-[#FF6B00]" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {exporting ? 'Exporting...' : 'Export My Data'}
                </p>
                <p className="text-xs text-gray-500">Download all your personal data as JSON</p>
              </div>
            </button>

            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="w-full flex items-center gap-3 px-4 py-3 border border-red-200 rounded-xl hover:bg-red-50 transition text-left disabled:opacity-60"
            >
              {deleting ? (
                <Loader2 className="h-5 w-5 animate-spin text-red-500" />
              ) : (
                <Trash2 className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="text-sm font-medium text-red-600">
                  {deleting ? 'Deleting...' : 'Delete Account'}
                </p>
                <p className="text-xs text-red-400">Permanently remove your account and all data</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
