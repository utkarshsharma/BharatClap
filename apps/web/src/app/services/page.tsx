'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Star } from 'lucide-react'
import { CustomerNav, getSelectedCity } from '@/components/customer-nav'

const queryClient = new QueryClient()

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  createdAt: string
  updatedAt: string
}

interface Service {
  id: string
  name: string
  slug: string
  description: string
  basePrice: number
  categoryId: string
  category: {
    name: string
    slug: string
  }
  rating?: number
  reviewCount?: number
}

interface ServicesResponse {
  data: Service[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const API_BASE_URL = 'http://localhost:3000/api/v1'

function ServicesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || null
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory)
  const [city, setCity] = useState(() => getSelectedCity())

  // Listen for city changes from the nav
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.city) setCity(detail.city)
    }
    window.addEventListener('city-changed', handler)
    return () => window.removeEventListener('city-changed', handler)
  }, [])

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/categories`)
      return (response.data.data ?? response.data) as Category[]
    },
  })

  // Fetch services filtered by selected city
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['services', selectedCategory, city],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedCategory) {
        params.append('categorySlug', selectedCategory)
      }
      if (city) {
        params.append('city', city)
      }
      params.append('page', '1')
      params.append('limit', '50')

      const response = await axios.get<ServicesResponse>(
        `${API_BASE_URL}/services?${params.toString()}`
      )
      return response.data
    },
  })

  const handleCategoryClick = (categorySlug: string | null) => {
    setSelectedCategory(categorySlug)
    if (categorySlug) {
      router.push(`/services?category=${categorySlug}`)
    } else {
      router.push('/services')
    }
  }

  const isLoading = categoriesLoading || servicesLoading
  const services = servicesData?.data || []

  return (
    <div className="min-h-screen bg-background">
      <CustomerNav />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Services</h1>
          <p className="text-lg text-gray-600">
            Find the perfect service for your needs
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Badge
              variant={selectedCategory === null ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2 whitespace-nowrap"
              onClick={() => handleCategoryClick(null)}
            >
              All Services
            </Badge>
            {categories?.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.slug ? 'default' : 'outline'}
                className="cursor-pointer px-4 py-2 whitespace-nowrap"
                onClick={() => handleCategoryClick(category.slug)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600">No services found</p>
            <p className="text-gray-500 mt-2">Try selecting a different category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {service.category.name}
                    </Badge>
                    {service.rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{service.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Starting at</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(service.basePrice)}
                      </p>
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/services/${service.slug}`}>Book Now</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results Count */}
        {!isLoading && services.length > 0 && servicesData?.meta && (
          <div className="mt-8 text-center text-gray-600">
            Showing {services.length} of {servicesData.meta.total} services
          </div>
        )}
      </div>
    </div>
  )
}

export default function ServicesPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense>
        <ServicesPageContent />
      </Suspense>
    </QueryClientProvider>
  )
}
