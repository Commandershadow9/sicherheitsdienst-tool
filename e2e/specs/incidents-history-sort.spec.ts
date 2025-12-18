import { test, expect } from '../fixtures'

const FE = process.env.BASE_URL || 'http://localhost:5173'

test('Incidents: Filter/History und Sortierwechsel', async ({ page }) => {
  // Incidents
  await page.goto(FE + '/incidents', { waitUntil: 'load' })
  await expect(page.getByRole('heading', { name: 'Vorfälle' })).toBeVisible({ timeout: 15000 })

  // Titel-Filter (Debounce ~300ms)
  const titleGroup = page.locator('label:text("Titel")').locator('..')
  await titleGroup.locator('input').fill('Test')
  await page.waitForTimeout(350)
  await expect(page).toHaveURL(/filter%5Btitle%5D=Test/)

  // Paging vor/zurück
  const next = page.getByRole('button', { name: 'Weiter' })
  if (await next.isEnabled()) {
    await next.click()
    await expect(page).toHaveURL(/page=2/)
    await page.goBack()
    await expect(page).toHaveURL(/(\?|&)page=1|\/incidents(\?|$)/)
  }

  // Sort „Status“: asc → desc → aus
  const sortStatus = page.getByRole('button', { name: /Status/ })
  await sortStatus.click()
  await expect(page).toHaveURL(/sortBy=status.*sortDir=asc|sortDir=asc.*sortBy=status/)
  await sortStatus.click()
  await expect(page).toHaveURL(/sortBy=status.*sortDir=desc|sortDir=desc.*sortBy=status/)
  await sortStatus.click()
  await expect(page).not.toHaveURL(/sortBy=/)
})
