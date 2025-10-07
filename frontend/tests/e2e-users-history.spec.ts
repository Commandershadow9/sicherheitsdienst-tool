import { test, expect } from '@playwright/test'
import { login } from './support/auth'
import { FE_BASE_URL } from './support/env'

test('Users: Back/Forward bei Suche und Paging', async ({ page }) => {
  await login(page)

  // Users
  await page.goto(FE_BASE_URL + '/users')
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
