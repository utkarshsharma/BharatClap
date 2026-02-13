'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerNav } from '@/components/customer-nav'
import { isCustomerLoggedIn } from '@/lib/auth'
import customerApi from '@/lib/customer-api'
import { Bell, Check, CheckCheck, Loader2, ArrowLeft } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Notification {
  id: string
  title: string
  body: string
  channel: string
  isRead: boolean
  createdAt: string
  data: Record<string, unknown> | null
}

interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const seconds = Math.floor((now - then) / 1000)

  if (seconds < 60) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`

  const years = Math.floor(months / 12)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

const PAGE_LIMIT = 20

export default function NotificationsPage() {
  const router = useRouter()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const [markingReadIds, setMarkingReadIds] = useState<Set<string>>(new Set())

  // ---- Auth guard ----
  useEffect(() => {
    if (!isCustomerLoggedIn()) {
      router.push('/login?redirect=/notifications')
    }
  }, [router])

  // ---- Fetch notifications ----
  const fetchNotifications = useCallback(async (pageNum: number) => {
    setLoading(true)
    try {
      const res = await customerApi.get(`/notifications?page=${pageNum}&limit=${PAGE_LIMIT}`)
      const payload = res.data
      const items: Notification[] = payload.data ?? payload
      const paginationMeta: PaginationMeta | undefined = payload.meta
      setNotifications(Array.isArray(items) ? items : [])
      setMeta(paginationMeta ?? null)
    } catch {
      // Silently handle — the interceptor will redirect on 401
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isCustomerLoggedIn()) {
      fetchNotifications(page)
    }
  }, [page, fetchNotifications])

  // ---- Mark single notification as read ----
  const handleMarkRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    setMarkingReadIds((prev) => new Set(prev).add(id))

    try {
      await customerApi.patch(`/notifications/${id}/read`)
    } catch {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      )
    } finally {
      setMarkingReadIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  // ---- Mark all unread notifications as read ----
  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead)
    if (unread.length === 0) return

    setMarkingAllRead(true)

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))

    try {
      await Promise.all(
        unread.map((n) => customerApi.patch(`/notifications/${n.id}/read`))
      )
    } catch {
      // Revert on failure — refetch the current page
      await fetchNotifications(page)
    } finally {
      setMarkingAllRead(false)
    }
  }

  // ---- Derived values ----
  const unreadCount = notifications.filter((n) => !n.isRead).length
  const totalPages = meta?.totalPages ?? 1

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerNav />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNav />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#FF6B00] text-white p-2.5 rounded-xl">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              {meta && (
                <p className="text-sm text-gray-500">
                  {meta.total} notification{meta.total === 1 ? '' : 's'}
                  {unreadCount > 0 && (
                    <span className="ml-1 text-[#FF6B00] font-medium">
                      ({unreadCount} unread)
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAllRead}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#FF6B00] bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200 transition disabled:opacity-60"
            >
              {markingAllRead ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              {markingAllRead ? 'Marking...' : 'Mark All Read'}
            </button>
          )}
        </div>

        {/* Notification list */}
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="h-14 w-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium">No notifications yet.</p>
            <p className="text-gray-400 text-sm mt-1">
              We will notify you about bookings, offers, and updates.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const isMarking = markingReadIds.has(notification.id)

              return (
                <button
                  key={notification.id}
                  onClick={() => {
                    if (!notification.isRead) {
                      handleMarkRead(notification.id)
                    }
                  }}
                  disabled={isMarking}
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${
                    notification.isRead
                      ? 'bg-white border-gray-100 hover:border-gray-200'
                      : 'bg-orange-50 border-orange-200 hover:border-[#FF6B00] shadow-sm'
                  } ${!notification.isRead ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Read / unread indicator */}
                    <div className="mt-0.5 flex-shrink-0">
                      {notification.isRead ? (
                        <Check className="h-5 w-5 text-gray-300" />
                      ) : isMarking ? (
                        <Loader2 className="h-5 w-5 animate-spin text-[#FF6B00]" />
                      ) : (
                        <div className="h-5 w-5 flex items-center justify-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-[#FF6B00]" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className={`text-sm font-semibold truncate ${
                            notification.isRead ? 'text-gray-700' : 'text-gray-900'
                          }`}
                        >
                          {notification.title}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                            notification.isRead
                              ? 'bg-gray-100 text-gray-400'
                              : 'bg-[#FF6B00]/10 text-[#FF6B00]'
                          }`}
                        >
                          {notification.channel}
                        </span>
                      </div>
                      <p
                        className={`text-sm leading-relaxed ${
                          notification.isRead ? 'text-gray-500' : 'text-gray-700'
                        }`}
                      >
                        {notification.body}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {timeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-5 py-2.5 text-sm font-medium rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-5 py-2.5 text-sm font-medium rounded-xl border border-[#FF6B00] bg-[#FF6B00] text-white hover:bg-[#E55E00] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
