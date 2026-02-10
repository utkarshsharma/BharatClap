'use client'

import { useState } from 'react'
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
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react'

// Mock data
const mockBookings = [
  {
    id: 'BK-1001',
    customer: 'Rahul Sharma',
    customerPhone: '+91 98765 43210',
    provider: 'Amit Kumar',
    providerPhone: '+91 98765 43211',
    service: 'Plumbing - Pipe Repair',
    status: 'completed',
    amount: 1200,
    city: 'Bangalore',
    date: '2026-02-10T10:30:00',
    rating: 4.5,
  },
  {
    id: 'BK-1002',
    customer: 'Priya Patel',
    customerPhone: '+91 98765 43212',
    provider: 'Suresh Reddy',
    providerPhone: '+91 98765 43213',
    service: 'Electrical - Wiring',
    status: 'ongoing',
    amount: 2500,
    city: 'Mumbai',
    date: '2026-02-10T09:15:00',
    rating: null,
  },
  {
    id: 'BK-1003',
    customer: 'Arjun Mehta',
    customerPhone: '+91 98765 43214',
    provider: 'Ravi Singh',
    providerPhone: '+91 98765 43215',
    service: 'Carpentry - Furniture Repair',
    status: 'pending',
    amount: 3500,
    city: 'Delhi',
    date: '2026-02-10T08:00:00',
    rating: null,
  },
  {
    id: 'BK-1004',
    customer: 'Sneha Gupta',
    customerPhone: '+91 98765 43216',
    provider: 'Vijay Rao',
    providerPhone: '+91 98765 43217',
    service: 'Cleaning - Deep Cleaning',
    status: 'completed',
    amount: 800,
    city: 'Bangalore',
    date: '2026-02-09T16:45:00',
    rating: 5.0,
  },
  {
    id: 'BK-1005',
    customer: 'Karan Malhotra',
    customerPhone: '+91 98765 43218',
    provider: 'Deepak Joshi',
    providerPhone: '+91 98765 43219',
    service: 'AC Service - Installation',
    status: 'cancelled',
    amount: 1500,
    city: 'Pune',
    date: '2026-02-09T14:20:00',
    rating: null,
  },
  {
    id: 'BK-1006',
    customer: 'Anjali Singh',
    customerPhone: '+91 98765 43220',
    provider: 'Manoj Verma',
    providerPhone: '+91 98765 43221',
    service: 'Painting - Wall Painting',
    status: 'completed',
    amount: 5000,
    city: 'Hyderabad',
    date: '2026-02-09T11:00:00',
    rating: 4.8,
  },
  {
    id: 'BK-1007',
    customer: 'Vikram Rao',
    customerPhone: '+91 98765 43222',
    provider: 'Santosh Kumar',
    providerPhone: '+91 98765 43223',
    service: 'Plumbing - Leak Repair',
    status: 'ongoing',
    amount: 900,
    city: 'Chennai',
    date: '2026-02-09T10:30:00',
    rating: null,
  },
  {
    id: 'BK-1008',
    customer: 'Neha Kapoor',
    customerPhone: '+91 98765 43224',
    provider: 'Rajesh Sharma',
    providerPhone: '+91 98765 43225',
    service: 'Electrical - Socket Installation',
    status: 'pending',
    amount: 600,
    city: 'Bangalore',
    date: '2026-02-09T09:00:00',
    rating: null,
  },
]

const getStatusBadge = (status: string) => {
  const variants: Record<string, 'success' | 'warning' | 'info' | 'destructive'> = {
    completed: 'success',
    ongoing: 'info',
    pending: 'warning',
    cancelled: 'destructive',
  }
  return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>
}

export default function BookingsPage() {
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    city: '',
    search: '',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredBookings = mockBookings.filter((booking) => {
    if (filters.status !== 'all' && booking.status !== filters.status) return false
    if (filters.city && !booking.city.toLowerCase().includes(filters.city.toLowerCase()))
      return false
    if (
      filters.search &&
      !booking.id.toLowerCase().includes(filters.search.toLowerCase()) &&
      !booking.customer.toLowerCase().includes(filters.search.toLowerCase()) &&
      !booking.provider.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false
    return true
  })

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage)
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">City</label>
              <Input
                placeholder="Enter city"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ID, customer, provider"
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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
            All Bookings ({filteredBookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.customer}</div>
                      <div className="text-sm text-gray-500">{booking.customerPhone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.provider}</div>
                      <div className="text-sm text-gray-500">{booking.providerPhone}</div>
                    </div>
                  </TableCell>
                  <TableCell>{booking.service}</TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  <TableCell>{formatCurrency(booking.amount)}</TableCell>
                  <TableCell>{booking.city}</TableCell>
                  <TableCell>{formatDateTime(booking.date)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of{' '}
              {filteredBookings.length} results
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
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
