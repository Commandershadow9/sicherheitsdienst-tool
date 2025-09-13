import { test, expect } from '@playwright/test'

const FE = 'http://localhost:5173'

test('Login → Dashboard sichtbar', async ({ page }) => {
  await page.goto(FE + '/login')
  await page.getByLabel('E-Mail').fill('admin@sicherheitsdienst.de')
  await page.getByLabel('Passwort').fill('password123')
  await Promise.all([
    page.waitForURL('**/dashboard', { timeout: 45000 }),
    page.getByRole('button', { name: 'Anmelden' }).click(),
  ])
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 })
})

test('Sites-Liste lädt → Wechsel auf Seite 2', async ({ page }) => {
  await page.goto(FE + '/login')
  await page.getByLabel('E-Mail').fill('admin@sicherheitsdienst.de')
  await page.getByLabel('Passwort').fill('password123')
  await Promise.all([
    page.waitForURL('**/dashboard', { timeout: 45000 }),
    page.getByRole('button', { name: 'Anmelden' }).click(),
  ])
  await page.goto(FE + '/sites', { waitUntil: 'load' })
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Standorte' })).toBeVisible({ timeout: 15000 })
  // Warten bis Tabelle gerendert
  await expect(page.locator('table')).toBeVisible({ timeout: 15000 })
  // Falls nur 1 Seite vorhanden, Button ist disabled → Test überspringt den Klick
  const next = page.getByRole('button', { name: 'Weiter' })
  if (await next.isEnabled()) {
    await next.click()
    await expect(page.getByText(/Seite\s+2\s+\/\s+\d+/)).toBeVisible()
  } else {
    await expect(page.getByText(/Seite\s+1\s+\/\s+\d+/)).toBeVisible()
  }
})

test('Shifts für erste Site → CSV-Export klickbar (Download)', async ({ page }) => {
  await page.goto(FE + '/login')
  await page.getByLabel('E-Mail').fill('admin@sicherheitsdienst.de')
  await page.getByLabel('Passwort').fill('password123')
  await Promise.all([
    page.waitForURL('**/dashboard'),
    page.getByRole('button', { name: 'Anmelden' }).click(),
  ])
  await page.goto(FE + '/sites', { waitUntil: 'load' })
  await page.waitForLoadState('networkidle')
  // Es kann sein, dass noch keine Sites existieren (leere DB). In dem Fall Test soft-skippen.
  const firstLink = page.getByRole('link', { name: 'Schichten' }).first()
  if (await firstLink.count()) {
    await firstLink.first().click()
    await expect(page.getByRole('heading', { name: /Schichten – Site/ })).toBeVisible({ timeout: 15000 })
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'CSV Export' }).click(),
    ])
    const name = await download.suggestedFilename()
    expect(name).toMatch(/site_.*_shifts\.csv$/)
  } else {
    test.info().annotations.push({ type: 'skip', description: 'Keine Sites vorhanden – Link "Schichten" fehlt' })
  }
})
