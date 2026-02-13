'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Wrench,
  Zap,
  Droplet,
  Paintbrush,
  Wind,
  Home,
  Sparkles,
  Package,
  Shield,
  Star,
  IndianRupee,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Smartphone,
  Bug,
  Scissors,
  LucideIcon,
} from 'lucide-react'
import customerApi from '@/lib/customer-api'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
}

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  'salon-for-women': Scissors,
  'salon-for-men': Scissors,
  'ac-appliance-repair': Wind,
  'home-cleaning': Sparkles,
  'electrician': Zap,
  'plumber': Droplet,
  'painter': Paintbrush,
  'pest-control': Bug,
}

const DEFAULT_ICON = Wrench

const trustPoints = [
  {
    icon: Shield,
    title: 'Aadhaar Verified',
    description: 'All service providers verified with Aadhaar and background checks',
  },
  {
    icon: IndianRupee,
    title: 'Secure Payments',
    description: 'Safe and secure payment processing with multiple options',
  },
  {
    icon: Star,
    title: 'Rated Providers',
    description: 'Choose from highly-rated professionals with verified reviews',
  },
]

export default function HomePage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await customerApi.get('/categories')
        // The API may return nested tree structure; extract top-level categories
        const cats = Array.isArray(data) ? data : data.data ?? []
        setCategories(cats)
      } catch {
        // Silently fail — categories section will be empty
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  const scrollToDownload = () => {
    document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' })
  }

  const getIconForCategory = (slug: string): LucideIcon => {
    return CATEGORY_ICON_MAP[slug] || DEFAULT_ICON
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-primary text-white p-2 rounded-lg">
              <Home className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-primary">BharatClap</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="#services" className="text-gray-700 hover:text-primary transition">
              Services
            </Link>
            <Link href="#how-it-works" className="text-gray-700 hover:text-primary transition">
              How It Works
            </Link>
            <Link href="#trust" className="text-gray-700 hover:text-primary transition">
              Why Trust Us
            </Link>
            <Link href="/admin" className="text-gray-700 hover:text-primary transition">
              Admin
            </Link>
          </div>

          <Button size="lg" onClick={scrollToDownload}>
            Get the App
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Home Services You Can <span className="text-primary">Trust</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Book verified, Aadhaar-authenticated service professionals for all your home needs.
              From plumbing to painting, we have got you covered across India.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6" onClick={() => router.push('/services')}>
                Browse Services
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={scrollToDownload}>
                Download App
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Popular Services</h2>
            <p className="text-lg text-gray-600">Choose from a wide range of home services</p>
          </div>

          {loadingCategories ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category) => {
                const Icon = getIconForCategory(category.slug)
                return (
                  <Card
                    key={category.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/services?category=${category.slug}`)}
                  >
                    <CardHeader>
                      <div className="bg-primary/10 text-primary p-3 rounded-lg w-fit mb-3">
                        <Icon className="h-8 w-8" />
                      </div>
                      <CardTitle className="text-xl">{category.name}</CardTitle>
                      {category.description && (
                        <CardDescription>{category.description}</CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Get your service done in 3 easy steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Browse & Select</h3>
              <p className="text-gray-600">Choose from verified service providers in your area</p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Book & Pay</h3>
              <p className="text-gray-600">Schedule a time and pay securely through the app</p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Relax & Enjoy</h3>
              <p className="text-gray-600">Sit back while professionals take care of your needs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="trust" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Trust BharatClap</h2>
            <p className="text-lg text-gray-600">Your safety and satisfaction are our priorities</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {trustPoints.map((point) => (
              <Card key={point.title} className="text-center">
                <CardHeader>
                  <div className="bg-green-100 text-green-600 p-4 rounded-full w-fit mx-auto mb-4">
                    <point.icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl">{point.title}</CardTitle>
                  <CardDescription className="text-base">{point.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" className="text-lg px-8 py-6" onClick={() => router.push('/services')}>
              Start Booking Now
              <CheckCircle2 className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Smartphone className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Download BharatClap on Your Phone</h2>
            <p className="text-lg text-gray-600 mb-8">
              Get the full BharatClap experience on your mobile device. Book services on the go!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                App Store
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                Play Store
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <div className="bg-primary text-white p-2 rounded-lg">
                  <Home className="h-6 w-6" />
                </div>
                <span className="text-2xl font-bold">BharatClap</span>
              </Link>
              <p className="text-gray-400">
                Trusted home services across India
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
                <li><Link href="/careers" className="text-gray-400 hover:text-white">Careers</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white">Blog</Link></li>
                <li><Link href="/press" className="text-gray-400 hover:text-white">Press</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
                <li><Link href="/refund" className="text-gray-400 hover:text-white">Refund Policy</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-400">
                  <Phone className="h-4 w-4 mr-2" />
                  +91 98765 43210
                </li>
                <li className="flex items-center text-gray-400">
                  <Mail className="h-4 w-4 mr-2" />
                  support@bharatclap.com
                </li>
                <li className="flex items-center text-gray-400">
                  <MapPin className="h-4 w-4 mr-2" />
                  Bangalore, India
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 BharatClap. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
