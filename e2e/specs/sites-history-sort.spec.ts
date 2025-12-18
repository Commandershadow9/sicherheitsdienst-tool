import { test, expect } from '../fixtures'

const FE = process.env.BASE_URL || 'http://localhost:5173'

test('Sites: Filter/History und Sortierwechsel', async ({ page }) => {
  // Sites
  await page.goto(FE + '/sites', { waitUntil: 'load' })
  await expect(page.getByTestId('sites-title')).toBeVisible({ timeout: 15000 })

  // Filter Stadt setzen (Debounce ~300ms)
  const cityGroup = page.locator('label:text("Stadt")').locator('..')
  await cityGroup.locator('input').fill('Muster')
  await page.waitForTimeout(350)
  await expect(page).toHaveURL(/filter%5Bcity%5D=Muster/)

  // Paging vor/zurück
  const next = page.getByRole('button', { name: 'Weiter' })
  if (await next.isEnabled()) {
    await next.click()
    await expect(page).toHaveURL(/page=2/)
    await page.goBack()
    await expect(page).toHaveURL(/(\?|&)page=1|\/sites(\?|$)/)
  }

  // Sort „Name“: asc → desc → aus
  const sortName = page.getByRole('button', { name: /Name/ })
  await sortName.click()
  await expect(page).toHaveURL(/sortBy=name.*sortDir=desc|sortDir=desc/)
})
