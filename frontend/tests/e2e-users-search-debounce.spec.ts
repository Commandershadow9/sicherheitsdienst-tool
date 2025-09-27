import { test, expect } from '@playwright/test'

const FE = process.env.BASE_URL || 'http://localhost:5173'
const API_BASE = process.env.API_BASE || 'http://localhost:3000'

test('Users: Debounced Suche (~300ms) setzt query-Param und triggert API erst nach Ruhe', async ({ page }) => {
  // Track API calls to /api/users
  const seen: string[] = []
  page.on('request', (req) => {
    const url = req.url()
    if (url.startsWith(`${API_BASE}/api/users`)) seen.push(url)
  })

  // Login als Admin
  await page.goto(FE + '/login')
  await page.getByLabel('E-Mail').fill('admin@sicherheitsdienst.de')
  await page.getByLabel('Passwort').fill('password123')
  await Promise.all([
    page.waitForURL('**/dashboard', { timeout: 45000 }),
    page.getByRole('button', { name: 'Anmelden' }).click(),
  ])
  await page.waitForLoadState('networkidle')

  // Users-Seite
  await page.goto(FE + '/users', { waitUntil: 'load' })
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Benutzer' })).toBeVisible({ timeout: 15000 })

  const baseLen = seen.length

  // Tippen: sollte nicht sofort eine neue Anfrage triggern (Debounce ~300ms)
  const input = page.getByLabel('Suche')
  await input.click()
  await input.type('anna', { delay: 50 })

  // Kurze Wartezeit < 300ms: noch kein neuer Request über Baseline
  await page.waitForTimeout(150)
  expect(seen.length).toBe(baseLen)

  // Jetzt auf Debounce warten und prüfen
  await expect.poll(() => seen.some((u) => u.includes('query=anna')), { timeout: 10000 }).toBe(true)
  await expect(page).toHaveURL(/query=anna/)
})
