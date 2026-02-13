export interface CityCoords {
  name: string
  lat: number
  lng: number
}

export const CITIES: CityCoords[] = [
  { name: 'Delhi NCR', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
]

export function getCityCoords(cityName: string): { lat: number; lng: number } | null {
  const city = CITIES.find((c) => c.name === cityName)
  return city ? { lat: city.lat, lng: city.lng } : null
}

const COORDS_STORAGE_KEY = 'bharatclap_user_coords'

/** Store precise GPS coords from browser geolocation */
export function storeUserCoords(lat: number, lng: number): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(COORDS_STORAGE_KEY, JSON.stringify({ lat, lng }))
}

/** Get stored precise coords (from GPS), or fall back to city center */
export function getStoredCoords(): { lat: number; lng: number } | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(COORDS_STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
        return parsed
      }
    } catch {}
  }
  return null
}

/** Find the nearest supported city to given coordinates */
export function findNearestCity(lat: number, lng: number): CityCoords {
  let nearest = CITIES[0]
  let minDist = Infinity
  for (const city of CITIES) {
    const dLat = city.lat - lat
    const dLng = city.lng - lng
    const dist = dLat * dLat + dLng * dLng
    if (dist < minDist) {
      minDist = dist
      nearest = city
    }
  }
  return nearest
}
