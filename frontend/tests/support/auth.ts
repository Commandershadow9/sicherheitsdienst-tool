import { expect, type Page } from '@playwright/test'
import { FE_BASE_URL } from './env'

export type UserCredentials = {
  email: string
  password: string
}

export const ADMIN_CREDENTIALS: UserCredentials = {
  email: 'admin@sicherheitsdienst.de',
  password: 'password123',
}

export const EMPLOYEE_CREDENTIALS: UserCredentials = {
  email: 'thomas.mueller@sicherheitsdienst.de',
  password: 'password123',
}

type LoginOptions = {
  waitForDashboard?: boolean
}

export async function login(
  page: Page,
  credentials: UserCredentials = ADMIN_CREDENTIALS,
  options: LoginOptions = {},
) {
  const { waitForDashboard = true } = options

  await page.goto(`${FE_BASE_URL}/login`)
  await page.getByLabel('E-Mail').fill(credentials.email)
  await page.getByLabel('Passwort').fill(credentials.password)

  if (waitForDashboard) {
    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 45_000 }),
      page.getByRole('button', { name: 'Anmelden' }).click(),
    ])
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/dashboard$/)
  } else {
    await page.getByRole('button', { name: 'Anmelden' }).click()
  }
}
