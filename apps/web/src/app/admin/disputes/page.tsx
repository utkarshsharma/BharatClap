'use client'

import { useState } from 'react'
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
import { AlertCircle, CheckCircle, XCircle, Edit } from 'lucide-react'

// Mock data
const mockDisputes = [
  {
    id: 'DS-1001',
    bookingId: 'BK-1005',
    customer: 'Karan Malhotra',
    provider: 'Deepak Joshi',
    service: 'AC Service',
    amount: 1500,
    reason: 'Service not completed',
    status: 'open',
    aiRuling: 'refund_customer',
    aiConfidence: 0.85,
    aiReason: 'Provider confirmed cancellation. Chat logs show service was not performed.',
    createdAt: '2026-02-09T14:30:00',
    evidence: {
      customerPhotos: 2,
      providerPhotos: 0,
      chatMessages: 12,
    },
  },
  {
    id: 'DS-1002',
    bookingId: 'BK-987',
    customer: 'Neha Kapoor',
    provider: 'Rajesh Sharma',
    service: 'Plumbing',
    amount: 800,
    reason: 'Poor quality work',
    status: 'resolved',
    aiRuling: 'partial_refund',
    aiConfidence: 0.72,
    aiReason: 'Work was completed but quality concerns raised. Recommend 50% refund.',
    createdAt: '2026-02-08T11:15:00',
    resolvedAt: '2026-02-09T10:00:00',
    resolution: 'Partial refund of ₹400 issued to customer',
    evidence: {
      customerPhotos: 5,
      providerPhotos: 3,
      chatMessages: 18,
    },
  },
  {
    id: 'DS-1003',
    bookingId: 'BK-876',
    customer: 'Amit Singh',
    provider: 'Santosh Kumar',
    service: 'Electrical',
    amount: 2000,
    reason: 'Additional charges demanded',
    status: 'open',
    aiRuling: 'favor_provider',
    aiConfidence: 0.91,
    aiReason: 'Additional work was documented with photos. Customer agreed in chat.',
    createdAt: '2026-02-09T16:45:00',
    evidence: {
      customerPhotos: 1,
      providerPhotos: 8,
      chatMessages: 24,
    },
  },
  {
    id: 'DS-1004',
    bookingId: 'BK-765',
    customer: 'Priya Sharma',
    provider: 'Manoj Verma',
    service: 'Painting',
    amount: 5000,
    reason: 'Work incomplete',
    status: 'appealed',
    aiRuling: 'refund_customer',
    aiConfidence: 0.68,
    aiReason: 'Customer claims work incomplete, but evidence is inconclusive.',
    createdAt: '2026-02-07T09:30:00',
    evidence: {
      customerPhotos: 3,
      providerPhotos: 4,
      chatMessages: 31,
    },
  },
  {
    id: 'DS-1005',
    bookingId: 'BK-654',
    customer: 'Rahul Gupta',
    provider: 'Vijay Rao',
    service: 'Cleaning',
    amount: 1200,
    reason: 'Provider did not show up',
    status: 'resolved',
    aiRuling: 'refund_customer',
    aiConfidence: 0.95,
    aiReason: 'Provider did not respond to messages. Location tracking shows no visit.',
    createdAt: '2026-02-06T14:00:00',
    resolvedAt: '2026-02-07T09:30:00',
    resolution: 'Full refund issued to customer. Provider penalized.',
    evidence: {
      customerPhotos: 0,
      providerPhotos: 0,
      chatMessages: 6,
    },
  },
]

const getStatusBadge = (status: string) => {
  const variants: Record<string, 'success' | 'warning' | 'info' | 'destructive'> = {
    open: 'warning',
    resolved: 'success',
    appealed: 'info',
    escalated: 'destructive',
  }
  return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>
}

const getRulingBadge = (ruling: string) => {
  const labels: Record<string, string> = {
    refund_customer: 'Refund Customer',
    favor_provider: 'Favor Provider',
    partial_refund: 'Partial Refund',
  }
  const variants: Record<string, 'success' | 'info' | 'warning'> = {
    refund_customer: 'warning',
    favor_provider: 'info',
    partial_refund: 'success',
  }
  return <Badge variant={variants[ruling]}>{labels[ruling]}</Badge>
}

export default function DisputesPage() {
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null)

  const handleOverride = (disputeId: string) => {
    setSelectedDispute(disputeId === selectedDispute ? null : disputeId)
  }

  const handleResolve = (disputeId: string, resolution: string) => {
    alert(`Dispute ${disputeId} resolved with: ${resolution}`)
    setSelectedDispute(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Disputes Management</h1>
        <p className="text-gray-600 mt-2">AI-powered dispute resolution and oversight</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appealed</CardTitle>
            <Edit className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
          </CardContent>
        </Card>
      </div>

      {/* Disputes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Disputes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispute ID</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>AI Ruling</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDisputes.map((dispute) => (
                <>
                  <TableRow key={dispute.id}>
                    <TableCell className="font-medium">{dispute.id}</TableCell>
                    <TableCell>{dispute.bookingId}</TableCell>
                    <TableCell>{dispute.customer}</TableCell>
                    <TableCell>{dispute.provider}</TableCell>
                    <TableCell>{formatCurrency(dispute.amount)}</TableCell>
                    <TableCell className="max-w-xs truncate">{dispute.reason}</TableCell>
                    <TableCell>{getRulingBadge(dispute.aiRuling)}</TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {(dispute.aiConfidence * 100).toFixed(0)}%
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                    <TableCell>
                      {dispute.status === 'open' || dispute.status === 'appealed' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOverride(dispute.id)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Override
                        </Button>
                      ) : (
                        <span className="text-sm text-gray-500">Resolved</span>
                      )}
                    </TableCell>
                  </TableRow>
                  {selectedDispute === dispute.id && (
                    <TableRow>
                      <TableCell colSpan={10}>
                        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                          <div>
                            <h3 className="font-semibold text-lg mb-2">AI Analysis</h3>
                            <p className="text-gray-700 mb-4">{dispute.aiReason}</p>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div className="bg-white p-3 rounded border">
                                <div className="text-sm text-gray-600">Customer Photos</div>
                                <div className="text-xl font-bold">
                                  {dispute.evidence.customerPhotos}
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <div className="text-sm text-gray-600">Provider Photos</div>
                                <div className="text-xl font-bold">
                                  {dispute.evidence.providerPhotos}
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <div className="text-sm text-gray-600">Chat Messages</div>
                                <div className="text-xl font-bold">
                                  {dispute.evidence.chatMessages}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="font-semibold mb-3">Override AI Decision</h3>
                            <div className="flex space-x-3">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() =>
                                  handleResolve(dispute.id, 'Full refund to customer')
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Refund Customer
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() =>
                                  handleResolve(dispute.id, 'Payment to provider')
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Favor Provider
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() =>
                                  handleResolve(dispute.id, 'Partial refund issued')
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Partial Refund
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => setSelectedDispute(null)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
