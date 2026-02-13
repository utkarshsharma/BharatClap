'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Home } from 'lucide-react'
import api from '@/lib/api'

export default function AdminLoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) return

    setIsLoading(true)
    setError('')

    try {
      const fullPhone = phone.startsWith('+91') ? phone : `+91${phone}`
      const res = await api.post('/auth/login/dev', { phone: fullPhone })
      const { accessToken, user } = res.data

      if (user.role !== 'ADMIN') {
        setError('Access denied. Admin role required.')
        setIsLoading(false)
        return
      }

      localStorage.setItem('admin_token', accessToken)
      localStorage.setItem('admin_user', JSON.stringify(user))
      router.push('/admin')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed. Check phone number.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary text-white p-3 rounded-lg">
              <Home className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl">BharatClap Admin</CardTitle>
          <CardDescription>Sign in with your admin phone number</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Phone Number</label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-gray-100 border rounded-md text-sm font-medium">
                  +91
                </div>
                <Input
                  type="tel"
                  placeholder="Enter admin phone number"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))
                    if (error) setError('')
                  }}
                  maxLength={10}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || phone.length < 10}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <p className="text-xs text-gray-400 text-center mt-4">
              Dev mode login — development environment only
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
