/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-client-ui-handoff`.
 * @module @deepseek-ai/dsh-client-ui-handoff/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-client-ui-handoff'

/** Cordis companion plugin name. */
export const name = 'client-ui-handoff-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the Artifacts modal is a pure read of the session's
 * deliverables turn data plus the Host file opener; slot conflicts fail loud
 * in the slot core.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
