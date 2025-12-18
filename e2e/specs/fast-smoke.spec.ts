import { test, expect } from '../fixtures'

const FE = process.env.BASE_URL || 'http://localhost:5173'

test('Fast smoke: Login + Dashboard + Users link', async ({ page }) => {
  await page.goto(FE + '/dashboard', { waitUntil: 'load' })
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 })
  // Users Link sichtbar und klickbar (RBAC)
  const usersLink = page.getByRole('link', { name: 'Benutzer' })
  await expect(usersLink).toBeVisible()
  await usersLink.click()
  await expect(page).toHaveURL(/\/users$/)
})
