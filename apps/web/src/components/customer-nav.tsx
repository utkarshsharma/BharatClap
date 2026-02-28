'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { getCustomerUser, isCustomerLoggedIn, customerLogout } from '@/lib/auth'
import { Home, LogOut, CalendarDays, MapPin, ChevronDown, Locate, Loader2, UserCircle, Heart, Bell, MapPinned } from 'lucide-react'
import customerApi from '@/lib/customer-api'
import { CITIES as CITY_LIST, getCityCoords, getStoredCoords, storeUserCoords, findNearestCity } from '@/lib/cities'

const CITIES = CITY_LIST.map((c) => c.name)

const CITY_STORAGE_KEY = 'bharatclap_selected_city'
const ADDRESS_STORAGE_KEY = 'bharatclap_selected_address'

interface StoredAddress {
  id: string
  label: string
  city: string
  pincode: string
}

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

export function getStoredAddress(): StoredAddress | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(ADDRESS_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredAddress
  } catch {
    return null
  }
}

export function setSelectedCity(city: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CITY_STORAGE_KEY, city)
  window.dispatchEvent(new CustomEvent('city-changed', { detail: { city } }))
}

function setStoredAddress(addr: StoredAddress | null): void {
  if (typeof window === 'undefined') return
  if (addr) {
    localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(addr))
    // Keep city in sync
    localStorage.setItem(CITY_STORAGE_KEY, addr.city)
  } else {
    localStorage.removeItem(ADDRESS_STORAGE_KEY)
  }
  window.dispatchEvent(new CustomEvent('city-changed', { detail: { city: addr?.city ?? CITIES[0] } }))
}

interface NavAddress {
  id: string
  label: string
  addressLine: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

export function CustomerNav() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string } | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [city, setCity] = useState(CITIES[0])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Address state (for logged-in users)
  const [addresses, setAddresses] = useState<NavAddress[]>([])
  const [selectedAddr, setSelectedAddr] = useState<StoredAddress | null>(null)
  const [addressesLoading, setAddressesLoading] = useState(false)

  useEffect(() => {
    const isLogged = isCustomerLoggedIn()
    setLoggedIn(isLogged)
    setUser(getCustomerUser())
    setCity(getSelectedCity())

    // Restore stored address
    const stored = getStoredAddress()
    if (stored) setSelectedAddr(stored)

    if (isLogged) {
      customerApi.get('/notifications/unread-count')
        .then((res) => setUnreadCount(typeof res.data === 'number' ? res.data : res.data?.count ?? 0))
        .catch(() => {})

      // Fetch user addresses
      setAddressesLoading(true)
      customerApi.get('/addresses')
        .then((res) => {
          const raw = res.data.data ?? res.data
          const list = Array.isArray(raw) ? raw as NavAddress[] : []
          setAddresses(list)

          // Auto-select default address if none stored
          if (!stored && list.length > 0) {
            const defaultAddr = list.find((a) => a.isDefault) ?? list[0]
            const addr: StoredAddress = {
              id: defaultAddr.id,
              label: defaultAddr.label || 'Address',
              city: defaultAddr.city,
              pincode: defaultAddr.pincode,
            }
            setSelectedAddr(addr)
            setStoredAddress(addr)
            setCity(addr.city)
          }
        })
        .catch(() => {})
        .finally(() => setAddressesLoading(false))
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setDropdownOpen(false)
    if (dropdownOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [dropdownOpen])

  const handleAddressSelect = useCallback(
    (addr: NavAddress) => {
      const stored: StoredAddress = {
        id: addr.id,
        label: addr.label || 'Address',
        city: addr.city,
        pincode: addr.pincode,
      }
      setSelectedAddr(stored)
      setStoredAddress(stored)
      setCity(addr.city)
      setDropdownOpen(false)
      router.refresh()
    },
    [router]
  )

  // For non-logged-in users: city selector
  const handleCityChange = useCallback(
    (newCity: string) => {
      setCity(newCity)
      setSelectedCity(newCity)
      setDropdownOpen(false)
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
        setDropdownOpen(false)
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
    setSelectedAddr(null)
    localStorage.removeItem(ADDRESS_STORAGE_KEY)
    router.push('/')
  }

  // Display label for the location selector
  const locationLabel = selectedAddr && loggedIn
    ? `${selectedAddr.label} — ${selectedAddr.city}`
    : city

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

          {/* Location Selector */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDropdownOpen(!dropdownOpen)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition max-w-[220px]"
            >
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="hidden sm:inline truncate">{locationLabel}</span>
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div
                className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[220px] max-h-[380px] overflow-y-auto z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Detect location button */}
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

                {/* If logged in with addresses: show address list */}
                {loggedIn && addresses.length > 0 ? (
                  <>
                    <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Your Addresses
                    </div>
                    {addresses.map((addr) => {
                      const isSelected = selectedAddr?.id === addr.id
                      return (
                        <button
                          key={addr.id}
                          onClick={() => handleAddressSelect(addr)}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition flex items-start gap-2 ${
                            isSelected ? 'bg-orange-50' : ''
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                              isSelected ? 'border-primary' : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-medium truncate ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                                {addr.label || 'Address'}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {addr.city}, {addr.pincode}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                    <Link
                      href="/addresses"
                      className="block px-4 py-2 text-sm text-primary font-medium hover:bg-gray-50 border-t border-gray-100 text-center"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Manage Addresses
                    </Link>
                  </>
                ) : loggedIn && addresses.length === 0 && !addressesLoading ? (
                  <>
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No saved addresses
                    </div>
                    <Link
                      href="/addresses"
                      className="block px-4 py-2 text-sm text-primary font-medium hover:bg-gray-50 border-t border-gray-100 text-center"
                      onClick={() => setDropdownOpen(false)}
                    >
                      + Add Address
                    </Link>
                    {/* Also show city fallback */}
                    <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide border-t border-gray-100">
                      Select City
                    </div>
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
                  </>
                ) : (
                  <>
                    {/* Not logged in — city selector */}
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
                  </>
                )}
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
              <Link href="/addresses" className="text-gray-700 hover:text-primary transition flex items-center gap-1">
                <MapPinned className="h-4 w-4" />
                Addresses
              </Link>
              <Link href="/favorites" className="text-gray-700 hover:text-primary transition flex items-center gap-1">
                <Heart className="h-4 w-4" />
                Favorites
              </Link>
              <Link href="/notifications" className="relative text-gray-700 hover:text-primary transition flex items-center gap-1">
                <Bell className="h-4 w-4" />
                Notifications
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
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
