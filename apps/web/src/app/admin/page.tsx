'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import {
  TrendingUp,
  Users,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// Mock data
const stats = [
  {
    title: 'Total Bookings',
    value: '12,453',
    change: '+12.5%',
    icon: TrendingUp,
  },
  {
    title: 'Total Revenue',
    value: formatCurrency(4567800),
    change: '+18.2%',
    icon: IndianRupee,
  },
  {
    title: 'Active Providers',
    value: '1,234',
    change: '+5.3%',
    icon: Users,
  },
  {
    title: 'Pending KYC',
    value: '45',
    change: '-8.1%',
    icon: ShieldCheck,
  },
]

const bookingsData = [
  { month: 'Jan', bookings: 450 },
  { month: 'Feb', bookings: 520 },
  { month: 'Mar', bookings: 680 },
  { month: 'Apr', bookings: 740 },
  { month: 'May', bookings: 890 },
  { month: 'Jun', bookings: 1050 },
]

const revenueData = [
  { month: 'Jan', revenue: 145000 },
  { month: 'Feb', revenue: 178000 },
  { month: 'Mar', revenue: 235000 },
  { month: 'Apr', revenue: 298000 },
  { month: 'May', revenue: 367000 },
  { month: 'Jun', revenue: 425000 },
]

const recentBookings = [
  {
    id: 'BK-1001',
    customer: 'Rahul Sharma',
    provider: 'Amit Kumar',
    service: 'Plumbing',
    status: 'completed',
    amount: 1200,
    date: '2026-02-10T10:30:00',
  },
  {
    id: 'BK-1002',
    customer: 'Priya Patel',
    provider: 'Suresh Reddy',
    service: 'Electrical',
    status: 'ongoing',
    amount: 2500,
    date: '2026-02-10T09:15:00',
  },
  {
    id: 'BK-1003',
    customer: 'Arjun Mehta',
    provider: 'Ravi Singh',
    service: 'Carpentry',
    status: 'pending',
    amount: 3500,
    date: '2026-02-10T08:00:00',
  },
  {
    id: 'BK-1004',
    customer: 'Sneha Gupta',
    provider: 'Vijay Rao',
    service: 'Cleaning',
    status: 'completed',
    amount: 800,
    date: '2026-02-09T16:45:00',
  },
  {
    id: 'BK-1005',
    customer: 'Karan Malhotra',
    provider: 'Deepak Joshi',
    service: 'AC Service',
    status: 'cancelled',
    amount: 1500,
    date: '2026-02-09T14:20:00',
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

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your platform performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                  {stat.change}
                </span>{' '}
                from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bookings Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bookingsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="#FF6B00"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="revenue" fill="#FF6B00" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
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
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.id}</TableCell>
                  <TableCell>{booking.customer}</TableCell>
                  <TableCell>{booking.provider}</TableCell>
                  <TableCell>{booking.service}</TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  <TableCell>{formatCurrency(booking.amount)}</TableCell>
                  <TableCell>{formatDateTime(booking.date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
