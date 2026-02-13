import axios from 'axios'

const customerApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

customerApi.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('customer_token') : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

customerApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Only clear & redirect if a token was present (i.e. it expired)
      const hadToken = !!localStorage.getItem('customer_token')
      if (hadToken) {
        localStorage.removeItem('customer_token')
        localStorage.removeItem('customer_user')
        // Don't redirect if already on login page
        if (!window.location.pathname.startsWith('/login')) {
          const currentPath = window.location.pathname + window.location.search
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
        }
      }
    }
    return Promise.reject(error)
  }
)

export default customerApi
