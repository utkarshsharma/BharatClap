import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BharatClap - Home Services You Can Trust',
  description: 'Book trusted home services from Aadhaar-verified professionals. Plumbing, electrical, cleaning, and more across India.',
  keywords: 'home services, India, plumber, electrician, cleaning, Aadhaar verified',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
