/**
 * Enforce the license policy on the whole installed dependency closure, which
 * `gen-third-party-notices` checks only for direct declarations. Runtime
 * packages must carry a permissive license (`isPermissive`) or match a named
 * exception with its reason; development-only packages may also use MPL-2.0.
 * GPL and AGPL (not LGPL) without a permissive alternative, and tldraw, are
 * refused even where an exception would match, and an exception that matches no installed package fails, so
 * the list cannot outlive its subject.
 * @module scripts/verify-dependency-licenses
 */

import { execFileSync } from 'node:child_process'
import { matchesGlob, resolve } from 'node:path'
import { isPermissive } from './gen-third-party-notices.ts'

const ROOT = resolve(import.meta.dirname, '..')

/** One installed package as `pnpm licenses list --json` reports it. */
export interface LicensedPackage {
  readonly name: string
  readonly license: string
}

/** Where a package is installed for: shipped runtime code or development tooling only. */
export type LicenseScope = 'runtime' | 'development'

/** A reviewed package whose license falls outside the default policy. */
export interface LicenseException {
  /** `node:path` glob over the package name, covering platform variants. */
  readonly pattern: string
  /** The widest scope the exception covers; `runtime` also covers development. */
  readonly scope: LicenseScope
  /** Why the terms are acceptable as used. */
  readonly reason: string
}

/** Reviewed exceptions (decision D14 in docs/dshc/PLANO-V3.md). */
export const LICENSE_EXCEPTIONS: readonly LicenseException[] = [
  { pattern: '@anthropic-ai/claude-agent-sdk*', scope: 'runtime', reason: 'Anthropic commercial terms, owner-authorized runtime of subagent-claude-code (gen-third-party-notices isOwnerAuthorizedRuntime)' },
  { pattern: '@deepseek-ai/libreoffice-kit*', scope: 'runtime', reason: 'MPL-2.0 file-level copyleft, shipped unmodified as the Office runtime' },
  { pattern: '@ubjs/*', scope: 'runtime', reason: 'MPL-2.0 file-level copyleft, used unmodified' },
  { pattern: 'lightningcss*', scope: 'runtime', reason: 'MPL-2.0 file-level copyleft CSS transformer, used unmodified' },
  { pattern: '@img/sharp-libvips-*', scope: 'runtime', reason: 'LGPL-3.0 libvips, a prebuilt shared library sharp loads dynamically and ships unmodified' },
  { pattern: '@trycua/cua-driver-*', scope: 'runtime', reason: 'MIT AND MPL-2.0 driver binary, shipped unmodified' },
  { pattern: '@csstools/*', scope: 'development', reason: 'MIT-0 (MIT No Attribution), more permissive than MIT' },
  { pattern: 'eslint-plugin-sonarjs', scope: 'development', reason: 'LGPL-3.0 lint rules run only as tooling' },
  { pattern: 'caniuse-lite', scope: 'development', reason: 'CC-BY-4.0 browser-support data used by build tooling' },
  { pattern: 'spdx-exceptions', scope: 'development', reason: 'CC-BY-3.0 license-identifier data used by tooling' },
  { pattern: 'truncate-utf8-bytes', scope: 'development', reason: 'WTFPL, a permissive license outside the SPDX list the policy names' },
  { pattern: '@modelcontextprotocol/server-*', scope: 'development', reason: 'MIT / Apache-2.0 test servers whose manifest says SEE LICENSE (gen-third-party-notices OVERRIDES)' },
  { pattern: 'buffers', scope: 'development', reason: 'no license metadata; a development-only transitive dependency that is not distributed' },
  { pattern: 'khroma', scope: 'development', reason: 'MIT license file without a manifest license field' },
  { pattern: 'union', scope: 'development', reason: 'MIT license file without a manifest license field' },
]

/** Licenses refused at any scope. */
const REFUSED_LICENSE = /\bA?GPL-/u
/** Packages refused at any scope. */
const REFUSED_PACKAGES = ['tldraw', '@tldraw/*']

/**
 * Check both closures against the policy.
 * @param runtime - packages installed for shipped runtime code.
 * @param development - packages installed for development only.
 * @param exceptions - reviewed exceptions.
 * @returns one line per violation; empty when the closure complies.
 */
export function inspectDependencyLicenses(
  runtime: readonly LicensedPackage[],
  development: readonly LicensedPackage[],
  exceptions: readonly LicenseException[] = LICENSE_EXCEPTIONS,
): string[] {
  const failures: string[] = []
  const used = new Set<LicenseException>()
  const runtimeNames = new Set(runtime.map(pkg => pkg.name))
  const check = (pkg: LicensedPackage, scope: LicenseScope): void => {
    if (REFUSED_PACKAGES.some(pattern => matchesGlob(pkg.name, pattern))) {
      failures.push(`${pkg.name} (${pkg.license}): refused package`)
      return
    }
    // A choice with a permissive alternative passes: the consumer takes that alternative.
    if (isPermissive(pkg.license)) return
    if (REFUSED_LICENSE.test(pkg.license.replaceAll(/\bLGPL-/gu, ''))) {
      failures.push(`${pkg.name} (${pkg.license}): refused license`)
      return
    }
    if (scope === 'development' && pkg.license === 'MPL-2.0') return
    const exception = exceptions.find(entry => matchesGlob(pkg.name, entry.pattern) && (entry.scope === 'runtime' || scope === 'development'))
    if (exception === undefined) {
      failures.push(`${pkg.name} (${pkg.license}): ${scope} license outside the policy; review the terms and add a reasoned exception`)
      return
    }
    used.add(exception)
  }
  for (const pkg of runtime) check(pkg, 'runtime')
  for (const pkg of development) if (!runtimeNames.has(pkg.name)) check(pkg, 'development')
  for (const exception of exceptions) {
    if (!used.has(exception)) failures.push(`exception ${exception.pattern} matches no installed package that needs it; remove it`)
  }
  return failures
}

/**
 * Flatten `pnpm licenses list --json` output.
 * @param json - the command's standard output.
 * @returns every listed package with its license.
 */
export function parseLicenseListing(json: string): LicensedPackage[] {
  const listing = JSON.parse(json) as Record<string, readonly { name: string }[]>
  return Object.entries(listing).flatMap(([license, packages]) => packages.map(pkg => ({ name: pkg.name, license })))
}

function listInstalled(flag: '--prod' | '--dev'): LicensedPackage[] {
  const output = execFileSync('pnpm', ['-r', 'licenses', 'list', '--json', flag], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return parseLicenseListing(output)
}

if (process.argv[1] !== undefined && import.meta.filename === resolve(process.argv[1])) {
  const runtime = listInstalled('--prod')
  const development = listInstalled('--dev')
  const failures = inspectDependencyLicenses(runtime, development)
  if (failures.length > 0) {
    process.stderr.write('verify-dependency-licenses: violations found:\n')
    for (const failure of failures) process.stderr.write(`  ${failure}\n`)
    process.exitCode = 1
  } else {
    process.stdout.write(`verify-dependency-licenses: ${String(runtime.length)} runtime and ${String(development.length)} development package(s) comply.\n`)
  }
}
