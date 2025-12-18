import { test, expect } from '../fixtures'

const FE = process.env.BASE_URL || 'http://localhost:5173'

test('Smoke: Login, Users paging/sort, Incidents filter', async ({ page }) => {
  await page.goto(FE + '/dashboard', { waitUntil: 'load' })
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 })

  // Users: paging/sort sichtbar
  await page.goto(FE + '/users', { waitUntil: 'load' })
  await expect(page.getByRole('heading', { name: 'Benutzer' })).toBeVisible({ timeout: 15000 })
  const next = page.getByRole('button', { name: 'Weiter' })
  if (await next.isEnabled()) {
    await next.click()
    await expect(page).toHaveURL(/page=2/)
  }
  // Sort by E-Mail
  const sortEmail = page.getByRole('button', { name: /E-Mail/ })
  await sortEmail.click()
  await expect(page).toHaveURL(/sortBy=email/)

  // Incidents: Liste lädt, Filter setzt
  await page.goto(FE + '/incidents', { waitUntil: 'load' })
  await expect(page.getByRole('heading', { name: 'Vorfälle' })).toBeVisible({ timeout: 15000 })
  // Fülle Titel-Filter (Debounce ~300ms). Label/Input sind im selben Container.
  const titleGroup = page.locator('label:text("Titel")').locator('..')
  const titleInput = titleGroup.locator('input')
  await titleInput.fill('Test')
  await page.waitForTimeout(350)
  await expect(page).toHaveURL(/filter%5Btitle%5D=Test/)

  // Sites: kurz prüfen (List + Sort)
  await page.goto(FE + '/sites', { waitUntil: 'load' })
  await expect(page.getByTestId('sites-title')).toBeVisible({ timeout: 15000 })
  const sortName = page.getByRole('button', { name: /Name/ })
  await sortName.click()
  await expect(page).toHaveURL(/sortBy=name.*sortDir=desc|sortDir=desc/)
})
