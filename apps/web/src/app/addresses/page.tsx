'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerNav } from '@/components/customer-nav'
import { isCustomerLoggedIn } from '@/lib/auth'
import customerApi from '@/lib/customer-api'
import { MapPin, Plus, Trash2, Edit2, Star, Loader2, ArrowLeft, Locate } from 'lucide-react'

const CITIES = ['Delhi NCR', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune']
const LABELS = ['Home', 'Office', 'Other']

interface Address {
  id: string
  label: string
  addressLine: string
  landmark: string | null
  city: string
  pincode: string
  latitude: number | null
  longitude: number | null
  isDefault: boolean
}

interface AddressForm {
  label: string
  addressLine: string
  landmark: string
  city: string
  pincode: string
  latitude: number | null
  longitude: number | null
}

const emptyForm: AddressForm = {
  label: 'Home',
  addressLine: '',
  landmark: '',
  city: '',
  pincode: '',
  latitude: null,
  longitude: null,
}

export default function AddressesPage() {
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AddressForm>({ ...emptyForm })

  useEffect(() => {
    if (!isCustomerLoggedIn()) {
      router.push('/login?redirect=/addresses')
      return
    }
    fetchAddresses()
  }, [router])

  const fetchAddresses = async () => {
    try {
      const res = await customerApi.get('/addresses')
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? []
      setAddresses(data)
    } catch {
      setMessage({ type: 'error', text: 'Failed to load addresses.' })
    } finally {
      setLoading(false)
    }
  }

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    if (type === 'success') {
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const openAddForm = () => {
    setEditingId(null)
    setForm({ ...emptyForm })
    setShowForm(true)
  }

  const openEditForm = (address: Address) => {
    setEditingId(address.id)
    setForm({
      label: address.label,
      addressLine: address.addressLine,
      landmark: address.landmark || '',
      city: address.city,
      pincode: address.pincode,
      latitude: address.latitude,
      longitude: address.longitude,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ ...emptyForm })
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showMsg('error', 'Geolocation is not supported by your browser.')
      return
    }
    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: parseFloat(position.coords.latitude.toFixed(6)),
          longitude: parseFloat(position.coords.longitude.toFixed(6)),
        }))
        setDetectingLocation(false)
        showMsg('success', 'Location detected successfully!')
      },
      () => {
        setDetectingLocation(false)
        showMsg('error', 'Unable to detect your location. Please allow location access.')
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const validateForm = (): boolean => {
    if (!form.addressLine.trim()) {
      showMsg('error', 'Address line is required.')
      return false
    }
    if (!form.city) {
      showMsg('error', 'Please select a city.')
      return false
    }
    if (!form.pincode.trim()) {
      showMsg('error', 'Pincode is required.')
      return false
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      showMsg('error', 'Pincode must be exactly 6 digits.')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setSaving(true)
    setMessage(null)

    const payload = {
      label: form.label,
      addressLine: form.addressLine.trim(),
      landmark: form.landmark.trim() || null,
      city: form.city,
      pincode: form.pincode.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
    }

    try {
      if (editingId) {
        await customerApi.patch(`/addresses/${editingId}`, payload)
        showMsg('success', 'Address updated successfully!')
      } else {
        await customerApi.post('/addresses', payload)
        showMsg('success', 'Address added successfully!')
      }
      closeForm()
      await fetchAddresses()
    } catch {
      showMsg('error', editingId ? 'Failed to update address.' : 'Failed to add address.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    setDeletingId(id)
    try {
      await customerApi.delete(`/addresses/${id}`)
      setAddresses((prev) => prev.filter((a) => a.id !== id))
      showMsg('success', 'Address deleted.')
    } catch {
      showMsg('error', 'Failed to delete address.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id)
    try {
      await customerApi.patch(`/addresses/${id}/set-default`)
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id }))
      )
      showMsg('success', 'Default address updated.')
    } catch {
      showMsg('error', 'Failed to set default address.')
    } finally {
      setSettingDefaultId(null)
    }
  }

  // Loading state
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

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNav />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-[#FF6B00]" />
              My Addresses
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage your saved addresses</p>
          </div>
          {!showForm && (
            <button
              onClick={openAddForm}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E55E00] text-white font-semibold rounded-xl transition text-sm"
            >
              <Plus className="h-4 w-4" />
              Add Address
            </button>
          )}
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

        {/* Inline Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Label</label>
                <select
                  value={form.label}
                  onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition bg-white"
                >
                  {LABELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {/* Address Line */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address Line <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.addressLine}
                  onChange={(e) => setForm((prev) => ({ ...prev, addressLine: e.target.value }))}
                  placeholder="House/Flat No., Street, Area"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition resize-none"
                />
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Landmark</label>
                <input
                  type="text"
                  value={form.landmark}
                  onChange={(e) => setForm((prev) => ({ ...prev, landmark: e.target.value }))}
                  placeholder="Near any famous place or building"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition"
                />
              </div>

              {/* City & Pincode Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    City <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.city}
                    onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition bg-white"
                  >
                    <option value="">Select a city</option>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setForm((prev) => ({ ...prev, pincode: val }))
                    }}
                    placeholder="6-digit pincode"
                    maxLength={6}
                    inputMode="numeric"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Detect Location */}
              <div>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
                >
                  {detectingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#FF6B00]" />
                  ) : (
                    <Locate className="h-4 w-4 text-[#FF6B00]" />
                  )}
                  {detectingLocation ? 'Detecting...' : 'Detect Location'}
                </button>
                {form.latitude !== null && form.longitude !== null && (
                  <p className="text-xs text-gray-500 mt-1.5">
                    Coordinates: {form.latitude}, {form.longitude}
                  </p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-[#FF6B00] hover:bg-[#E55E00] text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : editingId ? (
                    <Edit2 className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : editingId ? 'Update Address' : 'Add Address'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Address List */}
        {addresses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No addresses saved</h3>
            <p className="text-gray-500 text-sm mb-6">
              Add your first address to get services delivered to your doorstep.
            </p>
            {!showForm && (
              <button
                onClick={openAddForm}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E55E00] text-white font-semibold rounded-xl transition text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Your First Address
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white rounded-2xl shadow-sm border p-5 transition ${
                  address.isDefault
                    ? 'border-[#FF6B00]/40 ring-1 ring-[#FF6B00]/20'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Address Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                        <MapPin className="h-3 w-3" />
                        {address.label}
                      </span>
                      {address.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#FF6B00]/10 text-[#FF6B00]">
                          <Star className="h-3 w-3 fill-current" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 font-medium text-sm leading-relaxed">
                      {address.addressLine}
                    </p>
                    {address.landmark && (
                      <p className="text-gray-500 text-xs mt-0.5">Near: {address.landmark}</p>
                    )}
                    <p className="text-gray-500 text-sm mt-1">
                      {address.city} &mdash; {address.pincode}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        disabled={settingDefaultId === address.id}
                        title="Set as default"
                        className="p-2 text-gray-400 hover:text-[#FF6B00] hover:bg-orange-50 rounded-lg transition disabled:opacity-50"
                      >
                        {settingDefaultId === address.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => openEditForm(address)}
                      title="Edit address"
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      disabled={deletingId === address.id}
                      title="Delete address"
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    >
                      {deletingId === address.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
