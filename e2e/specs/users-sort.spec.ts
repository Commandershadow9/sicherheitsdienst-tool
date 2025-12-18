import { test, expect } from '../fixtures'

const FE = process.env.BASE_URL || 'http://localhost:5173'

test('Users: Sortierwechsel (Header-Klick) → URL-Update', async ({ page }) => {
  await page.goto(FE + '/login')
  await page.getByLabel('E-Mail').fill('admin@sicherheitsdienst.de')
  await page.getByLabel('Passwort').fill('password123')
  await Promise.all([
    page.waitForURL('**/dashboard'),
    page.getByRole('button', { name: 'Anmelden' }).click(),
  ])

  await page.goto(FE + '/users')
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

