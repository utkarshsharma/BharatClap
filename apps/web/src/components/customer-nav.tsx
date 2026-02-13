'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { getCustomerUser, isCustomerLoggedIn, customerLogout } from '@/lib/auth'
import { Home, LogOut, CalendarDays, MapPin, ChevronDown, Locate, Loader2, UserCircle } from 'lucide-react'
import { CITIES as CITY_LIST, getCityCoords, getStoredCoords, storeUserCoords, findNearestCity } from '@/lib/cities'

const CITIES = CITY_LIST.map((c) => c.name)

const CITY_STORAGE_KEY = 'bharatclap_selected_city'

export function getSelectedCity(): string {
  if (typeof window === 'undefined') return CITIES[0]
  return localStorage.getItem(CITY_STORAGE_KEY) || CITIES[0]
}

export function getSelectedCityCoords(): { lat: number; lng: number } | null {
  // Prefer precise GPS coords if stored, otherwise fall back to city center
  const precise = getStoredCoords()
  if (precise) return precise
  const city = getSelectedCity()
  return getCityCoords(city)
}

export function setSelectedCity(city: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CITY_STORAGE_KEY, city)
  // Dispatch a custom event so other components can listen for city changes
  window.dispatchEvent(new CustomEvent('city-changed', { detail: { city } }))
}

export function CustomerNav() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string } | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [city, setCity] = useState(CITIES[0])
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)

  useEffect(() => {
    setLoggedIn(isCustomerLoggedIn())
    setUser(getCustomerUser())
    setCity(getSelectedCity())
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setCityDropdownOpen(false)
    if (cityDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [cityDropdownOpen])

  const handleCityChange = useCallback(
    (newCity: string) => {
      setCity(newCity)
      setSelectedCity(newCity)
      setCityDropdownOpen(false)
      // Force refresh of service data by navigating to current page
      router.refresh()
    },
    [router]
  )

  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) return
    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        storeUserCoords(latitude, longitude)
        const nearest = findNearestCity(latitude, longitude)
        setCity(nearest.name)
        setSelectedCity(nearest.name)
        setCityDropdownOpen(false)
        setDetectingLocation(false)
        window.dispatchEvent(new CustomEvent('city-changed', { detail: { city: nearest.name } }))
        router.refresh()
      },
      () => {
        setDetectingLocation(false)
      },
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }, [router])

  const handleLogout = () => {
    customerLogout()
    setLoggedIn(false)
    setUser(null)
    router.push('/')
  }

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-primary text-white p-2 rounded-lg">
              <Home className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-primary">BharatClap</span>
          </Link>

          {/* City Selector */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setCityDropdownOpen(!cityDropdownOpen)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <MapPin className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">{city}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {cityDropdownOpen && (
              <div
                className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px] z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition text-blue-600 font-medium flex items-center gap-2 border-b border-gray-100"
                >
                  {detectingLocation ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Locate className="h-3.5 w-3.5" />
                  )}
                  {detectingLocation ? 'Detecting...' : 'Use my location'}
                </button>
                {CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleCityChange(c)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition ${
                      c === city ? 'text-primary font-semibold bg-orange-50' : 'text-gray-700'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-6">
          <Link href="/services" className="text-gray-700 hover:text-primary transition">
            Services
          </Link>
          {loggedIn && (
            <>
              <Link href="/my-bookings" className="text-gray-700 hover:text-primary transition flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                My Bookings
              </Link>
              <Link href="/profile" className="text-gray-700 hover:text-primary transition flex items-center gap-1">
                <UserCircle className="h-4 w-4" />
                Profile
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {loggedIn && user ? (
            <>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                {user.name || 'Customer'}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </>
          ) : (
            <Button size="sm" asChild>
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
