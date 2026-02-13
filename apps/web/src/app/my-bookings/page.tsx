'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import customerApi from '@/lib/customer-api'
import { isCustomerLoggedIn } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CustomerNav } from '@/components/customer-nav'
import { BookingStatusBadge } from '@/components/booking-status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Loader2, Calendar, ArrowRight } from 'lucide-react'

const queryClient = new QueryClient()

type FilterTab = 'all' | 'upcoming' | 'completed' | 'cancelled'

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

function MyBookingsContent() {
  const router = useRouter()
  const [tab, setTab] = useState<FilterTab>('all')

  useEffect(() => {
    if (!isCustomerLoggedIn()) {
      router.push('/login?redirect=/my-bookings')
    }
  }, [router])

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const res = await customerApi.get('/bookings?limit=100')
      const raw = res.data.data ?? res.data
      return Array.isArray(raw) ? raw : []
    },
    enabled: isCustomerLoggedIn(),
  })

  const bookings = data || []

  const filtered = bookings.filter((b: any) => {
    if (tab === 'all') return true
    if (tab === 'upcoming')
      return ['PENDING_PAYMENT', 'CONFIRMED', 'PROVIDER_ASSIGNED', 'IN_PROGRESS'].includes(b.status)
    if (tab === 'completed') return b.status === 'COMPLETED'
    if (tab === 'cancelled') return ['CANCELLED', 'REFUNDED'].includes(b.status)
    return true
  })

  return (
    <div className="min-h-screen bg-background">
      <CustomerNav />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all whitespace-nowrap ${
                tab === t.key
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
              }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 text-lg">No bookings found</p>
            <p className="text-gray-400 text-sm mb-4">
              {tab === 'all' ? 'Book a service to get started!' : `No ${tab} bookings.`}
            </p>
            <Button asChild>
              <Link href="/services">Browse Services</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((booking: any) => (
              <Link key={booking.id} href={`/booking/${booking.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 truncate">
                          {booking.service?.name || 'Service'}
                        </p>
                        <BookingStatusBadge status={booking.status} />
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDate(booking.scheduledDate)} at{' '}
                        {booking.scheduledHour < 12
                          ? `${booking.scheduledHour} AM`
                          : booking.scheduledHour === 12
                          ? '12 PM'
                          : `${booking.scheduledHour - 12} PM`}
                      </p>
                      <p className="text-sm text-gray-400">
                        {booking.address?.label} — {booking.provider?.name || 'Provider TBD'}
                      </p>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="font-bold text-primary">{formatCurrency(booking.amount)}</p>
                      <ArrowRight className="h-4 w-4 text-gray-400 ml-auto mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MyBookingsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <MyBookingsContent />
    </QueryClientProvider>
  )
}
