/**
 * Automated accessibility audit of the DSHC Web composition: axe-core runs the
 * WCAG 2.x A and AA rules on the first screen before and after a Workspace is
 * bound, in a desktop and a phone viewport, and the page must report no
 * critical or serious violation. At phone width the last mode of the
 * segmented picker stays reachable by keyboard inside the viewport.
 */
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium, type Browser, type Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { launchWebScaffold, type WebScaffold } from './scaffold.ts'
import { connectFreshWorkspace, newEnglishPage, saveFailureShot } from './support.ts'

const AXE_SOURCE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8')
const DSHC_BUNDLE = new URL('../../../packages/bundle/dshc/', import.meta.url)
const DSHC_MANIFEST = JSON.parse(readFileSync(new URL('package.json', DSHC_BUNDLE), 'utf8')) as { dsh: { bundle: { patch: string[] } } }

let scaffold: WebScaffold
let browser: Browser

beforeAll(async () => {
  scaffold = await launchWebScaffold({
    extraOverlayPath: DSHC_MANIFEST.dsh.bundle.patch.map(patch => fileURLToPath(new URL(patch, DSHC_BUNDLE))),
    extraInstallAnchors: [fileURLToPath(new URL('package.json', DSHC_BUNDLE))],
    // The scaffold pins the upstream `standard` preset, which DSHC disables.
    agentPresets: { default: 'chat' },
  })
  browser = await chromium.launch()
})

afterAll(async () => {
  try { await browser?.close() }
  finally { await scaffold?.close() }
})

interface AxeViolation {
  id: string
  impact: string | null
  nodes: { target: unknown[] }[]
}

declare global {
  interface Window {
    /** axe-core, injected into the page under audit. */
    axe?: { run: (context: Document, options: object) => Promise<{ violations: AxeViolation[] }> }
  }
}

/**
 * Rules the audit does not run, each with the controls that fail it.
 * `label-content-name-mismatch` (WCAG 2.5.3): the upstream sidebar brand button
 * ("New session" over the wordmark), the launcher ("Account menu" over its
 * visible label), and the bound Hero Workspace button ("Choose workspace" over
 * the Workspace name). Aligning these names changes the accessible names the
 * Web e2e suite selects by, so the fix belongs upstream with those tests.
 */
const DISABLED_RULES = { 'label-content-name-mismatch': { enabled: false } }

/**
 * Critical and serious WCAG A/AA violations on the current page.
 * @param page - the page to audit.
 * @returns one `rule: targets` line per violation.
 */
async function blockingViolations(page: Page): Promise<string[]> {
  await page.addScriptTag({ content: AXE_SOURCE })
  const violations = await page.evaluate(async (rules) => {
    if (window.axe === undefined) throw new Error('axe-core did not load')
    const result = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, rules })
    return result.violations
  }, DISABLED_RULES)
  return violations
    .filter(violation => violation.impact === 'critical' || violation.impact === 'serious')
    .map(violation => `${violation.id}: ${violation.nodes.map(node => JSON.stringify(node.target)).join(', ')}`)
}

describe('web e2e: accessibility audit', () => {
  it.each([[1280, 800], [390, 844]] as const)('reports no critical or serious violation at %ipx before and after a Workspace', async (width, height) => {
    const page = await newEnglishPage(browser)
    try {
      await page.setViewportSize({ width, height })
      await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
      await page.getByRole('button', { name: 'Choose a workspace to start', exact: true }).waitFor()
      expect(await blockingViolations(page)).toEqual([])
      await page.reload({ waitUntil: 'load' })
      await connectFreshWorkspace(page, scaffold.workspaceCwd, `accessibility-${String(width)}`, 'How can I help you today?')
      await page.locator('[data-slot="conversation.session.header"]').waitFor({ timeout: 15_000 })
      expect(await blockingViolations(page)).toEqual([])
    } catch (error) {
      await saveFailureShot(page, `web-e2e-accessibility-${String(width)}`)
      throw error
    } finally {
      await page.close()
    }
  })

  it('reaches the last mode of the segmented picker by keyboard at 390px without scrolling the page', async () => {
    const page = await newEnglishPage(browser)
    try {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
      const modes = page.getByRole('radiogroup')
      await modes.getByRole('radio', { name: 'Chat', exact: true }).focus()
      await page.keyboard.press('End')
      const last = modes.getByRole('radio', { name: 'Design', exact: true })
      await expect.poll(() => last.evaluate(element => element === document.activeElement)).toBe(true)
      const box = await last.boundingBox()
      expect(box !== null && box.x >= 0 && box.x + box.width <= 390).toBe(true)
      expect(await page.evaluate(() => document.scrollingElement?.scrollLeft)).toBe(0)
    } catch (error) {
      await saveFailureShot(page, 'web-e2e-accessibility-segmented-390')
      throw error
    } finally {
      await page.close()
    }
  })
})
