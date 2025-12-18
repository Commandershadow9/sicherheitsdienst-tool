import { chromium, type Page } from '@playwright/test'
import fs from 'fs/promises'
import path from 'path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const API_URL = process.env.API_URL || 'http://localhost:3000'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@sicherheitsdienst.de'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'password123'

const AUTH_DIR = path.join(__dirname, '.auth')
const ADMIN_STATE = path.join(AUTH_DIR, 'admin.json')

async function waitForOk(url: string, timeoutMs = 60_000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' })
      if (res.ok) return
    } catch {
      // retry until timeout
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw new Error(`Timeout waiting for ${url}`)
}

async function loginViaApi(page: Page, email: string, password: string) {
  const loginUrl = new URL('/api/auth/login', API_URL).toString()
  const res = await page.request.post(loginUrl, {
    data: { email, password },
  })
  if (!res.ok()) {
    throw new Error(`Login failed: ${res.status()} ${res.statusText()}`)
  }
}

export default async function globalSetup() {
  await fs.mkdir(AUTH_DIR, { recursive: true })

  const readyUrl = new URL('/readyz', API_URL).toString()
  await waitForOk(readyUrl)
  await waitForOk(BASE_URL)

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  await loginViaApi(page, ADMIN_EMAIL, ADMIN_PASSWORD)

  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'load' })
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ state: 'visible', timeout: 15000 })

  await context.storageState({ path: ADMIN_STATE })
  await context.close()
  await browser.close()
}
