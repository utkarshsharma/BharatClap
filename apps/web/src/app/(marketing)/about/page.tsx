import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Shield,
  Star,
  IndianRupee,
  Scale,
  Phone,
  Mail,
  MapPin,
  Users,
  Target,
  Heart,
} from 'lucide-react'

const values = [
  {
    icon: Shield,
    title: 'Safety',
    description:
      'Every service provider undergoes Aadhaar verification and background checks before they can serve on our platform.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Star,
    title: 'Quality',
    description:
      'Our rating system ensures only the best professionals stay active. Customers rate every service, keeping standards high.',
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    icon: IndianRupee,
    title: 'Affordability',
    description:
      'Transparent pricing with no hidden charges. See the exact cost before you book, with competitive rates across all services.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: Scale,
    title: 'Trust',
    description:
      'Verified reviews, secure payments, and a built-in dispute resolution system protect both customers and providers.',
    color: 'bg-purple-100 text-purple-600',
  },
]

const team = [
  {
    name: 'Arjun Sharma',
    role: 'Co-Founder & CEO',
    bio: 'Former product lead at a leading Indian fintech. Passionate about building technology for Bharat.',
  },
  {
    name: 'Priya Nair',
    role: 'Co-Founder & CTO',
    bio: 'Full-stack engineer with 10+ years of experience. Previously built scalable platforms at top startups.',
  },
  {
    name: 'Rahul Verma',
    role: 'Head of Operations',
    bio: 'Operations expert who has managed on-ground teams across 15+ Indian cities in logistics and home services.',
  },
  {
    name: 'Ananya Desai',
    role: 'Head of Design',
    bio: 'UX designer focused on building inclusive, accessible digital experiences for diverse Indian audiences.',
  },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              About <span className="text-primary">BharatClap</span>
            </h1>
            <p className="text-xl text-gray-600">
              Connecting Indian households with verified, trusted service professionals --
              making quality home services accessible, safe, and affordable across India.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
                <p className="text-gray-600 mb-4">
                  BharatClap was founded with a simple observation: finding trustworthy home service
                  professionals in India is unreliable, opaque, and often unsafe. Millions of
                  households struggle to find verified electricians, plumbers, cleaners, and other
                  essential service providers.
                </p>
                <p className="text-gray-600 mb-4">
                  We set out to change that. By leveraging Aadhaar-based identity verification,
                  transparent pricing, and a robust review system, BharatClap creates a marketplace
                  where customers can book with confidence and providers can grow their businesses.
                </p>
                <p className="text-gray-600">
                  Today, we serve customers across major Indian cities, with thousands of verified
                  service professionals on our platform, delivering quality home services every day.
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <div className="bg-primary text-white p-4 rounded-full mb-4">
                  <Target className="h-12 w-12" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Our Mission</h3>
                <p className="text-gray-700">
                  Make quality home services accessible, safe, and affordable for every
                  household across India -- from metro cities to tier-2 towns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-lg text-gray-600">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {values.map((value) => (
              <Card key={value.title} className="text-center">
                <CardHeader>
                  <div className={`${value.color} p-4 rounded-full w-fit mx-auto mb-4`}>
                    <value.icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                  <CardDescription className="text-base">{value.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold">7+</p>
              <p className="text-orange-100 mt-1">Cities Served</p>
            </div>
            <div>
              <p className="text-4xl font-bold">5,000+</p>
              <p className="text-orange-100 mt-1">Verified Providers</p>
            </div>
            <div>
              <p className="text-4xl font-bold">50+</p>
              <p className="text-orange-100 mt-1">Service Types</p>
            </div>
            <div>
              <p className="text-4xl font-bold">4.8</p>
              <p className="text-orange-100 mt-1">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-lg text-gray-600">
              The people building the future of home services in India
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {team.map((member) => (
              <Card key={member.name}>
                <CardHeader className="text-center">
                  <div className="bg-gray-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-10 w-10 text-gray-500" />
                  </div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <p className="text-sm font-medium text-primary">{member.role}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 text-center">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-primary/10 text-primary p-4 rounded-full w-fit mx-auto mb-6">
              <Heart className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-lg text-gray-600 mb-8">
              Have questions, feedback, or partnership inquiries? We would love to hear from you.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="flex flex-col items-center py-6">
                  <Phone className="h-8 w-8 text-primary mb-3" />
                  <p className="font-semibold text-gray-900">Phone</p>
                  <p className="text-gray-600">+91 98765 43210</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center py-6">
                  <Mail className="h-8 w-8 text-primary mb-3" />
                  <p className="font-semibold text-gray-900">Email</p>
                  <p className="text-gray-600">support@bharatclap.com</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center py-6">
                  <MapPin className="h-8 w-8 text-primary mb-3" />
                  <p className="font-semibold text-gray-900">Office</p>
                  <p className="text-gray-600">Bangalore, Karnataka, India</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
