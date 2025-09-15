import { test, expect } from '@playwright/test'

const FE = process.env.BASE_URL || 'http://localhost:5173'

test('Users: Back/Forward bei Suche und Paging', async ({ page }) => {
  // Login
  await page.goto(FE + '/login')
  await page.getByLabel('E-Mail').fill('admin@sicherheitsdienst.de')
  await page.getByLabel('Passwort').fill('password123')
  await Promise.all([
    page.waitForURL('**/dashboard'),
    page.getByRole('button', { name: 'Anmelden' }).click(),
  ])

  // Users
  await page.goto(FE + '/users')
  await expect(page.getByRole('heading', { name: 'Benutzer' })).toBeVisible()

  // Suche: anna -> URL hat query=anna
  await page.getByLabel('Suche').fill('anna')
  await page.waitForTimeout(350)
  await expect(page).toHaveURL(/query=anna/)

  // Suche ändern: thomas -> URL hat query=thomas
  await page.getByLabel('Suche').fill('thomas')
  await page.waitForTimeout(350)
  await expect(page).toHaveURL(/query=thomas/)

  // Back: zurück zu anna
  await page.goBack()
  await expect(page).toHaveURL(/query=anna/)
  await expect(page.getByLabel('Suche')).toHaveValue('anna')

  // Paging: Weiter -> URL page=2
  const weiter = page.getByRole('button', { name: 'Weiter' })
  if (await weiter.isEnabled()) {
    await weiter.click()
    await expect(page).toHaveURL(/page=2/)
    // Back: zurück auf Seite 1
    await page.goBack()
    await expect(page).toHaveURL(/(\?|&)page=1|\/users(\?|$)/)
    await expect(page.getByText(/Seite\s+1\s+\/\s+\d+/)).toBeVisible()
  }
})

