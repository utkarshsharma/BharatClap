import { test, expect } from '@playwright/test'

test.describe('Bug Fix Verification', () => {
  test('services page loads without console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/services')
    await page.waitForLoadState('networkidle')

    // Page should load
    await expect(page).toHaveURL(/\/services/)

    // No asChild-related errors
    const asChildErrors = consoleErrors.filter(e => e.includes('asChild'))
    expect(asChildErrors).toHaveLength(0)

    await page.screenshot({ path: 'e2e/screenshots/bug-fix-services.png', fullPage: true })
  })

  test('privacy page asChild button works as link', async ({ page }) => {
    await page.goto('/privacy')
    await page.waitForLoadState('networkidle')

    // The "Back to Home" button should be an anchor link, not a plain button
    const backButton = page.locator('a:has-text("Back to Home")')
    await expect(backButton).toBeVisible()
    expect(await backButton.getAttribute('href')).toBe('/')

    await page.screenshot({ path: 'e2e/screenshots/bug-fix-privacy.png', fullPage: true })
  })

  test('terms page asChild button works as link', async ({ page }) => {
    await page.goto('/terms')
    await page.waitForLoadState('networkidle')

    const backButton = page.locator('a:has-text("Back to Home")')
    await expect(backButton).toBeVisible()
    expect(await backButton.getAttribute('href')).toBe('/')

    await page.screenshot({ path: 'e2e/screenshots/bug-fix-terms.png', fullPage: true })
  })

  test('landing page loads without errors', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Hero visible
    await expect(page.locator('text=BharatClap').first()).toBeVisible()

    // Filter out network errors (API calls to non-running backend)
    const codeErrors = consoleErrors.filter(
      e => !e.includes('ERR_CONNECTION_REFUSED') && !e.includes('Failed to fetch')
    )
    expect(codeErrors).toHaveLength(0)
  })
})
