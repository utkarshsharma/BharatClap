'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { IndianRupee, TrendingUp, Clock, CheckCircle2, Send } from 'lucide-react'

// Mock data
const stats = [
  {
    title: 'Total Revenue',
    value: formatCurrency(4567800),
    icon: IndianRupee,
    color: 'text-green-600',
  },
  {
    title: 'Platform Commission',
    value: formatCurrency(456780),
    icon: TrendingUp,
    color: 'text-blue-600',
  },
  {
    title: 'Pending Payouts',
    value: formatCurrency(234500),
    icon: Clock,
    color: 'text-yellow-600',
  },
  {
    title: 'Completed Payouts',
    value: formatCurrency(4111020),
    icon: CheckCircle2,
    color: 'text-green-600',
  },
]

const recentPayments = [
  {
    id: 'PAY-1001',
    bookingId: 'BK-1001',
    provider: 'Amit Kumar',
    customer: 'Rahul Sharma',
    amount: 1200,
    commission: 120,
    providerPayout: 1080,
    status: 'completed',
    paymentMethod: 'UPI',
    date: '2026-02-10T10:30:00',
  },
  {
    id: 'PAY-1002',
    bookingId: 'BK-1002',
    provider: 'Suresh Reddy',
    customer: 'Priya Patel',
    amount: 2500,
    commission: 250,
    providerPayout: 2250,
    status: 'pending',
    paymentMethod: 'Card',
    date: '2026-02-10T09:15:00',
  },
  {
    id: 'PAY-1003',
    bookingId: 'BK-1003',
    provider: 'Ravi Singh',
    customer: 'Arjun Mehta',
    amount: 3500,
    commission: 350,
    providerPayout: 3150,
    status: 'pending',
    paymentMethod: 'UPI',
    date: '2026-02-10T08:00:00',
  },
  {
    id: 'PAY-1004',
    bookingId: 'BK-1004',
    provider: 'Vijay Rao',
    customer: 'Sneha Gupta',
    amount: 800,
    commission: 80,
    providerPayout: 720,
    status: 'completed',
    paymentMethod: 'Wallet',
    date: '2026-02-09T16:45:00',
  },
  {
    id: 'PAY-1005',
    bookingId: 'BK-1005',
    provider: 'Deepak Joshi',
    customer: 'Karan Malhotra',
    amount: 1500,
    commission: 150,
    providerPayout: 1350,
    status: 'refunded',
    paymentMethod: 'Card',
    date: '2026-02-09T14:20:00',
  },
  {
    id: 'PAY-1006',
    bookingId: 'BK-1006',
    provider: 'Manoj Verma',
    customer: 'Anjali Singh',
    amount: 5000,
    commission: 500,
    providerPayout: 4500,
    status: 'completed',
    paymentMethod: 'UPI',
    date: '2026-02-09T11:00:00',
  },
  {
    id: 'PAY-1007',
    bookingId: 'BK-1007',
    provider: 'Santosh Kumar',
    customer: 'Vikram Rao',
    amount: 900,
    commission: 90,
    providerPayout: 810,
    status: 'pending',
    paymentMethod: 'UPI',
    date: '2026-02-09T10:30:00',
  },
]

const getStatusBadge = (status: string) => {
  const variants: Record<string, 'success' | 'warning' | 'info' | 'destructive'> = {
    completed: 'success',
    pending: 'warning',
    processing: 'info',
    refunded: 'destructive',
  }
  return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>
}

export default function PaymentsPage() {
  const handleBatchPayout = () => {
    alert('Batch payout initiated for all pending payments!')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payments Overview</h1>
          <p className="text-gray-600 mt-2">Track revenue, commissions, and provider payouts</p>
        </div>
        <Button onClick={handleBatchPayout}>
          <Send className="h-4 w-4 mr-2" />
          Trigger Batch Payout
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment ID</TableHead>
                <TableHead>Booking ID</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Provider Payout</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.id}</TableCell>
                  <TableCell>{payment.bookingId}</TableCell>
                  <TableCell>{payment.provider}</TableCell>
                  <TableCell>{payment.customer}</TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell className="text-blue-600">
                    {formatCurrency(payment.commission)}
                  </TableCell>
                  <TableCell className="text-green-600">
                    {formatCurrency(payment.providerPayout)}
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>{payment.paymentMethod}</TableCell>
                  <TableCell>{formatDateTime(payment.date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Method Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>UPI Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(2876000)}</div>
            <p className="text-sm text-gray-600 mt-2">63% of total payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Card Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(1369920)}</div>
            <p className="text-sm text-gray-600 mt-2">30% of total payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wallet Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(321880)}</div>
            <p className="text-sm text-gray-600 mt-2">7% of total payments</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
