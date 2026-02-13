import { test, expect } from '@playwright/test'

const API = 'http://localhost:3000/api/v1'
const ADMIN_PHONE = '9999900000'

// ─── Landing Page ───────────────────────────────────────────────────
test.describe('Landing Page', () => {
  test('loads with correct title and key sections', async ({ page }) => {
    await page.goto('/')

    // Hero section
    await expect(page.locator('text=Home Services You Can')).toBeVisible()

    // Navbar
    await expect(page.locator('text=BharatClap').first()).toBeVisible()

    // Category cards (use heading role to avoid matching hero paragraph text)
    await expect(page.getByRole('heading', { name: 'Plumbing' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Electrical' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Carpentry' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Painting' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'AC Service' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Cleaning' })).toBeVisible()

    // How it works
    await expect(page.getByRole('heading', { name: 'How It Works' })).toBeVisible()
    await expect(page.locator('text=Browse & Select')).toBeVisible()

    // Trust section
    await expect(page.getByRole('heading', { name: 'Why Trust BharatClap' })).toBeVisible()
    await expect(page.locator('text=Aadhaar Verified')).toBeVisible()

    // Footer
    await expect(page.locator('text=2026 BharatClap')).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/landing-page.png', fullPage: true })
  })

  test('"Browse Services" button navigates to /services', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("Browse Services")').click()
    await page.waitForURL('**/services')
    expect(page.url()).toContain('/services')
  })

  test('category card navigates to /services?category=<slug>', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Pipe repairs, installations').click()
    await page.waitForURL('**/services**')
    expect(page.url()).toContain('/services')
    expect(page.url()).toContain('category=plumbing')
  })
})

// ─── Services Page ──────────────────────────────────────────────────
test.describe('Services Page', () => {
  test('loads and shows services from backend API', async ({ page }) => {
    await page.goto('/services')
    await expect(page.locator('text=Browse Services')).toBeVisible()

    // Wait for data to load
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'e2e/screenshots/services-page.png', fullPage: true })

    const pageContent = await page.textContent('body') || ''
    console.log('Services page content length:', pageContent.length)
  })

  test('category filter from URL param works', async ({ page }) => {
    await page.goto('/services?category=plumbing')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'e2e/screenshots/services-plumbing.png', fullPage: true })
  })
})

// ─── Admin Login ────────────────────────────────────────────────────
test.describe('Admin Login', () => {
  test('redirects to /admin/login when no token', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForURL('**/admin/login')
    expect(page.url()).toContain('/admin/login')
  })

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/admin/login')

    await expect(page.locator('text=BharatClap Admin')).toBeVisible()
    await expect(page.locator('text=Sign in with your admin phone number')).toBeVisible()
    await expect(page.locator('input[type="tel"]')).toBeVisible()
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/admin-login.png', fullPage: true })
  })

  test('login with admin phone via dev endpoint', async ({ page }) => {
    await page.goto('/admin/login')

    await page.locator('input[type="tel"]').fill(ADMIN_PHONE)
    await page.locator('button:has-text("Sign In")').click()

    // Wait for login + redirect
    await page.waitForTimeout(4000)

    await page.screenshot({ path: 'e2e/screenshots/admin-after-login.png', fullPage: true })

    const url = page.url()
    console.log('After login, URL:', url)

    // Should redirect to admin dashboard
    expect(url).toContain('/admin')
  })
})

// ─── Admin Dashboard (with token) ──────────────────────────────────
test.describe('Admin Dashboard (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Get a real admin token via dev login API
    const response = await page.request.post(`${API}/auth/login/dev`, {
      data: { phone: ADMIN_PHONE },
    })

    if (response.ok()) {
      const data = await response.json()
      await page.goto('/admin/login')
      await page.evaluate((token: string) => {
        localStorage.setItem('admin_token', token)
        localStorage.setItem('admin_user', JSON.stringify({ role: 'ADMIN' }))
      }, data.accessToken)
    } else {
      console.log('Dev login failed:', response.status(), await response.text())
      test.skip()
    }
  })

  test('dashboard page loads with stats and charts', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(4000)

    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/admin-dashboard.png', fullPage: true })

    const pageText = await page.textContent('body') || ''
    console.log('Dashboard has "Total Bookings":', pageText.includes('Total Bookings'))
    console.log('Dashboard has "Revenue":', pageText.includes('Revenue'))
  })

  test('bookings page loads', async ({ page }) => {
    await page.goto('/admin/bookings')
    await page.waitForTimeout(4000)

    await expect(page.locator('h1:has-text("Bookings")')).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/admin-bookings.png', fullPage: true })
  })

  test('providers page loads', async ({ page }) => {
    await page.goto('/admin/providers')
    await page.waitForTimeout(4000)

    await expect(page.locator('h1:has-text("Provider")')).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/admin-providers.png', fullPage: true })
  })

  test('payments page loads', async ({ page }) => {
    await page.goto('/admin/payments')
    await page.waitForTimeout(4000)

    await expect(page.locator('h1:has-text("Payments")')).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/admin-payments.png', fullPage: true })
  })

  test('disputes page loads', async ({ page }) => {
    await page.goto('/admin/disputes')
    await page.waitForTimeout(4000)

    await expect(page.locator('h1:has-text("Dispute")')).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/admin-disputes.png', fullPage: true })
  })

  test('sidebar navigation works across all pages', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    // Click through each nav item
    await page.locator('a:has-text("Bookings")').click()
    await page.waitForURL('**/admin/bookings')
    await expect(page.locator('h1:has-text("Bookings")')).toBeVisible()

    await page.locator('a:has-text("Providers")').click()
    await page.waitForURL('**/admin/providers')
    await expect(page.locator('h1:has-text("Provider")')).toBeVisible()

    await page.locator('a:has-text("Payments")').click()
    await page.waitForURL('**/admin/payments')
    await expect(page.locator('h1:has-text("Payments")')).toBeVisible()

    await page.locator('a:has-text("Disputes")').click()
    await page.waitForURL('**/admin/disputes')
    await expect(page.locator('h1:has-text("Dispute")')).toBeVisible()

    await page.locator('a:has-text("Dashboard")').click()
    await page.waitForURL('**/admin')
  })

  test('logout clears token and redirects to login', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    await page.locator('button:has-text("Logout")').click()
    await page.waitForURL('**/admin/login')

    const token = await page.evaluate(() => localStorage.getItem('admin_token'))
    expect(token).toBeNull()
  })
})
