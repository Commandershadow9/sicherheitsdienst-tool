import { test, expect } from '@playwright/test'
import { login } from './support/auth'
import { FE_BASE_URL } from './support/env'

test('Users: Sortierwechsel (Header-Klick) → URL-Update', async ({ page }) => {
  await login(page)

  await page.goto(FE_BASE_URL + '/users')
  await expect(page.getByRole('heading', { name: 'Benutzer' })).toBeVisible()

  // Klick auf "E-Mail" -> sortBy=email&sortDir=asc
  await page.getByRole('button', { name: /E-Mail/ }).click()
  await expect(page).toHaveURL(/sortBy=email.*sortDir=asc|sortDir=asc.*sortBy=email/)

  // Erneut klicken -> sortDir=desc
  await page.getByRole('button', { name: /E-Mail/ }).click()
  await expect(page).toHaveURL(/sortBy=email.*sortDir=desc|sortDir=desc.*sortBy=email/)

  // Drittes Mal -> Sortierung entfernt (kein sortBy)
  await page.getByRole('button', { name: /E-Mail/ }).click()
  await expect(page).not.toHaveURL(/sortBy=/)
})
