/**
 * Sensitive-access policy: a `tools/pre-execute` listener that asks the user
 * before a filesystem tool reads a protected path or `web_fetch` sends data in
 * its address to a site outside the allowed list. It runs after every later
 * listener has allowed the call, so a denial or cancellation downstream still
 * wins, and it applies to calls nested in a code run as well.
 *
 * @module @deepseek-ai/dsh-sensitive-access-policy
 */

import { realpath } from 'node:fs/promises'
import { homedir } from 'node:os'
import { isAbsolute, join, matchesGlob, normalize, resolve } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type { PreToolDecision, ToolExecution } from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-working-directory'
import { fetchWithDataPrompt, protectedPathPrompt } from './locales.ts'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'sensitive-access-policy'

/** The tool registry whose `tools/pre-execute` waterfall this plugin joins. */
export const inject = ['tools']

/** When `web_fetch` asks for approval. */
export type FetchApproval = 'never' | 'with-data'

/** Plugin config. Every field defaults to no restriction. */
export interface Config {
  /**
   * Glob patterns (`node:path` `matchesGlob` syntax) for paths that `read`,
   * `read_image`, `grep`, and `glob` may reach only with approval. A pattern is
   * absolute, starts with `~/` for the Host account's home, or starts with
   * `**` to match at any depth; anything else fails at load.
   */
  sensitivePaths?: string[]
  /** `with-data` asks before a `web_fetch` whose address carries data to a site outside {@link fetchAllowedDomains}. */
  fetchApproval?: FetchApproval
  /** Domains `web_fetch` reaches without approval; each also covers its subdomains. */
  fetchAllowedDomains?: string[]
  /** Address paths longer than this many characters count as carrying data. */
  fetchPathLengthLimit?: number
}

/** Plugin config schema. */
export const Config: z<Config> = z.object({
  sensitivePaths: z.array(z.string()).default([]),
  fetchApproval: z.union([z.const('never'), z.const('with-data')]).default('never'),
  fetchAllowedDomains: z.array(z.string()).default([]),
  fetchPathLengthLimit: z.natural().default(80),
})

/** The path argument each guarded filesystem tool reads. */
const PATH_ARGUMENTS: Readonly<Record<string, string>> = {
  read: 'file_path',
  read_image: 'file_path',
  grep: 'path',
  glob: 'path',
}

/** Tools whose path names a directory tree they read beneath. */
const TREE_TOOLS: ReadonlySet<string> = new Set(['grep', 'glob'])

/**
 * Expand a leading `~` against the Host account's home directory.
 * @param path - a configured pattern or a tool path argument.
 * @returns the path with `~` and `~/…` expanded.
 */
function expandHome(path: string): string {
  if (path === '~') return homedir()
  return path.startsWith('~/') ? join(homedir(), path.slice(2)) : path
}

/**
 * Read one argument of a call whose arguments the tool has not validated yet.
 * @param exec - the pending call.
 * @param key - the argument name.
 * @returns the argument when it is a string, else undefined.
 */
function stringArgument(exec: ToolExecution, key: string): string | undefined {
  const value: unknown = typeof exec.arguments === 'object' && exec.arguments !== null
    ? (exec.arguments as Record<string, unknown>)[key]
    : undefined
  return typeof value === 'string' ? value : undefined
}

/**
 * Validate and expand one `sensitivePaths` pattern.
 * @param pattern - the configured pattern.
 * @returns the pattern matched against absolute paths.
 */
function sensitivePattern(pattern: string): string {
  const expanded = expandHome(pattern)
  if (!isAbsolute(expanded) && !expanded.startsWith('**')) {
    throw new Error(`sensitive-access-policy: sensitivePaths entries must be absolute, start with ~/, or start with **, got ${JSON.stringify(pattern)}`)
  }
  return expanded
}

/**
 * Validate and normalize one `fetchAllowedDomains` entry.
 * @param domain - the configured domain.
 * @returns the lowercase host name.
 */
function allowedDomain(domain: string): string {
  const host = domain.trim().toLowerCase()
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*$/u.test(host)) {
    throw new Error(`sensitive-access-policy: fetchAllowedDomains entries must be bare host names, got ${JSON.stringify(domain)}`)
  }
  return host
}

/**
 * Register the policy. Configuration is validated here, so a malformed
 * pattern or domain fails the plugin at load.
 * @param ctx - the plugin context.
 * @param config - the validated config.
 */
export function apply(ctx: Context, config: Config): void {
  const patterns = (config.sensitivePaths as string[]).map(sensitivePattern)
  const fetchApproval = config.fetchApproval as FetchApproval
  const allowedDomains = (config.fetchAllowedDomains as string[]).map(allowedDomain)
  const pathLengthLimit = config.fetchPathLengthLimit as number

  const matches = (path: string, tree: boolean): boolean =>
    patterns.some(pattern => matchesGlob(path, pattern) || (tree && matchesGlob(join(path, 'x'), pattern)))

  /** The protected path a filesystem call reaches, if any. */
  async function protectedPath(exec: ToolExecution): Promise<string | undefined> {
    const key = PATH_ARGUMENTS[exec.name]
    if (key === undefined || patterns.length === 0) return undefined
    const raw = stringArgument(exec, key)
    // An absent path searches the Session directory, which is not itself protected.
    if (raw === undefined || raw.trim().length === 0) return undefined
    let path = expandHome(raw)
    if (!isAbsolute(path)) {
      const workingDirectory = ctx.get('workingDirectory')
      if (exec.agent !== undefined && workingDirectory !== undefined) {
        path = resolve(await workingDirectory.ensure(exec.agent, exec.signal), path)
      }
    }
    path = normalize(path)
    const tree = TREE_TOOLS.has(exec.name)
    if (matches(path, tree)) return path
    const real = await realpath(path).catch((error: unknown) => {
      // A path that cannot be resolved is judged by its name alone; the tool reports the failure.
      void error
      return undefined
    })
    return real !== undefined && matches(real, tree) ? real : undefined
  }

  /** The destination host of a fetch that needs approval, if any. */
  function fetchHostNeedingApproval(exec: ToolExecution): string | undefined {
    if (exec.name !== 'web_fetch' || fetchApproval === 'never') return undefined
    const raw = stringArgument(exec, 'url')
    if (raw === undefined || !URL.canParse(raw)) return undefined
    const url = new URL(raw)
    const host = url.hostname.toLowerCase()
    if (allowedDomains.some(domain => host === domain || host.endsWith(`.${domain}`))) return undefined
    const carriesData = url.search.length > 1 || url.hash.length > 1 || url.username !== '' || url.password !== ''
      || url.pathname.length > pathLengthLimit
    return carriesData ? host : undefined
  }

  ctx.on('tools/pre-execute', async (exec, next): Promise<PreToolDecision> => {
    const downstream = await next()
    if (downstream.kind !== 'allow') return downstream
    const path = await protectedPath(exec)
    if (path !== undefined) {
      return {
        kind: 'ask',
        reason: `reading ${path} requires approval because the path is protected`,
        displayReason: protectedPathPrompt(path),
      }
    }
    const host = fetchHostNeedingApproval(exec)
    if (host !== undefined) {
      return {
        kind: 'ask',
        reason: `fetching ${host} with data in the address requires approval because the site is not on the allowed list`,
        displayReason: fetchWithDataPrompt(host),
      }
    }
    return downstream
  })
}
