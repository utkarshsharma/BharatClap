'use client'

import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '@/lib/api'

interface Booking {
  id: string
  customer: { id: string; name: string; email: string; phone: string } | null
  provider: { id: string; name: string; email: string; phone: string } | null
  service: { id: string; name: string; category: { name: string } } | null
  status: string
  amount: number
  scheduledDate: string | null
  createdAt: string
  payment: { status: string; amount: number } | null
}

interface BookingsResponse {
  data: Booking[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const fetchBookings = async (
  status: string,
  page: number,
  limit: number,
  search: string
): Promise<BookingsResponse> => {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  params.append('page', page.toString())
  params.append('limit', limit.toString())
  if (search) params.append('search', search)

  const { data } = await api.get(`/admin/bookings?${params.toString()}`)
  return data
}

const getStatusBadge = (status: string) => {
  const statusLower = status.toLowerCase()
  const variants: Record<string, 'success' | 'warning' | 'info' | 'destructive'> = {
    completed: 'success',
    ongoing: 'info',
    in_progress: 'info',
    pending: 'warning',
    pending_payment: 'warning',
    cancelled: 'destructive',
  }
  return <Badge variant={variants[statusLower] || 'default'}>{status.replace(/_/g, ' ').toUpperCase()}</Badge>
}

export default function BookingsPage() {
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-bookings', filters.status, currentPage, itemsPerPage, filters.search],
    queryFn: () => fetchBookings(filters.status, currentPage, itemsPerPage, filters.search),
    placeholderData: keepPreviousData,
  })

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value })
    setCurrentPage(1)
  }

  const handleStatusFilter = (value: string) => {
    setFilters({ ...filters, status: value })
    setCurrentPage(1)
  }

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING_PAYMENT', label: 'Pending Payment' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'PROVIDER_ASSIGNED', label: 'Provider Assigned' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bookings Management</h1>
        <p className="text-gray-600 mt-2">View and manage all service bookings</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={filters.status}
                onChange={(e) => handleStatusFilter(e.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by customer, provider, or service..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Bookings {data?.meta.total ? `(${data.meta.total})` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-destructive mb-2">
                  Error Loading Bookings
                </h3>
                <p className="text-muted-foreground">
                  {error instanceof Error ? error.message : 'Failed to fetch data'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data && data.data.length > 0 ? (
                    data.data.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium font-mono text-sm">
                          {booking.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>{booking.customer?.name || '—'}</TableCell>
                        <TableCell>
                          {booking.provider?.name ?? (
                            <span className="text-muted-foreground italic">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>{booking.service?.name || '—'}</TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>{formatCurrency(booking.amount)}</TableCell>
                        <TableCell>{booking.scheduledDate ? formatDateTime(booking.scheduledDate) : '—'}</TableCell>
                        <TableCell>{formatDateTime(booking.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                        No bookings found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data && data.meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, data.meta.total)} of{' '}
                    {data.meta.total} results
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {data.meta.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(data.meta.totalPages, currentPage + 1))}
                      disabled={currentPage === data.meta.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
