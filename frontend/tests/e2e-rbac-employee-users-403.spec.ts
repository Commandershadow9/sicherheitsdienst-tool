import { test, expect } from '@playwright/test'

const FE = process.env.BASE_URL || 'http://localhost:5173'

test('EMPLOYEE sieht keinen Menüpunkt Benutzer und /users zeigt 403-Karte', async ({ page }) => {
  await page.goto(FE + '/login')
  await page.getByLabel('E-Mail').fill('thomas.mueller@sicherheitsdienst.de')
  await page.getByLabel('Passwort').fill('password123')
  await Promise.all([
    page.waitForURL('**/dashboard'),
    page.getByRole('button', { name: 'Anmelden' }).click(),
  ])
  await page.waitForLoadState('networkidle')

  // Menüpunkt "Benutzer" darf nicht sichtbar sein
  await expect(page.getByRole('link', { name: 'Benutzer' })).toHaveCount(0)

  // Direkter Aufruf /users zeigt 403-Karte (ohne Re-Login)
  await page.goto(FE + '/users', { waitUntil: 'load' })
  await page.waitForLoadState('networkidle')
  // großzügiger Timeout, falls Server träge ist; prüfe zwei mögliche Texte
  const forb1 = page.getByText('403 – Zugriff verweigert')
  const forb2 = page.getByText(/Keine Berechtigung/i)
  await expect(forb1.or(forb2)).toBeVisible({ timeout: 20000 })
})
