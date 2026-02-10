import Link from 'next/link'
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
} from 'lucide-react'

const categories = [
  { name: 'Plumbing', icon: Droplet, description: 'Pipe repairs, installations' },
  { name: 'Electrical', icon: Zap, description: 'Wiring, fixtures, repairs' },
  { name: 'Carpentry', icon: Wrench, description: 'Furniture, repairs, installations' },
  { name: 'Painting', icon: Paintbrush, description: 'Interior & exterior painting' },
  { name: 'AC Service', icon: Wind, description: 'Installation, repair, maintenance' },
  { name: 'Cleaning', icon: Sparkles, description: 'Deep cleaning, regular cleaning' },
  { name: 'Home Repair', icon: Home, description: 'General maintenance & repairs' },
  { name: 'Appliance', icon: Package, description: 'Repair & maintenance' },
]

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

          <Button size="lg">
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
              <Button size="lg" className="text-lg px-8 py-6">
                Browse Services
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Card key={category.name} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="bg-primary/10 text-primary p-3 rounded-lg w-fit mb-3">
                    <category.icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
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
            <Button size="lg" className="text-lg px-8 py-6">
              Start Booking Now
              <CheckCircle2 className="ml-2 h-5 w-5" />
            </Button>
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
