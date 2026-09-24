/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-client-ui-routines`.
 * @module @deepseek-ai/dsh-client-ui-routines/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-client-ui-routines'

/** Cordis companion plugin name. */
export const name = 'client-ui-routines-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the scheduler's durable section is validated by the
 * settings seam, and the Agent-creation path is covered by the agent-loop's
 * own invariants. The interval math and fire-once behavior are covered by
 * unit tests rather than a Cordis runtime relationship.
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
