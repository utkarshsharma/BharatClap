'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import customerApi from '@/lib/customer-api'
import axios from 'axios'
import { isCustomerLoggedIn } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { CustomerNav, getStoredAddress } from '@/components/customer-nav'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Loader2,
  MapPin,
  Calendar,
  Clock,
  ChevronDown,
  Star,
  Plus,
  Minus,
} from 'lucide-react'

const queryClient = new QueryClient()

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const hour = 8 + i
  const label = hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`
  return { hour, label }
})

interface Address {
  id: string
  label: string
  addressLine: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

function isAddressServiceable(addressCity: string, providerCity: string): boolean {
  if (!addressCity || !providerCity) return true
  const a = addressCity.toLowerCase().trim()
  const p = providerCity.toLowerCase().trim()
  return a === p || a.includes(p) || p.includes(a)
}

function BookPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const serviceId = searchParams.get('serviceId')
  const providerId = searchParams.get('providerId')

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [addressOpen, setAddressOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [notesOpen, setNotesOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [emergencyOpen, setEmergencyOpen] = useState(false)
  const [emergencyContact, setEmergencyContact] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Auth guard
  useEffect(() => {
    if (!isCustomerLoggedIn()) {
      const currentUrl = `/book?serviceId=${serviceId}&providerId=${providerId}`
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`)
    }
  }, [router, serviceId, providerId])

  // Fetch addresses
  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await customerApi.get('/addresses')
      return (res.data.data ?? res.data) as Address[]
    },
    enabled: isCustomerLoggedIn(),
  })

  // Fetch service info
  const { data: serviceInfo } = useQuery({
    queryKey: ['service-info', serviceId],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/services?limit=100`)
      const services = res.data.data ?? res.data
      return Array.isArray(services) ? services.find((s: any) => s.id === serviceId) : null
    },
    enabled: !!serviceId,
  })

  // Fetch provider info
  const { data: providerInfo } = useQuery({
    queryKey: ['provider-info', providerId],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/providers/${providerId}`)
      return res.data.data ?? res.data
    },
    enabled: !!providerId,
  })

  // Provider city for address filtering
  const providerCity = providerInfo?.city ?? providerInfo?.user?.city ?? ''
  const providerName = providerInfo?.user?.name ?? 'Provider'
  const providerRating = providerInfo?.avgRating ?? 0
  const serviceName = serviceInfo?.name ?? 'Service'
  const servicePrice = serviceInfo?.basePrice ?? 0
  // Use the provider's custom price for this service if available
  const customPrice = providerInfo?.providerServices?.find(
    (ps: any) => ps.service?.id === serviceId || ps.serviceId === serviceId
  )?.customPrice
  const displayPrice = customPrice ?? servicePrice

  // Default date: tomorrow
  useEffect(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }, [])

  // Auto-select address: prefer stored address from nav, then default, then first serviceable
  useEffect(() => {
    if (addresses && !selectedAddress) {
      const serviceable = addresses.filter((a) => isAddressServiceable(a.city, providerCity))

      // Try stored address from nav first
      const stored = getStoredAddress()
      if (stored) {
        const match = serviceable.find((a) => a.id === stored.id)
        if (match) {
          setSelectedAddress(match)
          return
        }
      }

      const defaultAddr = serviceable.find((a) => a.isDefault) || serviceable[0]
      if (defaultAddr) setSelectedAddress(defaultAddr)
    }
  }, [addresses, selectedAddress, providerCity])

  const minDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })()

  const maxDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })()

  const canConfirm = selectedAddress && selectedDate && selectedHour !== null

  const handleConfirm = async () => {
    if (!serviceId || !providerId || !selectedAddress || !selectedDate || selectedHour === null) return

    setSubmitting(true)
    setError('')
    try {
      const res = await customerApi.post('/bookings', {
        serviceId,
        providerId,
        addressId: selectedAddress.id,
        scheduledDate: selectedDate,
        scheduledHour: selectedHour,
        customerNotes: notes || undefined,
        emergencyContactPhone: emergencyContact || undefined,
      })
      const booking = res.data.data ?? res.data
      router.push(`/booking/${booking.id}`)
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create booking'
      setError(Array.isArray(msg) ? msg.join('\n') : msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!serviceId || !providerId) {
    return (
      <div className="min-h-screen bg-background">
        <CustomerNav />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-2">Missing booking parameters</h1>
          <p className="text-gray-600 mb-4">Please select a service and provider first.</p>
          <Button asChild><a href="/services">Browse Services</a></Button>
        </div>
      </div>
    )
  }

  // Sort addresses: serviceable first
  const sortedAddresses = [...(addresses ?? [])].sort((a, b) => {
    const aOk = isAddressServiceable(a.city, providerCity)
    const bOk = isAddressServiceable(b.city, providerCity)
    if (aOk && !bOk) return -1
    if (!aOk && bOk) return 1
    if (a.isDefault && !b.isDefault) return -1
    if (!a.isDefault && b.isDefault) return 1
    return 0
  })

  return (
    <div className="min-h-screen bg-background">
      <CustomerNav />

      <div className="container mx-auto px-4 py-8 max-w-xl">
        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-primary mb-4 flex items-center gap-1"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Book Service</h1>

        {/* No addresses banner */}
        {!addressesLoading && addresses && addresses.length === 0 && (
          <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-center">
            <p className="text-sm font-semibold text-gray-900 mb-1">No addresses saved</p>
            <p className="text-xs text-gray-500 mb-3">Add a delivery address to continue booking.</p>
            <a
              href="/addresses"
              className="inline-block px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition"
            >
              Add Address
            </a>
          </div>
        )}

        {/* Address selector */}
        <div className="mb-5">
          <div
            onClick={() => setAddressOpen(!addressOpen)}
            className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100 cursor-pointer hover:bg-orange-100 transition-colors"
          >
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            {addressesLoading ? (
              <span className="text-sm text-gray-400 flex-1">Loading addresses...</span>
            ) : selectedAddress ? (
              <span className="text-sm font-medium text-gray-900 flex-1 truncate">
                {selectedAddress.label} — {selectedAddress.city}, {selectedAddress.pincode}
              </span>
            ) : (
              <span className="text-sm text-gray-400 flex-1">Select an address</span>
            )}
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${addressOpen ? 'rotate-180' : ''}`} />
          </div>

          {addressOpen && (
            <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {sortedAddresses.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No addresses saved.{' '}
                  <a href="/addresses" className="text-primary font-medium hover:underline">
                    Add one
                  </a>
                </div>
              ) : (
                <>
                  {sortedAddresses.map((addr) => {
                    const serviceable = isAddressServiceable(addr.city, providerCity)
                    const isSelected = selectedAddress?.id === addr.id
                    return (
                      <div
                        key={addr.id}
                        onClick={() => {
                          if (serviceable) {
                            setSelectedAddress(addr)
                            setAddressOpen(false)
                          }
                        }}
                        className={`flex items-center gap-3 p-3 border-b border-gray-100 last:border-0 transition-colors ${
                          serviceable
                            ? isSelected
                              ? 'bg-orange-50'
                              : 'hover:bg-gray-50 cursor-pointer'
                            : 'bg-gray-50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                            isSelected ? 'border-primary' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{addr.label}</span>
                            {addr.isDefault && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {addr.addressLine}, {addr.city} — {addr.pincode}
                          </p>
                          {!serviceable && (
                            <p className="text-xs text-red-400 mt-0.5">Not in service area</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <a
                    href="/addresses"
                    className="block p-3 text-center text-sm text-primary font-medium hover:bg-gray-50"
                  >
                    + Manage Addresses
                  </a>
                </>
              )}
            </div>
          )}
        </div>

        {/* Service + Provider card */}
        <Card className="mb-5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
              {providerName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{serviceName}</p>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <span className="truncate">{providerName}</span>
                {providerRating > 0 && (
                  <>
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
                    <span>{providerRating.toFixed(1)}</span>
                  </>
                )}
              </div>
            </div>
            <span className="text-lg font-bold text-primary shrink-0">
              {formatCurrency(displayPrice)}
            </span>
          </CardContent>
        </Card>

        {/* Date picker */}
        <div className="mb-5">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-2">
            <Calendar className="h-4 w-4" />
            Select Date
          </label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={minDate}
            max={maxDate}
            className="w-full"
          />
        </div>

        {/* Time slots */}
        <div className="mb-5">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-2">
            <Clock className="h-4 w-4" />
            Select Time
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot.hour}
                className={`px-2 py-2 text-sm rounded-lg border transition-all ${
                  selectedHour === slot.hour
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary'
                }`}
                onClick={() => setSelectedHour(slot.hour)}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>

        {/* Collapsible Notes */}
        <div className="mb-3">
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {notesOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            Add notes for provider
          </button>
          {notesOpen && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions or requests..."
              className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              rows={3}
            />
          )}
        </div>

        {/* Collapsible Emergency Contact */}
        <div className="mb-6">
          <button
            onClick={() => setEmergencyOpen(!emergencyOpen)}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {emergencyOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            Add emergency contact
          </button>
          {emergencyOpen && (
            <Input
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="10-digit phone number"
              maxLength={10}
              className="mt-2"
              type="tel"
            />
          )}
        </div>

        {/* Price breakdown */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Service Charge</span>
            <span className="font-medium text-gray-900">{formatCurrency(displayPrice)}</span>
          </div>
          <div className="border-t border-gray-200 my-3" />
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900">Total</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(displayPrice)}</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">{error}</p>
        )}

        {/* Confirm button */}
        <Button
          onClick={handleConfirm}
          disabled={!canConfirm || submitting}
          size="lg"
          className="w-full"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {submitting ? 'Creating booking...' : `Confirm & Pay ${formatCurrency(displayPrice)}`}
        </Button>
      </div>
    </div>
  )
}

export default function BookPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <BookPageContent />
    </QueryClientProvider>
  )
}
