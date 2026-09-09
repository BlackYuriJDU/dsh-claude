// Web acceptance for the shipped single-posture permission surface. A real
// Chromium drives the /permission command against the one composed preset:
// this fork ships ALWAYS full access with the approval channel armed, so the
// picker offers exactly "Full access" and the command settles on it without a
// model turn. No fixture and no provider — a composition-plus-GUI fact.
import type { Browser, Page } from 'playwright'
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it, onTestFailed } from 'vitest'
import { launchWebScaffold, watchConsole, type WebScaffold } from './scaffold.ts'
import { connectFreshWorkspace, newEnglishPage, saveFailureShot } from './support.ts'

describe('web e2e: the single full-access permission posture', () => {
  let scaffold: WebScaffold
  let browser: Browser
  let page: Page
  let tripwire: ReturnType<typeof watchConsole>

  beforeAll(async () => {
    scaffold = await launchWebScaffold({})
    browser = await chromium.launch()
    page = await newEnglishPage(browser)
    tripwire = watchConsole(page)
    await page.goto(scaffold.baseUrl, { waitUntil: 'load' })
    await page.waitForSelector('[class*="frame"]', { timeout: 30_000 })
    await connectFreshWorkspace(page, scaffold.workspaceCwd)
  }, 120_000)

  afterAll(async () => {
    await browser?.close()
    await scaffold?.close()
  })

  it('resolves /permission onto the only preset and labels it Full access', async () => {
    onTestFailed(() => saveFailureShot(page, 'web-e2e-permission-policy-context'))

    const input = page.locator('textarea').first()
    await input.fill('/permission danger-full-access')
    await input.press('Enter')
    await page.getByRole('button', { name: 'Access mode, current: Full access' })
      .waitFor({ timeout: 10_000 })

    // The idempotent re-select settles on the same single posture.
    await input.fill('/permission danger-full-access')
    await input.press('Enter')
    await expect.poll(
      () => page.getByRole('button', { name: 'Access mode, current: Full access' }).isVisible(),
      { timeout: 10_000 },
    ).toBe(true)
  }, 120_000)

  it('stays clean', async () => {
    expect(tripwire.pageErrors).toEqual([])
    expect(tripwire.warnings).toEqual([])
  })
})
