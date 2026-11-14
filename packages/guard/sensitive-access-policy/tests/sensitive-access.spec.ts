/**
 * Decisions of @deepseek-ai/dsh-sensitive-access-policy through the real tool
 * pipeline: an outer `tools/pre-execute` recorder sees the policy's decision,
 * and without an approval service the pipeline turns an `ask` into a denial
 * that carries the model-facing reason.
 */
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import { ToolCallId } from '@deepseek-ai/dsh-llm'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import * as NativeToolExecutor from '@deepseek-ai/dsh-tool-executor-native'
import { defineContentToolFixture, executeToolFixture } from '@deepseek-ai/dsh-tool-testkit'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import type { PreToolDecision, ToolExecutionInput } from '@deepseek-ai/dsh-tools'

type Agent = NonNullable<ToolExecutionInput['agent']>
import * as policy from '@deepseek-ai/dsh-sensitive-access-policy'
import type { Config } from '@deepseek-ai/dsh-sensitive-access-policy'

const signal = new AbortController().signal
const tempDirs: string[] = []
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'dsh-sensitive-access-')))
  tempDirs.push(root)
  mkdirSync(join(root, 'secrets'))
  writeFileSync(join(root, 'secrets', 'id_rsa'), 'k')
  writeFileSync(join(root, 'notes.txt'), 'n')
  symlinkSync(join(root, 'secrets', 'id_rsa'), join(root, 'innocent.txt'))
  return root
}

/** The model-facing reason of an ask decision. */
function askReason(decision: PreToolDecision | undefined): string | undefined {
  return decision?.kind === 'ask' ? decision.reason : undefined
}

const okTool = (name: string) => defineContentToolFixture({
  name, description: name, parameters: {},
  async execute() { return [{ type: 'text' as const, text: `${name} ran` }] },
})

async function setup(config: Config, options: { cwd?: string; downstream?: PreToolDecision } = {}) {
  const ctx = new Context()
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(NativeToolExecutor)
  const decisions: PreToolDecision[] = []
  ctx.on('tools/pre-execute', async (_exec, next) => {
    const decision = await next()
    decisions.push(decision)
    return decision
  })
  if (options.cwd !== undefined) {
    const cwd = options.cwd
    ctx.provide('workingDirectory')
    ctx.set('workingDirectory', { ensure: () => Promise.resolve(cwd) })
  }
  const fiber = ctx.plugin(policy, config)
  await fiber
  if (options.downstream !== undefined) {
    const downstream = options.downstream
    ctx.on('tools/pre-execute', () => Promise.resolve(downstream))
  }
  for (const name of ['read', 'read_image', 'grep', 'glob', 'web_fetch', 'write']) ctx.tools.register(okTool(name))
  const call = (name: string, args: unknown, agent?: Agent) => executeToolFixture(ctx, {
    callId: ToolCallId('c1'), name, arguments: args, signal, ...agent === undefined ? {} : { agent },
  })
  return { fiber, decisions, call }
}

describe('protected paths', () => {
  it('asks before reading a protected file and names it in every locale', async () => {
    const root = fixture()
    const { decisions, call } = await setup({ sensitivePaths: [`${root}/secrets/**`] })
    const result = await call('read', { file_path: join(root, 'secrets', 'id_rsa') })
    const path = join(root, 'secrets', 'id_rsa')
    expect(decisions[0]).toMatchObject({ kind: 'ask', reason: `reading ${path} requires approval because the path is protected` })
    expect(decisions[0]).toHaveProperty('displayReason.pt', `Permitir ler ${path}? O caminho é protegido, como chaves ou segredos de ambiente.`)
    expect(Object.keys((decisions[0] as { displayReason: object }).displayReason).sort()).toEqual(['de', 'en', 'es', 'fr', 'ja', 'pt', 'ru', 'zh'])
    expect(result.isError).toBe(true)
    expect(result.error?.info).toMatchObject({ code: 'APPROVAL_UNAVAILABLE' })
  })

  it('follows a symlink with an innocent name to the protected file it resolves to', async () => {
    const root = fixture()
    const { decisions, call } = await setup({ sensitivePaths: [`${root}/secrets/**`] })
    await call('read_image', { file_path: join(root, 'innocent.txt') })
    expect(askReason(decisions[0])).toContain(join(root, 'secrets', 'id_rsa'))
  })

  it('resolves a relative path against the Session directory and matches ** patterns at any depth', async () => {
    const root = fixture()
    const { decisions, call } = await setup({ sensitivePaths: ['**/.env*'] }, { cwd: root })
    await call('read', { file_path: 'app/.env.local' }, {} as Agent)
    expect(askReason(decisions[0])).toContain(join(root, 'app', '.env.local'))
  })

  it('judges a relative path by its name when no Session directory is available', async () => {
    const { decisions, call } = await setup({ sensitivePaths: ['**/.env*'] })
    await call('read', { file_path: '.env' })
    expect(decisions[0]).toMatchObject({ kind: 'ask', reason: 'reading .env requires approval because the path is protected' })
  })

  it('asks before a search rooted at or inside a protected directory, but not one beside it', async () => {
    const root = fixture()
    const { decisions, call } = await setup({ sensitivePaths: [`${root}/secrets/**`] })
    await call('grep', { pattern: 'k', path: join(root, 'secrets') })
    await call('glob', { pattern: '*', path: join(root, 'secrets') })
    await call('grep', { pattern: 'k', path: root })
    await call('glob', { pattern: '*' })
    expect(decisions.map(decision => decision.kind)).toEqual(['ask', 'ask', 'allow', 'allow'])
  })

  it('expands ~ in patterns and in paths against the home directory', async () => {
    const { decisions, call } = await setup({ sensitivePaths: ['~/.dsh-sensitive-access-test/**', '~'] })
    await call('read', { file_path: '~/.dsh-sensitive-access-test/key' })
    await call('read', { file_path: '~' })
    expect(decisions.map(decision => decision.kind)).toEqual(['ask', 'ask'])
    expect(decisions[1]).toMatchObject({ reason: `reading ${homedir()} requires approval because the path is protected` })
  })

  it('allows unprotected paths, other tools, and malformed or absent arguments', async () => {
    const root = fixture()
    const { decisions, call } = await setup({ sensitivePaths: [`${root}/secrets/**`] })
    await call('read', { file_path: join(root, 'notes.txt') })
    await call('read', { file_path: join(root, 'missing.txt') })
    await call('write', { file_path: join(root, 'secrets', 'id_rsa') })
    await call('read', { file_path: 3 })
    await call('read', 'not an object')
    await call('read', { file_path: '  ' })
    expect(decisions.every(decision => decision.kind === 'allow')).toBe(true)
  })

  it('stays out of the way with no patterns configured', async () => {
    const { decisions, call } = await setup({})
    await call('read', { file_path: '/etc/hosts' })
    expect(decisions).toEqual([{ kind: 'allow' }])
  })

  it.each(['secrets/*', 'relative', ''])('rejects the pattern %j at load', async (pattern) => {
    await expect(setup({ sensitivePaths: [pattern] })).rejects.toThrow('sensitivePaths entries must be absolute, start with ~/, or start with **')
  })
})

describe('web_fetch', () => {
  const fetchConfig: Config = { fetchApproval: 'with-data', fetchAllowedDomains: ['Example.org'], fetchPathLengthLimit: 20 }

  it.each([
    ['https://evil.test/?q=secret', 'query'],
    ['https://evil.test/page#secret', 'fragment'],
    ['https://user:pass@evil.test/', 'credentials'],
    [`https://evil.test/${'a'.repeat(21)}`, 'long path'],
  ])('asks before %s (%s) to a site outside the list', async (url) => {
    const { decisions, call } = await setup(fetchConfig)
    await call('web_fetch', { url })
    expect(decisions[0]).toMatchObject({
      kind: 'ask',
      reason: 'fetching evil.test with data in the address requires approval because the site is not on the allowed list',
    })
    expect(decisions[0]).toHaveProperty('displayReason.en', 'Allow sending this request to evil.test? Its address carries data, and the site is not on the allowed list.')
  })

  it.each([
    'https://evil.test/docs/page',
    'https://example.org/?q=1',
    'https://api.example.org/search?q=1',
    'not a url',
  ])('allows %s', async (url) => {
    const { decisions, call } = await setup(fetchConfig)
    await call('web_fetch', { url })
    expect(decisions).toEqual([{ kind: 'allow' }])
  })

  it('never asks when fetch approval is off or the url argument is missing', async () => {
    const off = await setup({ fetchAllowedDomains: [] })
    await off.call('web_fetch', { url: 'https://evil.test/?q=1' })
    const missing = await setup(fetchConfig)
    await missing.call('web_fetch', {})
    expect([...off.decisions, ...missing.decisions]).toEqual([{ kind: 'allow' }, { kind: 'allow' }])
  })

  it.each(['https://example.org', 'example.org/path', ''])('rejects the domain %j at load', async (domain) => {
    await expect(setup({ fetchAllowedDomains: [domain] })).rejects.toThrow('fetchAllowedDomains entries must be bare host names')
  })
})

describe('waterfall order', () => {
  it('keeps a downstream denial instead of asking', async () => {
    const root = fixture()
    const deny: PreToolDecision = { kind: 'deny', reason: 'blocked downstream' }
    const { decisions, call } = await setup({ sensitivePaths: [`${root}/secrets/**`] }, { downstream: deny })
    const result = await call('read', { file_path: join(root, 'secrets', 'id_rsa') })
    expect(decisions).toEqual([deny])
    expect(result.isError).toBe(true)
  })

  it('removes its listener when the plugin is disposed', async () => {
    const root = fixture()
    const { fiber, decisions, call } = await setup({ sensitivePaths: [`${root}/secrets/**`] })
    await fiber.dispose()
    await call('read', { file_path: join(root, 'secrets', 'id_rsa') })
    expect(decisions).toEqual([{ kind: 'allow' }])
  })
})

describe('loading', () => {
  it('exposes a function plugin the Loader keeps whole, with its Config schema', () => {
    const loader = Object.create(Loader.prototype) as Loader
    const unwrapped = loader.unwrapExports(policy) as Record<string, unknown>
    expect(unwrapped).toBe(policy)
    expect(unwrapped.name).toBe('sensitive-access-policy')
    expect(unwrapped.inject).toEqual(['tools'])
    expect(policy.Config({})).toEqual({ sensitivePaths: [], fetchApproval: 'never', fetchAllowedDomains: [], fetchPathLengthLimit: 80 })
  })
})
