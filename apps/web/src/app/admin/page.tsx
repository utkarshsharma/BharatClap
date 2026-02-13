'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp,
  Users,
  IndianRupee,
  ShieldCheck,
  CalendarDays,
  UserCheck,
} from 'lucide-react'
import api from '@/lib/api'

interface DashboardStats {
  totalBookings: number
  totalRevenue: number
  activeProviders: number
  activeCustomers: number
  pendingKycCount: number
  bookingsThisWeek: number
  revenueThisWeek: number
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await api.get('/admin/dashboard')
  return data
}

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchDashboardStats,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'Failed to fetch data'}
          </p>
        </Card>
      </div>
    )
  }

  const stats = [
    {
      title: 'Total Bookings',
      value: data?.totalBookings ?? 'N/A',
      icon: TrendingUp,
    },
    {
      title: 'Total Revenue',
      value: typeof data?.totalRevenue === 'number' ? formatCurrency(data.totalRevenue) : 'N/A',
      icon: IndianRupee,
    },
    {
      title: 'Active Providers',
      value: data?.activeProviders ?? 'N/A',
      icon: Users,
    },
    {
      title: 'Pending KYC',
      value: data?.pendingKycCount ?? 'N/A',
      icon: ShieldCheck,
    },
    {
      title: 'Active Customers',
      value: data?.activeCustomers ?? 'N/A',
      icon: UserCheck,
    },
    {
      title: 'Bookings This Week',
      value: data?.bookingsThisWeek ?? 'N/A',
      icon: CalendarDays,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your platform performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>This Week Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Bookings This Week</span>
              <span className="text-2xl font-bold">{data?.bookingsThisWeek ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Revenue This Week</span>
              <span className="text-2xl font-bold">
                {typeof data?.revenueThisWeek === 'number' ? formatCurrency(data.revenueThisWeek) : '₹0'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Active Providers</span>
              <span className="text-2xl font-bold">{data?.activeProviders ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Active Customers</span>
              <span className="text-2xl font-bold">{data?.activeCustomers ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pending KYC Approvals</span>
              <span className="text-2xl font-bold text-orange-600">{data?.pendingKycCount ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
