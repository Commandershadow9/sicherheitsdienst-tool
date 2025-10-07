import { test, expect } from '@playwright/test'
import { login } from './support/auth'
import { API_BASE_URL } from './support/env'

test('Login → Dashboard → Users → Sites → Incidents keeps auth and sends Authorization header', async ({ page }) => {
  // Intercept API calls and assert Authorization header is present
  await page.route(`${API_BASE_URL}/api/**`, (route) => {
    const url = route.request().url()
    // Auth-Endpunkte sind explizit ohne Authorization-Header
    if (/\/api\/auth\/(login|refresh)/.test(url)) {
      return route.fallback()
    }
    const headers = route.request().headers()
    if (!headers['authorization']) {
      route.fallback()
      throw new Error('Missing Authorization header on API request: ' + url)
    }
    route.fallback()
  })

  await login(page)
  await expect(page).toHaveURL(/\/dashboard$/)

  // Navigate via SPA links
  await page.getByRole('link', { name: 'Benutzer' }).click()
  await expect(page).toHaveURL(/\/users$/)
  await page.getByRole('link', { name: 'Standorte' }).click()
  await expect(page).toHaveURL(/\/sites$/)

  await page.getByRole('link', { name: 'Vorfälle' }).click()
  await expect(page).toHaveURL(/\/incidents$/)
})
