import { test, expect } from '@playwright/test'
import { login, EMPLOYEE_CREDENTIALS } from './support/auth'
import { FE_BASE_URL } from './support/env'

test('EMPLOYEE sieht keinen Menüpunkt Benutzer und /users zeigt 403-Karte', async ({ page }) => {
  await login(page, EMPLOYEE_CREDENTIALS)

  // Menüpunkt "Benutzer" darf nicht sichtbar sein
  await expect(page.getByRole('link', { name: 'Benutzer' })).toHaveCount(0)

  // Direkter Aufruf /users zeigt 403-Karte (ohne Re-Login)
  await page.goto(FE_BASE_URL + '/users', { waitUntil: 'load' })
  await page.waitForLoadState('networkidle')
  // großzügiger Timeout, falls Server träge ist; prüfe zwei mögliche Texte
  const forb1 = page.getByText('403 – Zugriff verweigert')
  const forb2 = page.getByText(/Keine Berechtigung/i)
  await expect(forb1.or(forb2)).toBeVisible({ timeout: 20000 })
})
