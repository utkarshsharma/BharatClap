'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import customerApi from '@/lib/customer-api'
import axios from 'axios'
import { isCustomerLoggedIn } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { CustomerNav } from '@/components/customer-nav'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Loader2, MapPin, Calendar, Clock, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react'

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

function BookPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const serviceId = searchParams.get('serviceId')
  const providerId = searchParams.get('providerId')

  const [step, setStep] = useState(1)
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
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

  // Fetch service info for summary (by ID, not slug)
  const { data: serviceInfo } = useQuery({
    queryKey: ['service-info', serviceId],
    queryFn: async () => {
      // Get all services and find by ID since the API uses slugs
      const res = await axios.get(`${API_BASE_URL}/services?limit=100`)
      const services = res.data.data ?? res.data
      return Array.isArray(services) ? services.find((s: any) => s.id === serviceId) : null
    },
    enabled: !!serviceId,
  })

  // Default date: 3 days from now
  useEffect(() => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    setSelectedDate(d.toISOString().split('T')[0])
  }, [])

  // Auto-select default address
  useEffect(() => {
    if (addresses && !selectedAddress) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0]
      if (defaultAddr) setSelectedAddress(defaultAddr)
    }
  }, [addresses, selectedAddress])

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
      })
      const booking = res.data.data ?? res.data
      router.push(`/booking/${booking.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking')
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

  return (
    <div className="min-h-screen bg-background">
      <CustomerNav />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s ? <CheckCircle className="h-5 w-5" /> : s}
              </div>
              <span className={`text-sm hidden sm:inline ${step >= s ? 'text-primary font-medium' : 'text-gray-400'}`}>
                {s === 1 ? 'Address' : s === 2 ? 'Date & Time' : 'Review'}
              </span>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-primary' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Address */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Select Address</h2>

            {addressesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !addresses || addresses.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No addresses found.</p>
                  <p className="text-sm text-gray-400">Add an address via the mobile app first.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => {
                  const isSelected = selectedAddress?.id === addr.id
                  return (
                    <Card
                      key={addr.id}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-primary bg-orange-50' : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedAddress(addr)}
                    >
                      <CardContent className="flex items-center gap-3 p-4">
                        <MapPin className={`h-5 w-5 shrink-0 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{addr.label}</p>
                            {addr.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                          </div>
                          <p className="text-sm text-gray-500">{addr.addressLine}, {addr.city} — {addr.pincode}</p>
                        </div>
                        {isSelected && <CheckCircle className="h-5 w-5 text-primary shrink-0" />}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep(2)} disabled={!selectedAddress}>
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Choose Date & Time</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Date
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={minDate}
                max={maxDate}
                className="max-w-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Time Slot
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot.hour}
                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${
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

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!selectedDate || selectedHour === null}>
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Review & Confirm</h2>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {serviceInfo && (
                  <div>
                    <p className="text-sm text-gray-500">Service</p>
                    <p className="font-medium">{serviceInfo.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{selectedAddress?.label}</p>
                  <p className="text-sm text-gray-500">
                    {selectedAddress?.addressLine}, {selectedAddress?.city}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{formatDate(selectedDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">
                      {TIME_SLOTS.find((s) => s.hour === selectedHour)?.label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleConfirm} disabled={submitting} size="lg">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {submitting ? 'Creating...' : 'Confirm Booking'}
              </Button>
            </div>
          </div>
        )}
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
