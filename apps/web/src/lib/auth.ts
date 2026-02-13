export function getCustomerToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('customer_token')
}

export function getCustomerUser(): { id: string; name: string; phone: string; role: string } | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('customer_user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function isCustomerLoggedIn(): boolean {
  return !!getCustomerToken()
}

export function customerLogout(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('customer_token')
  localStorage.removeItem('customer_user')
}

export function setCustomerAuth(token: string, user: any): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('customer_token', token)
  localStorage.setItem('customer_user', JSON.stringify(user))
}
