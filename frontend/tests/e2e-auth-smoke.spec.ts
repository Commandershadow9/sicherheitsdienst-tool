import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const API_BASE = process.env.API_BASE || 'http://localhost:3000'

test('Login → Dashboard → Users → Sites → Incidents keeps auth and sends Authorization header', async ({ page }) => {
  // Intercept API calls and assert Authorization header is present
  await page.route(`${API_BASE}/api/**`, (route) => {
    const headers = route.request().headers()
    if (!headers['authorization']) {
      // Fail early to catch missing headers
      route.fallback()
      throw new Error('Missing Authorization header on API request: ' + route.request().url())
    }
    route.fallback()
  })

  await page.goto(`${BASE_URL}/login`)
  await page.getByLabel('E-Mail').fill('admin@sicherheitsdienst.de')
  await page.getByLabel('Passwort').fill('password123')
  await page.getByRole('button', { name: 'Anmelden' }).click()

  await page.waitForURL(/\/dashboard$/)
  await expect(page).toHaveURL(/\/dashboard$/)

  // Navigate via SPA links
  await page.getByRole('link', { name: 'Benutzer' }).click()
  await expect(page).toHaveURL(/\/users$/)
  await page.getByRole('link', { name: 'Standorte' }).click()
  await expect(page).toHaveURL(/\/sites$/)

  await page.getByRole('link', { name: 'Vorfälle' }).click()
  await expect(page).toHaveURL(/\/incidents$/)
})
