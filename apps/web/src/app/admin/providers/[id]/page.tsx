'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  ShieldCheck,
  FileText,
  Ban,
  UserCheck,
} from 'lucide-react'

type KycStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED'

interface ProviderDetail {
  id: string
  name: string | null
  email: string | null
  phone: string
  isActive: boolean
  createdAt: string
  completedBookings: number
  totalEarnings: number
  providerProfile: {
    kycStatus: KycStatus
    avgRating: number | null
    bio: string | null
    aadhaarVerified: boolean
    providerServices: Array<{
      service: {
        id: string
        name: string
        basePrice: number
        category: { name: string }
      }
    }>
    portfolioItems: Array<any>
    availability: Array<any>
  } | null
  bookingsAsProvider: Array<{
    id: string
    status: string
    amount: number
    createdAt: string
    service: { name: string }
    customer: { id: string; name: string; phone: string }
    payment: { status: string; amount: number } | null
  }>
  reviewsReceived: Array<{
    id: string
    rating: number
    comment: string | null
    createdAt: string
    customer: { id: string; name: string }
  }>
}

const getKycBadge = (status: KycStatus) => {
  switch (status) {
    case 'VERIFIED':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-4 w-4 mr-1.5" />
          KYC Verified
        </span>
      )
    case 'REJECTED':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <XCircle className="h-4 w-4 mr-1.5" />
          KYC Rejected
        </span>
      )
    case 'PENDING':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-4 w-4 mr-1.5" />
          KYC Pending
        </span>
      )
    case 'NOT_STARTED':
    default:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          <Clock className="h-4 w-4 mr-1.5" />
          KYC Not Started
        </span>
      )
  }
}

const getStatusBadge = (status: string) => {
  const statusLower = status.toLowerCase()
  const variants: Record<string, 'success' | 'warning' | 'info' | 'destructive'> = {
    completed: 'success',
    ongoing: 'info',
    in_progress: 'info',
    pending: 'warning',
    pending_payment: 'warning',
    confirmed: 'info',
    provider_assigned: 'info',
    cancelled: 'destructive',
  }
  return <Badge variant={variants[statusLower] || 'default'}>{status.replace(/_/g, ' ').toUpperCase()}</Badge>
}

export default function ProviderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const providerId = params.id as string

  const { data: provider, isLoading, error } = useQuery<ProviderDetail>({
    queryKey: ['admin-provider', providerId],
    queryFn: async () => {
      const response = await api.get(`/admin/providers/${providerId}`)
      return response.data
    },
  })

  const approveMutation = useMutation({
    mutationFn: () => api.patch(`/admin/providers/${providerId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-provider', providerId] })
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] })
    },
  })

  const suspendMutation = useMutation({
    mutationFn: () => api.patch(`/admin/providers/${providerId}/suspend`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-provider', providerId] })
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !provider) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-6 max-w-md">
          <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Provider</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Provider not found or failed to fetch data.'}
          </p>
          <Button variant="outline" onClick={() => router.push('/admin/providers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Providers
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push('/admin/providers')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Providers
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {provider.name || 'Unnamed Provider'}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            {getKycBadge(provider.providerProfile?.kycStatus || 'NOT_STARTED')}
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                provider.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {provider.isActive ? 'Active' : 'Suspended'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {provider.providerProfile?.kycStatus === 'PENDING' && (
            <Button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              {approveMutation.isPending ? 'Approving...' : 'Approve KYC'}
            </Button>
          )}
          {provider.isActive ? (
            <Button
              onClick={() => suspendMutation.mutate()}
              disabled={suspendMutation.isPending}
              variant="destructive"
            >
              <Ban className="h-4 w-4 mr-2" />
              {suspendMutation.isPending ? 'Suspending...' : 'Suspend Provider'}
            </Button>
          ) : (
            <Button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              {approveMutation.isPending ? 'Activating...' : 'Activate Provider'}
            </Button>
          )}
          {provider.providerProfile?.aadhaarVerified && (
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Aadhaar Verified
            </Button>
          )}
        </div>
      </div>

      {/* Profile Info & Earnings Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{provider.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{provider.phone}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Joined</p>
                    <p className="font-medium text-gray-900">{formatDateTime(provider.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Rating</p>
                    <p className="font-medium text-gray-900">
                      {provider.providerProfile?.avgRating ? `${provider.providerProfile.avgRating.toFixed(1)} / 5.0` : 'No ratings yet'}
                      {provider.providerProfile?.avgRating && <span className="text-yellow-400 ml-1">&#9733;</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="bg-primary/10 text-primary p-3 rounded-full w-fit mx-auto mb-3">
                <IndianRupee className="h-8 w-8" />
              </div>
              <p className="text-sm text-gray-500">Total Earnings</p>
              <p className="text-3xl font-bold text-gray-900">
                {typeof provider.totalEarnings === 'number'
                  ? formatCurrency(provider.totalEarnings)
                  : 'N/A'}
              </p>
            </div>
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Completed Bookings</span>
                <span className="font-medium text-gray-900">
                  {provider.completedBookings ?? 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Provider Payout (80%)</span>
                <span className="font-medium text-gray-900">
                  {typeof provider.totalEarnings === 'number'
                    ? formatCurrency(provider.totalEarnings)
                    : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Offered */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Services Offered
          </CardTitle>
        </CardHeader>
        <CardContent>
          {provider.providerProfile?.providerServices && provider.providerProfile.providerServices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Base Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {provider.providerProfile.providerServices.map((ps) => (
                  <TableRow key={ps.service.id}>
                    <TableCell className="font-medium">{ps.service.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ps.service.category.name}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(ps.service.basePrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No services linked to this provider yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {provider.bookingsAsProvider && provider.bookingsAsProvider.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {provider.bookingsAsProvider.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium font-mono text-sm">
                      {booking.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>{booking.customer?.name || '—'}</TableCell>
                    <TableCell>{booking.service?.name || '—'}</TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>{formatCurrency(booking.amount)}</TableCell>
                    <TableCell>{formatDateTime(booking.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No bookings found for this provider.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
