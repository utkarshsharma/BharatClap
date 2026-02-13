'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  IndianRupee,
  MapPin,
  Bell,
  Server,
  Shield,
  Globe,
  Settings,
} from 'lucide-react'

const SERVICE_CITIES = [
  { name: 'Delhi NCR', status: 'active' },
  { name: 'Mumbai', status: 'active' },
  { name: 'Bangalore', status: 'active' },
  { name: 'Hyderabad', status: 'active' },
  { name: 'Chennai', status: 'active' },
  { name: 'Kolkata', status: 'active' },
  { name: 'Pune', status: 'active' },
]

const NOTIFICATION_SETTINGS = [
  { label: 'New booking alerts', enabled: true, channel: 'Email + Push' },
  { label: 'KYC approval requests', enabled: true, channel: 'Email' },
  { label: 'Dispute escalations', enabled: true, channel: 'Email + SMS' },
  { label: 'Payment settlement updates', enabled: true, channel: 'Email' },
  { label: 'Provider onboarding complete', enabled: false, channel: 'Push' },
  { label: 'Weekly analytics digest', enabled: true, channel: 'Email' },
]

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          Platform Settings
        </h1>
        <p className="text-gray-600 mt-2">View platform configuration and operational settings</p>
      </div>

      {/* Commission Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-primary" />
            Commission Structure
          </CardTitle>
          <CardDescription>
            Revenue split between platform and service providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
              <p className="text-sm font-medium text-orange-600 mb-1">Platform Commission</p>
              <p className="text-5xl font-bold text-primary">20%</p>
              <p className="text-sm text-gray-500 mt-2">Deducted from each completed booking</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <p className="text-sm font-medium text-green-600 mb-1">Provider Payout</p>
              <p className="text-5xl font-bold text-green-600">80%</p>
              <p className="text-sm text-gray-500 mt-2">Transferred to provider after completion</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> Commission rates are system-configured and apply uniformly to all
              service categories. Payouts are processed after the booking status moves to COMPLETED
              and the review window has closed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Service Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Service Areas
          </CardTitle>
          <CardDescription>
            Cities where BharatClap services are currently available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {SERVICE_CITIES.map((city) => (
              <div
                key={city.name}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{city.name}</span>
                </div>
                <Badge variant="success" className="text-xs">
                  Active
                </Badge>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            {SERVICE_CITIES.length} active service areas. New cities are added based on provider
            availability and market demand.
          </p>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Admin notification preferences for platform events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {NOTIFICATION_SETTINGS.map((setting) => (
              <div
                key={setting.label}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      setting.enabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                  <span className="text-gray-900">{setting.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{setting.channel}</span>
                  <Badge variant={setting.enabled ? 'success' : 'secondary'} className="text-xs">
                    {setting.enabled ? 'On' : 'Off'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            System Information
          </CardTitle>
          <CardDescription>
            Technical details about the platform environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">API Version</span>
                <span className="font-mono text-gray-900">v1.0.0</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Environment</span>
                <Badge variant="warning" className="text-xs">
                  {process.env.NEXT_PUBLIC_ENV || 'development'}
                </Badge>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">API Base URL</span>
                <span className="font-mono text-sm text-gray-900">
                  {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Frontend Framework</span>
                <span className="font-mono text-gray-900">Next.js 15</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Backend Framework</span>
                <span className="font-mono text-gray-900">NestJS</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Database</span>
                <span className="font-mono text-gray-900">Supabase PostgreSQL</span>
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Security</p>
              <p className="text-sm text-blue-700">
                All API endpoints are protected with JWT authentication. Admin endpoints require
                the ADMIN role. Provider KYC data is encrypted at rest.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
