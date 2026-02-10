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
import { Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, Star } from 'lucide-react'

// Mock data
const mockProviders = [
  {
    id: 'PR-1001',
    name: 'Amit Kumar',
    phone: '+91 98765 43211',
    city: 'Bangalore',
    category: 'Plumbing',
    rating: 4.8,
    totalJobs: 145,
    kycStatus: 'approved',
    status: 'active',
    joinDate: '2025-08-15',
  },
  {
    id: 'PR-1002',
    name: 'Suresh Reddy',
    phone: '+91 98765 43213',
    city: 'Mumbai',
    category: 'Electrical',
    rating: 4.6,
    totalJobs: 98,
    kycStatus: 'approved',
    status: 'active',
    joinDate: '2025-09-20',
  },
  {
    id: 'PR-1003',
    name: 'Ravi Singh',
    phone: '+91 98765 43215',
    city: 'Delhi',
    category: 'Carpentry',
    rating: 4.9,
    totalJobs: 210,
    kycStatus: 'approved',
    status: 'active',
    joinDate: '2025-06-10',
  },
  {
    id: 'PR-1004',
    name: 'Vijay Rao',
    phone: '+91 98765 43217',
    city: 'Bangalore',
    category: 'Cleaning',
    rating: 4.7,
    totalJobs: 67,
    kycStatus: 'approved',
    status: 'active',
    joinDate: '2025-10-05',
  },
  {
    id: 'PR-1005',
    name: 'Deepak Joshi',
    phone: '+91 98765 43219',
    city: 'Pune',
    category: 'AC Service',
    rating: 4.5,
    totalJobs: 89,
    kycStatus: 'approved',
    status: 'suspended',
    joinDate: '2025-07-22',
  },
  {
    id: 'PR-1006',
    name: 'Manoj Verma',
    phone: '+91 98765 43221',
    city: 'Hyderabad',
    category: 'Painting',
    rating: 4.9,
    totalJobs: 156,
    kycStatus: 'approved',
    status: 'active',
    joinDate: '2025-05-18',
  },
  {
    id: 'PR-1007',
    name: 'Santosh Kumar',
    phone: '+91 98765 43223',
    city: 'Chennai',
    category: 'Plumbing',
    rating: 4.4,
    totalJobs: 78,
    kycStatus: 'pending',
    status: 'inactive',
    joinDate: '2026-02-01',
  },
  {
    id: 'PR-1008',
    name: 'Rajesh Sharma',
    phone: '+91 98765 43225',
    city: 'Bangalore',
    category: 'Electrical',
    rating: 0,
    totalJobs: 0,
    kycStatus: 'pending',
    status: 'inactive',
    joinDate: '2026-02-08',
  },
]

const getKYCBadge = (status: string) => {
  const variants: Record<string, 'success' | 'warning' | 'destructive'> = {
    approved: 'success',
    pending: 'warning',
    rejected: 'destructive',
  }
  return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, 'success' | 'warning' | 'destructive'> = {
    active: 'success',
    inactive: 'warning',
    suspended: 'destructive',
  }
  return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>
}

export default function ProvidersPage() {
  const [filters, setFilters] = useState({
    kycStatus: 'all',
    city: '',
    minRating: '',
    search: '',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredProviders = mockProviders.filter((provider) => {
    if (filters.kycStatus !== 'all' && provider.kycStatus !== filters.kycStatus) return false
    if (filters.city && !provider.city.toLowerCase().includes(filters.city.toLowerCase()))
      return false
    if (filters.minRating && provider.rating < parseFloat(filters.minRating)) return false
    if (
      filters.search &&
      !provider.id.toLowerCase().includes(filters.search.toLowerCase()) &&
      !provider.name.toLowerCase().includes(filters.search.toLowerCase()) &&
      !provider.phone.includes(filters.search)
    )
      return false
    return true
  })

  const totalPages = Math.ceil(filteredProviders.length / itemsPerPage)
  const paginatedProviders = filteredProviders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Service Providers</h1>
        <p className="text-gray-600 mt-2">Manage and verify service providers</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">KYC Status</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={filters.kycStatus}
                onChange={(e) => setFilters({ ...filters, kycStatus: e.target.value })}
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
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
              <label className="text-sm font-medium mb-2 block">Min Rating</label>
              <Input
                type="number"
                placeholder="0-5"
                min="0"
                max="5"
                step="0.1"
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ID, name, phone"
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Providers Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Providers ({filteredProviders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Total Jobs</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProviders.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{provider.name}</div>
                  </TableCell>
                  <TableCell>{provider.phone}</TableCell>
                  <TableCell>{provider.city}</TableCell>
                  <TableCell>{provider.category}</TableCell>
                  <TableCell>
                    {provider.rating > 0 ? (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="font-medium">{provider.rating.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{provider.totalJobs}</TableCell>
                  <TableCell>{getKYCBadge(provider.kycStatus)}</TableCell>
                  <TableCell>{getStatusBadge(provider.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {provider.kycStatus === 'pending' && (
                        <Button size="sm" variant="outline" className="text-green-600">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {provider.status === 'active' ? (
                        <Button size="sm" variant="outline" className="text-red-600">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="text-green-600">
                          Activate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredProviders.length)} of{' '}
              {filteredProviders.length} results
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
