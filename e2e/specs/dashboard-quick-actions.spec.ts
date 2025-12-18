import { test, expect } from '../fixtures'
import type { APIRequestContext } from '@playwright/test'

const FE = process.env.BASE_URL || 'http://localhost:5173'
const API = process.env.API_URL || 'http://localhost:3001'
const MANAGER_EMAIL = process.env.E2E_MANAGER_EMAIL || 'test-manager@sicherheitsdienst.de'
const MANAGER_PASSWORD = process.env.E2E_MANAGER_PASSWORD || 'manager123'

test.use({ storageState: { cookies: [], origins: [] } })

async function apiLogin(request: APIRequestContext, email: string, password: string) {
  await request.post(`${API}/api/auth/login`, {
    data: { email, password },
    failOnStatusCode: true,
  })
}

function isoInFuture(daysAhead: number) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + daysAhead)
  date.setUTCHours(8, 0, 0, 0)
  return date.toISOString()
}

test.describe('Dashboard Quick Actions & Ersatzsuche', () => {
  test('Genehmigen aus Pending Approvals funktioniert', async ({ page }) => {
    await apiLogin(page.request, MANAGER_EMAIL, MANAGER_PASSWORD)

    const reason = `E2E Quick Action ${Date.now()}`
    const createAbsenceResponse = await page.request.post(`${API}/api/absences`, {
      data: {
        type: 'VACATION',
        startsAt: isoInFuture(3),
        endsAt: isoInFuture(4),
        reason,
      },
      failOnStatusCode: true,
    })
    const createdAbsence = await createAbsenceResponse.json()
    expect(createdAbsence?.data?.id, 'Abwesenheit konnte nicht erstellt werden').toBeTruthy()

    await page.goto(`${FE}/login`)
    await page.getByLabel('E-Mail').fill(MANAGER_EMAIL)
    await page.getByLabel('Passwort').fill(MANAGER_PASSWORD)
    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 45000 }),
      page.getByRole('button', { name: 'Anmelden' }).click(),
    ])

    const pendingEntry = page
      .getByRole('heading', { name: /Ausstehende Genehmigungen/ })
      .locator('..')
      .locator('li', { hasText: reason })

    await expect(pendingEntry, 'Dashboard zeigt neu erstellten Antrag').toBeVisible({ timeout: 20000 })

    await pendingEntry.getByRole('button', { name: /Genehmigen/ }).click()

    const approveModal = page.getByRole('dialog', { name: 'Antrag genehmigen' })
    await expect(approveModal).toBeVisible()
    await expect(approveModal.getByText(reason)).toBeVisible()

    await approveModal.getByRole('button', { name: /^Genehmigen$/ }).click()

    await expect(pendingEntry, 'Eintrag verschwindet nach Genehmigung').toBeHidden({ timeout: 20000 })
  })

  test('Ersatzsuche öffnet Modal mit Kandidaten oder Hinweis', async ({ page }) => {
    await apiLogin(page.request, MANAGER_EMAIL, MANAGER_PASSWORD)
    const criticalResponse = await page.request.get(`${API}/api/dashboard/critical`, { failOnStatusCode: true })
    const criticalPayload = await criticalResponse.json()
    const criticalShifts = Array.isArray(criticalPayload?.data) ? criticalPayload.data : []

    if (criticalShifts.length === 0) {
      test.skip('Kein kritischer Shift verfügbar – Ersatzsuche-Test übersprungen')
    }

    const targetShift = criticalShifts[0]

    await page.goto(`${FE}/login`)
    await page.getByLabel('E-Mail').fill(MANAGER_EMAIL)
    await page.getByLabel('Passwort').fill(MANAGER_PASSWORD)
    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 45000 }),
      page.getByRole('button', { name: 'Anmelden' }).click(),
    ])

    const criticalList = page.getByRole('heading', { name: /Heute kritisch/ }).locator('..')
    const shiftEntry = criticalList.locator('li', { hasText: targetShift.shiftTitle }).first()
    await expect(shiftEntry).toBeVisible({ timeout: 20000 })

    await shiftEntry.getByRole('button', { name: /Ersatz suchen/ }).click()

    const modalTitle = `Ersatz-Mitarbeiter für "${targetShift.shiftTitle}"`
    const replacementModal = page.getByRole('dialog', { name: modalTitle })
    await expect(replacementModal).toBeVisible()

    const emptyState = replacementModal.getByText('Keine verfügbaren Ersatz-Mitarbeiter gefunden.', { exact: false })
    if (await emptyState.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(emptyState).toBeVisible()
    } else {
      await expect(
        replacementModal.getByText('verfügbare Mitarbeiter', { exact: false })
      ).toBeVisible({ timeout: 10000 })
    }

    await replacementModal.getByRole('button', { name: 'Schließen' }).click()
    await expect(replacementModal).toBeHidden()
  })
})
