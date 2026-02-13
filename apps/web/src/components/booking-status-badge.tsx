'use client'

import { Badge } from '@/components/ui/badge'

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING_PAYMENT: {
    label: 'Pending Payment',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  CONFIRMED: {
    label: 'Confirmed',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  PROVIDER_ASSIGNED: {
    label: 'Provider Assigned',
    className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  REFUNDED: {
    label: 'Refunded',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
}

export function BookingStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800',
  }

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
