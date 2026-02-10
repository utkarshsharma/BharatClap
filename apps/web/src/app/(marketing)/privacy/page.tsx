import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export default function PrivacyPage() {
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

      {/* Privacy Policy Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: February 10, 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              BharatClap Private Limited ("we," "our," or "us") is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information
              when you use our mobile application and website (collectively, the "Platform").
            </p>
            <p className="text-gray-700">
              This policy is compliant with the Digital Personal Data Protection Act, 2023 (DPDP Act)
              and other applicable Indian data protection laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold mb-3">2.1 Personal Information</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Name, phone number, email address</li>
              <li>Aadhaar number (for service providers only, for verification purposes)</li>
              <li>Location data (with your consent)</li>
              <li>Payment information (processed through secure payment gateways)</li>
              <li>Profile photos and documents (for KYC verification)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.2 Usage Information</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Service bookings and transaction history</li>
              <li>Reviews and ratings</li>
              <li>Chat messages between customers and providers</li>
              <li>Device information and IP addresses</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Facilitate service bookings and transactions</li>
              <li>Verify identity of service providers using Aadhaar authentication</li>
              <li>Process payments and prevent fraud</li>
              <li>Send notifications about bookings and services</li>
              <li>Improve our Platform and customer experience</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes through our AI-powered system</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. Aadhaar Data Protection</h2>
            <p className="text-gray-700 mb-4">
              For service providers, we use Aadhaar authentication solely for identity verification
              purposes, as permitted under the Aadhaar Act, 2016. We:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Do not store Aadhaar numbers in our databases</li>
              <li>Use UIDAI's authentication APIs securely</li>
              <li>Store only the verification status and timestamp</li>
              <li>Comply with UIDAI regulations on data security</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Data Sharing</h2>
            <p className="text-gray-700 mb-4">We may share your information with:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Service providers to fulfill bookings</li>
              <li>Payment processors for transaction processing</li>
              <li>Government authorities when required by law</li>
              <li>Service partners for platform functionality</li>
            </ul>
            <p className="text-gray-700">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Your Rights (DPDP Act)</h2>
            <p className="text-gray-700 mb-4">Under the DPDP Act, you have the right to:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request data deletion (subject to legal requirements)</li>
              <li>Withdraw consent for data processing</li>
              <li>Nominate another person to exercise rights on your behalf</li>
              <li>Raise grievances with our Data Protection Officer</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and authentication</li>
              <li>Secure payment processing (PCI-DSS compliant)</li>
              <li>Regular backups and disaster recovery plans</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. Data Retention</h2>
            <p className="text-gray-700">
              We retain your data only as long as necessary for the purposes outlined in this policy
              or as required by law. Transaction records are retained for 7 years as per Indian tax laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700">
              Our Platform is not intended for users under 18 years of age. We do not knowingly
              collect data from children.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">10. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              For any privacy-related queries or to exercise your rights, contact our Data Protection Officer:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
              <p className="mb-2"><strong>Email:</strong> privacy@bharatclap.com</p>
              <p className="mb-2"><strong>Phone:</strong> +91 98765 43210</p>
              <p><strong>Address:</strong> BharatClap Private Limited, Bangalore, Karnataka, India</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any material
              changes through the Platform or via email. Continued use of the Platform after changes
              constitutes acceptance of the updated policy.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
