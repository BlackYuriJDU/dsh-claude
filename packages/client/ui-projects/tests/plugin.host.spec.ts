import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import * as projectsPlugin from '../src/index.ts'
import { PROJECT_CONTEXT_NAME, PROJECT_CONTEXT_ORDER } from '../src/projects.ts'

interface RegisteredContext {
  name: string
  order: number
  interpolate?: boolean
  text: (context: { agent?: { session: { id: string } } }) => string
}

let dir: string | undefined
afterEach(() => { if (dir !== undefined) rmSync(dir, { recursive: true, force: true }) })

async function boot(cwdIn: (root: string) => string = root => root) {
  dir = mkdtempSync(join(tmpdir(), 'ui-projects-plugin-'))
  writeFileSync(join(dir, 'brief.md'), 'Ship on Fridays.')
  const contexts: RegisteredContext[] = []
  const configured: unknown[] = []
  const ctx = new Context()
  ctx.provide('settings')
  ctx.set('settings', { configure: (presentation: unknown) => { configured.push(presentation); return () => undefined } })
  ctx.provide('systemPrompt')
  ctx.set('systemPrompt', { context: (entry: RegisteredContext) => { contexts.push(entry); return () => undefined } })
  ctx.provide('workspaceRegistry')
  ctx.set('workspaceRegistry', { list: () => [{ id: 'ws-1', path: dir }] })
  ctx.provide('workingDirectory')
  const root = dir
  ctx.set('workingDirectory', { get: () => cwdIn(root) })
  const fiber = ctx.plugin(projectsPlugin, {
    projects: { 'ws-1': { instructions: 'Use metric units.', files: [{ id: 'f', path: 'brief.md' }] } },
    maxFileChars: 1000,
    maxTotalChars: 5000,
  })
  await fiber.await()
  return { fiber, contexts, configured, dir }
}

describe('ui-projects Host plugin', () => {
  it('declares the services it reads', () => {
    expect(projectsPlugin.inject).toEqual(['settings', 'systemPrompt', 'workspaceRegistry', 'workingDirectory'])
  })

  it('registers one live, uninterpolated context and hands Settings its own page', async () => {
    const { fiber, contexts, configured } = await boot()
    expect(configured).toEqual([{ auto: false }])
    expect(contexts).toHaveLength(1)
    expect(contexts[0]).toMatchObject({ name: PROJECT_CONTEXT_NAME, order: PROJECT_CONTEXT_ORDER, interpolate: false })
    await fiber.dispose()
  })

  it('reads instructions and knowledge files for a session inside the workspace', async () => {
    const { fiber, contexts } = await boot(root => join(root, 'src'))
    const text = contexts[0]!.text({ agent: { session: { id: 's' } } })
    expect(text).toContain('Instructions:\nUse metric units.')
    expect(text).toContain('Knowledge file brief.md:\nShip on Fridays.')
    await fiber.dispose()
  })

  it('contributes nothing outside every workspace or without an agent', async () => {
    const { fiber, contexts } = await boot(root => `${root}-sibling`)
    expect(contexts[0]!.text({ agent: { session: { id: 's' } } })).toBe('')
    expect(contexts[0]!.text({})).toBe('')
    await fiber.dispose()
  })
})
