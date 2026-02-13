'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CustomerNav } from '@/components/customer-nav'
import { isCustomerLoggedIn } from '@/lib/auth'
import customerApi from '@/lib/customer-api'
import { Heart, Star, Trash2, Loader2, ArrowLeft, ExternalLink } from 'lucide-react'

interface ProviderProfile {
  id: string
  avgRating: number | null
  totalJobs: number
  bio: string | null
  aadhaarVerified: boolean
}

interface Provider {
  id: string
  name: string
  phone: string
  email: string | null
  avatarUrl: string | null
  providerProfile: ProviderProfile | null
}

interface Favorite {
  id: string
  customerId: string
  providerId: string
  createdAt: string
  provider: Provider
}

export default function FavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isCustomerLoggedIn()) {
      router.push('/login?redirect=/favorites')
      return
    }
    fetchFavorites()
  }, [router])

  const fetchFavorites = async () => {
    try {
      const res = await customerApi.get('/favorites')
      const raw = res.data.data ?? res.data
      setFavorites(Array.isArray(raw) ? raw : [])
    } catch {
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (favoriteId: string, providerProfileId: string) => {
    setRemovingId(favoriteId)
    try {
      await customerApi.delete(`/providers/${providerProfileId}/favorite`)
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId))
    } catch {
      // silently fail — the item stays in the list
    } finally {
      setRemovingId(null)
    }
  }

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const renderStars = (rating: number | null) => {
    const value = rating ?? 0
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.round(value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
        {value > 0 && (
          <span className="ml-1.5 text-sm font-medium text-gray-700">
            {value.toFixed(1)}
          </span>
        )}
      </div>
    )
  }

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

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-red-50 rounded-xl">
            <Heart className="h-6 w-6 text-red-500 fill-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Favorite Providers</h1>
            <p className="text-sm text-gray-500">
              {favorites.length} {favorites.length === 1 ? 'provider' : 'providers'} saved
            </p>
          </div>
        </div>

        {/* Empty State */}
        {favorites.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Heart className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              No favorite providers yet
            </p>
            <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
              Browse services to find providers you love, then save them here for quick access.
            </p>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B00] hover:bg-[#E55E00] text-white font-semibold rounded-xl transition"
            >
              Browse Services
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((fav) => {
              const provider = fav.provider
              const profile = provider.providerProfile
              const profileId = profile?.id ?? fav.providerId
              const isRemoving = removingId === fav.id

              return (
                <div
                  key={fav.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-[#FF6B00] flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-white">
                        {getInitials(provider.name || 'P')}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {provider.name}
                        </h3>
                        {profile?.aadhaarVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
                            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Verified
                          </span>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="mb-2">{renderStars(profile?.avgRating ?? null)}</div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{profile?.totalJobs ?? 0} jobs completed</span>
                        {profile?.bio && (
                          <span className="truncate max-w-[200px]">{profile.bio}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Link
                        href="/services"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#FF6B00] border border-[#FF6B00] rounded-lg hover:bg-orange-50 transition"
                      >
                        View Profile
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => handleRemove(fav.id, profileId)}
                        disabled={isRemoving}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                      >
                        {isRemoving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        {isRemoving ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
