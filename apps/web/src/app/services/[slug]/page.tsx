'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CustomerNav, getSelectedCityCoords } from '@/components/customer-nav'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Star, Clock, CheckCircle, XCircle, ArrowLeft, User, MapPin, Heart } from 'lucide-react'
import { isCustomerLoggedIn } from '@/lib/auth'
import customerApi from '@/lib/customer-api'

const queryClient = new QueryClient()

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

interface Provider {
  id: string
  userId: string
  name: string
  bio: string | null
  avgRating: number
  totalJobs: number
  price: number
  distance?: number
}

interface ServiceDetail {
  id: string
  name: string
  slug: string
  description: string | null
  basePrice: number
  durationMin: number
  inclusions: string[]
  exclusions: string[]
  category: {
    name: string
    slug: string
  }
  stats: {
    averageRating: number
    reviewCount: number
    providerCount: number
    minPrice: number
    maxPrice: number
  }
  providers: Provider[]
}

function ServiceDetailContent() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [cityKey, setCityKey] = useState(0)
  const [loggedIn, setLoggedIn] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [togglingFavId, setTogglingFavId] = useState<string | null>(null)

  // Refetch when city changes
  useEffect(() => {
    const handler = () => setCityKey((k) => k + 1)
    window.addEventListener('city-changed', handler)
    return () => window.removeEventListener('city-changed', handler)
  }, [])

  // Check auth and fetch user's favorites
  useEffect(() => {
    const isLogged = isCustomerLoggedIn()
    setLoggedIn(isLogged)
    if (isLogged) {
      customerApi.get('/favorites?limit=100')
        .then((res) => {
          const raw = res.data.data ?? res.data
          if (Array.isArray(raw)) {
            const ids = new Set<string>()
            for (const fav of raw) {
              const profileId = fav.provider?.providerProfile?.id
              if (profileId) ids.add(profileId)
            }
            setFavoriteIds(ids)
          }
        })
        .catch(() => {})
    }
  }, [])

  const { data: service, isLoading, error } = useQuery({
    queryKey: ['service', slug, cityKey],
    queryFn: async () => {
      const coords = getSelectedCityCoords()
      const params = new URLSearchParams()
      if (coords) {
        params.append('lat', String(coords.lat))
        params.append('lng', String(coords.lng))
      }
      const qs = params.toString()
      const res = await axios.get(`${API_BASE_URL}/services/${slug}${qs ? `?${qs}` : ''}`)
      return (res.data.data ?? res.data) as ServiceDetail
    },
  })

  const handleContinue = () => {
    if (!service || !selectedProvider) return
    router.push(`/book?serviceId=${service.id}&providerId=${selectedProvider.id}`)
  }

  const toggleFavorite = async (providerId: string) => {
    if (!loggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(`/services/${slug}`)}`)
      return
    }
    if (togglingFavId) return
    setTogglingFavId(providerId)

    const wasFav = favoriteIds.has(providerId)

    // Optimistic update
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (wasFav) next.delete(providerId)
      else next.add(providerId)
      return next
    })

    try {
      if (wasFav) {
        await customerApi.delete(`/providers/${providerId}/favorite`)
      } else {
        await customerApi.post(`/providers/${providerId}/favorite`)
      }
    } catch {
      // Revert on failure
      setFavoriteIds((prev) => {
        const reverted = new Set(prev)
        if (wasFav) reverted.add(providerId)
        else reverted.delete(providerId)
        return reverted
      })
    } finally {
      setTogglingFavId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <CustomerNav />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-background">
        <CustomerNav />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h1>
          <p className="text-gray-600 mb-4">The service you are looking for does not exist.</p>
          <Button asChild>
            <Link href="/services">Browse Services</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerNav />

      <div className="container mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/services"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Services
        </Link>

        {/* Service Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Badge variant="secondary" className="mb-3">{service.category.name}</Badge>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.name}</h1>
              <p className="text-gray-600 text-lg">{service.description}</p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">
                  {service.stats.averageRating > 0 ? service.stats.averageRating.toFixed(1) : 'New'}
                </span>
                <span className="text-gray-500">
                  ({service.stats.reviewCount} reviews)
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="h-4 w-4" />
                {service.durationMin} min
              </div>
              <div className="text-gray-600">
                {service.stats.providerCount} providers available
              </div>
            </div>

            {/* Inclusions */}
            {service.inclusions.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What&apos;s Included</h3>
                <ul className="space-y-1">
                  {service.inclusions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Exclusions */}
            {service.exclusions.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Not Included</h3>
                <ul className="space-y-1">
                  {service.exclusions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-500">
                      <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Provider Cards */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Choose a Provider</h2>
              {service.providers.length === 0 ? (
                <p className="text-gray-500">No providers available for this service yet.</p>
              ) : (
                <div className="space-y-3">
                  {service.providers.map((provider) => {
                    const isSelected = selectedProvider?.id === provider.id
                    return (
                      <Card
                        key={provider.id}
                        className={`cursor-pointer transition-all ${
                          isSelected
                            ? 'ring-2 ring-primary bg-orange-50'
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedProvider(provider)}
                      >
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4">
                            <div className="bg-gray-100 rounded-full p-3">
                              <User className="h-6 w-6 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{provider.name}</p>
                              {provider.bio && (
                                <p className="text-sm text-gray-500 line-clamp-1">{provider.bio}</p>
                              )}
                              <div className="flex items-center gap-3 mt-1 text-sm">
                                <span className="flex items-center gap-1">
                                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                  {provider.avgRating > 0 ? provider.avgRating.toFixed(1) : 'New'}
                                </span>
                                <span className="text-gray-500">
                                  {provider.totalJobs} jobs
                                </span>
                                {provider.distance != null && (
                                  <span className="flex items-center gap-1 text-gray-500">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {provider.distance.toFixed(1)} km away
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <button
                              type="button"
                              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                              disabled={togglingFavId === provider.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(provider.id)
                              }}
                              aria-label={
                                favoriteIds.has(provider.id)
                                  ? `Remove ${provider.name} from favorites`
                                  : `Add ${provider.name} to favorites`
                              }
                            >
                              <Heart
                                className={`h-5 w-5 transition-colors ${
                                  favoriteIds.has(provider.id)
                                    ? 'fill-red-500 text-red-500'
                                    : 'text-gray-400 hover:text-red-400'
                                }`}
                              />
                            </button>
                            <div className="text-right">
                              <p className="text-xl font-bold text-primary">
                                {formatCurrency(provider.price)}
                              </p>
                              <Button
                                size="sm"
                                variant={isSelected ? 'default' : 'outline'}
                                className="mt-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedProvider(provider)
                                }}
                              >
                                {isSelected ? 'Selected' : 'Select'}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Service</p>
                  <p className="font-medium">{service.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Starting at</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(service.stats.minPrice)}
                  </p>
                </div>
                {selectedProvider && (
                  <div>
                    <p className="text-sm text-gray-500">Selected Provider</p>
                    <p className="font-medium">{selectedProvider.name}</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(selectedProvider.price)}
                    </p>
                  </div>
                )}
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!selectedProvider}
                  onClick={handleContinue}
                >
                  Continue to Booking
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ServiceDetailPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ServiceDetailContent />
    </QueryClientProvider>
  )
}
