import { test as base, expect } from '@playwright/test'

type ConsoleBuffer = string[]

type Fixtures = {
  consoleMessages: ConsoleBuffer
}

export const test = base.extend<Fixtures>({
  consoleMessages: async ({ page }, use) => {
    const messages: ConsoleBuffer = []
    const onConsole = (msg: { type(): string; text(): string }) => {
      messages.push(`[${msg.type()}] ${msg.text()}`)
    }
    const onPageError = (error: Error) => {
      messages.push(`[pageerror] ${error.message}`)
    }

    page.on('console', onConsole)
    page.on('pageerror', onPageError)

    await use(messages)

    page.off('console', onConsole)
    page.off('pageerror', onPageError)
  },
})

export { expect }

test.afterEach(async ({ page, consoleMessages }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) {
    return
  }

  const url = page.url()
  await testInfo.attach('current-url.txt', {
    body: url,
    contentType: 'text/plain',
  })

  try {
    const html = await page.content()
    await testInfo.attach('page.html', {
      body: html,
      contentType: 'text/html',
    })
  } catch (error) {
    await testInfo.attach('page.html.error.txt', {
      body: String(error),
      contentType: 'text/plain',
    })
  }

  try {
    const screenshot = await page.screenshot({ fullPage: true })
    await testInfo.attach('screenshot.png', {
      body: screenshot,
      contentType: 'image/png',
    })
  } catch (error) {
    await testInfo.attach('screenshot.error.txt', {
      body: String(error),
      contentType: 'text/plain',
    })
  }

  const consoleOutput = consoleMessages.length
    ? consoleMessages.join('\n')
    : '<no console messages>'
  await testInfo.attach('console.log', {
    body: consoleOutput,
    contentType: 'text/plain',
  })
})
