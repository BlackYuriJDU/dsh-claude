/**
 * Internal platform-profile builders for the local sandbox provider.
 *
 * @module @deepseek-ai/dsh-sandbox-local/profiles
 */

import { grantArgs as landlockGrantArgs } from '@deepseek-ai/node-addon-system/landlock-run'
import { workspaceWritableRoots, writableRoots } from '@deepseek-ai/dsh-sandbox'
import type { SandboxPolicy } from '@deepseek-ai/dsh-sandbox'

/** One existing path the confined command must not read, resolved at confinement time. */
export interface DeniedReadPath {
  /** Canonical absolute path. */
  readonly path: string
  /** A directory hides its whole subtree; a file hides only itself. */
  readonly kind: 'directory' | 'file'
}

/**
 * Deployment restrictions layered on every policy: paths hidden from reads and
 * whether the confined command keeps network access.
 */
export interface ConfinementRestrictions {
  /** Existing paths to hide, already resolved and deduplicated. */
  readonly denyRead: readonly DeniedReadPath[]
  /** `off` removes network access from the confined command. */
  readonly network: 'on' | 'off'
}

/** No deployment restriction: the profiles express the policy alone. */
export const NO_RESTRICTIONS: ConfinementRestrictions = { denyRead: [], network: 'on' }

/**
 * Whether `restrictions` asks for anything beyond the policy.
 * @param restrictions - the deployment restrictions.
 * @returns true when a path is hidden or the network is off.
 */
export function hasRestrictions(restrictions: ConfinementRestrictions): boolean {
  return restrictions.denyRead.length > 0 || restrictions.network === 'off'
}

/**
 * Build the bwrap profile arguments for one file-effect policy. Hidden paths
 * mount after the writable binds so they also cover paths inside a writable
 * root: an empty read-only tmpfs over a directory, `/dev/null` over a file.
 * @param policy - file-effect policy to express as bwrap mounts.
 * @param restrictions - deployment read and network restrictions.
 * @returns profile arguments before the trailing separator and command argv.
 */
export function bwrapProfileArgs(policy: SandboxPolicy, restrictions: ConfinementRestrictions): string[] {
  const args = ['--ro-bind', '/', '/', '--dev', '/dev', '--unshare-pid', '--proc', '/proc', '--die-with-parent']
  if (restrictions.network === 'off') args.push('--unshare-net')
  if (policy.mode === 'workspace-write') {
    args.push('--tmpfs', '/tmp')
    for (const root of workspaceWritableRoots(policy)) args.push('--bind', root, root)
  }
  for (const denied of restrictions.denyRead) {
    if (denied.kind === 'directory') args.push('--tmpfs', denied.path, '--remount-ro', denied.path)
    else args.push('--ro-bind', '/dev/null', denied.path)
  }
  return args
}

/**
 * Build the Landlock launcher grants for one file-effect policy.
 * @param policy - file-effect policy to express as Landlock allow-list grants.
 * @returns launcher grant arguments before the trailing separator and command argv.
 */
export function landlockProfileArgs(policy: SandboxPolicy): string[] {
  const readWrite = ['/dev/null']
  if (policy.mode === 'workspace-write') {
    readWrite.push('/tmp', ...workspaceWritableRoots(policy))
  }
  return landlockGrantArgs({ readOnly: ['/'], readWrite })
}

/** Quote one path as an SBPL string literal. */
function sbplString(path: string): string {
  return `"${path.replaceAll('\\', String.raw`\\`).replaceAll('"', String.raw`\"`)}"`
}

/**
 * Build the sandbox-exec arguments and SBPL profile for one policy. The
 * workspace-owned writable roots (workspace plus explicit extra directories)
 * come from the shared {@link writableRoots} helper (canonical, deduplicated)
 * so the Seatbelt grant and the in-process fs fence
 * (`@deepseek-ai/dsh-fs-sandbox`) can never drift apart; the helper adds the
 * documented Seatbelt temp areas.
 * Hidden paths and the network denial come last, so they override the
 * earlier allows.
 * @param policy - file-effect policy to express as an SBPL profile.
 * @param restrictions - deployment read and network restrictions.
 * @returns sandbox-exec arguments before the trailing separator and command argv.
 */
export function seatbeltProfileArgs(policy: SandboxPolicy, restrictions: ConfinementRestrictions): string[] {
  const forms = ['(version 1)', '(allow default)', '(deny file-write*)', `(allow file-write* (literal ${sbplString('/dev/null')}))`]
  const roots = writableRoots(policy)
  if (roots.length > 0) {
    forms.push(`(allow file-write* ${roots.map(root => `(subpath ${sbplString(root)})`).join(' ')})`)
  }
  if (restrictions.denyRead.length > 0) {
    const filters = restrictions.denyRead.map(denied => `(${denied.kind === 'directory' ? 'subpath' : 'literal'} ${sbplString(denied.path)})`)
    forms.push(`(deny file-read* ${filters.join(' ')})`)
  }
  if (restrictions.network === 'off') forms.push('(deny network*)')
  return ['-p', forms.join(' ')]
}
