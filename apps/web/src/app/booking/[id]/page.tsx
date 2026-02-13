'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import customerApi from '@/lib/customer-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CustomerNav } from '@/components/customer-nav'
import { BookingStatusBadge } from '@/components/booking-status-badge'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { Loader2, ArrowLeft, CreditCard, XCircle } from 'lucide-react'

const qc = new QueryClient()

function BookingDetailContent() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const bookingId = params.id as string

  const [devPayLoading, setDevPayLoading] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)
  const [error, setError] = useState('')

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const res = await customerApi.get(`/bookings/${bookingId}`)
      return res.data.data ?? res.data
    },
  })

  const handleDevPay = async () => {
    setDevPayLoading(true)
    setError('')
    try {
      await customerApi.post(`/bookings/${bookingId}/dev-confirm`)
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Dev payment failed')
    } finally {
      setDevPayLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelReason.trim()) return
    setCancelLoading(true)
    setError('')
    try {
      await customerApi.post(`/bookings/${bookingId}/cancel`, { reason: cancelReason })
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] })
      setCancelOpen(false)
      setCancelReason('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Cancel failed')
    } finally {
      setCancelLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <CustomerNav />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <CustomerNav />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-2">Booking Not Found</h1>
          <Button asChild><Link href="/my-bookings">My Bookings</Link></Button>
        </div>
      </div>
    )
  }

  const canCancel = ['PENDING_PAYMENT', 'CONFIRMED', 'PROVIDER_ASSIGNED'].includes(booking.status)
  const isPendingPayment = booking.status === 'PENDING_PAYMENT'

  return (
    <div className="min-h-screen bg-background">
      <CustomerNav />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          href="/my-bookings"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          My Bookings
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
          <BookingStatusBadge status={booking.status} />
        </div>

        <div className="space-y-4">
          {/* Booking ID */}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 font-mono">ID: {booking.id}</p>
            </CardContent>
          </Card>

          {/* Service & Provider */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">{booking.service?.name}</p>
                <p className="text-sm text-gray-500">{booking.service?.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Provider</p>
                  <p className="font-medium">{booking.provider?.name || 'Assigned later'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(booking.amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule & Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Schedule & Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(booking.scheduledDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">
                    {booking.scheduledHour < 12
                      ? `${booking.scheduledHour} AM`
                      : booking.scheduledHour === 12
                      ? '12 PM'
                      : `${booking.scheduledHour - 12} PM`}
                  </p>
                </div>
              </div>
              {booking.address && (
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{booking.address.label}</p>
                  <p className="text-sm text-gray-500">
                    {booking.address.addressLine}, {booking.address.city} — {booking.address.pincode}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3">
            {isPendingPayment && (
              <Button onClick={handleDevPay} disabled={devPayLoading} className="flex-1">
                {devPayLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                {devPayLoading ? 'Processing...' : 'Dev Pay'}
              </Button>
            )}

            {canCancel && !cancelOpen && (
              <Button
                variant="outline"
                onClick={() => setCancelOpen(true)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cancel Booking
              </Button>
            )}
          </div>

          {/* Cancel form */}
          {cancelOpen && (
            <Card className="border-red-200">
              <CardContent className="p-4 space-y-3">
                <p className="font-medium text-red-700">Cancel this booking?</p>
                <Input
                  placeholder="Reason for cancellation"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={cancelLoading || !cancelReason.trim()}
                    size="sm"
                  >
                    {cancelLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Confirm Cancel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCancelOpen(false)}>
                    Never mind
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Log */}
          {booking.statusLog && booking.statusLog.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {booking.statusLog.map((log: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <div className="text-gray-900 flex items-center flex-wrap gap-1">
                          <BookingStatusBadge status={log.status} />
                          {log.notes && <span className="text-gray-500">— {log.notes}</span>}
                        </div>
                        <p className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BookingDetailPage() {
  return (
    <QueryClientProvider client={qc}>
      <BookingDetailContent />
    </QueryClientProvider>
  )
}
