import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple Navbar */}
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-primary text-white p-2 rounded-lg">
              <Home className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-primary">BharatClap</span>
          </Link>
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </nav>

      {/* Terms of Service Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: February 10, 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700">
              By accessing or using the BharatClap Platform, you agree to be bound by these Terms of Service
              and all applicable laws and regulations. If you do not agree with any of these terms, you are
              prohibited from using this Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. Description of Services</h2>
            <p className="text-gray-700 mb-4">
              BharatClap is a platform connecting customers with verified home service providers. We facilitate:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Service discovery and booking</li>
              <li>Secure payment processing</li>
              <li>Communication between customers and providers</li>
              <li>Aadhaar-based identity verification of service providers</li>
              <li>AI-powered dispute resolution</li>
            </ul>
            <p className="text-gray-700">
              BharatClap acts as an intermediary and is not responsible for the actual service delivery.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>

            <h3 className="text-xl font-semibold mb-3">3.1 Registration</h3>
            <p className="text-gray-700 mb-4">
              You must provide accurate and complete information during registration. You are responsible
              for maintaining the confidentiality of your account credentials.
            </p>

            <h3 className="text-xl font-semibold mb-3">3.2 Service Providers</h3>
            <p className="text-gray-700 mb-4">
              Service providers must complete Aadhaar-based KYC verification before offering services.
              Providers must:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Possess necessary skills and licenses for offered services</li>
              <li>Maintain professional conduct</li>
              <li>Deliver services as described in bookings</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. Bookings and Payments</h2>

            <h3 className="text-xl font-semibold mb-3">4.1 Booking Process</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Customers can browse and book services through the Platform</li>
              <li>Bookings are confirmed when a provider accepts the request</li>
              <li>Service fees are displayed before booking confirmation</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">4.2 Payment Terms</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Payments are processed securely through our payment partners</li>
              <li>Platform charges a commission on each transaction</li>
              <li>Payments are held in escrow until service completion</li>
              <li>Refunds are processed as per our Refund Policy</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">4.3 Cancellations</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Free cancellation up to 2 hours before scheduled service</li>
              <li>25% cancellation fee for cancellations within 2 hours</li>
              <li>No refund for no-shows</li>
              <li>Providers canceling confirmed bookings may face penalties</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. AI-Powered Dispute Resolution</h2>
            <p className="text-gray-700 mb-4">
              In case of disputes between customers and providers:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Disputes are first analyzed by our AI system</li>
              <li>AI provides recommendations based on chat history, photos, and evidence</li>
              <li>Both parties can accept or appeal AI decisions</li>
              <li>Human moderators review appealed cases</li>
              <li>Platform's decision on disputes is final</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. User Conduct</h2>
            <p className="text-gray-700 mb-4">Users must not:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Provide false information or impersonate others</li>
              <li>Engage in fraudulent activities</li>
              <li>Harass or abuse other users</li>
              <li>Post inappropriate content</li>
              <li>Circumvent the platform for direct transactions</li>
              <li>Use the platform for illegal activities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Intellectual Property</h2>
            <p className="text-gray-700">
              All content on the Platform, including logos, text, images, and software, is owned by
              BharatClap or its licensors and protected by intellectual property laws. Users may not
              reproduce, distribute, or create derivative works without permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              BharatClap acts as an intermediary platform. We are not liable for:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Quality of services provided by service providers</li>
              <li>Damages or injuries resulting from service delivery</li>
              <li>Disputes between customers and providers</li>
              <li>Technical issues or platform downtime</li>
              <li>Loss of data or unauthorized access to accounts</li>
            </ul>
            <p className="text-gray-700">
              Our maximum liability is limited to the amount of the specific transaction in dispute.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">9. Indemnification</h2>
            <p className="text-gray-700">
              You agree to indemnify and hold BharatClap harmless from any claims, damages, or expenses
              arising from your use of the Platform or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">10. Governing Law</h2>
            <p className="text-gray-700">
              These Terms are governed by the laws of India. Any disputes shall be subject to the
              exclusive jurisdiction of courts in Bangalore, Karnataka.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">11. Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify these Terms at any time. Continued use of the Platform
              after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">12. Contact Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
              <p className="mb-2"><strong>Email:</strong> legal@bharatclap.com</p>
              <p className="mb-2"><strong>Phone:</strong> +91 98765 43210</p>
              <p><strong>Address:</strong> BharatClap Private Limited, Bangalore, Karnataka, India</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
