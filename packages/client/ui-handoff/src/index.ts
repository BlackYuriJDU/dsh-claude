/**
 * Hand off plugin, node half. The Hand off surface is browser-only (the
 * Artifacts modal reads the session's deliverables turn data and opens files
 * through the Host); the browser half ships via `exports["./client"]`,
 * discovered through the package.json `dsh.client` declaration. There is no
 * Host-side prompt section or service: the deliverables vocabulary already
 * reaches the model through `ui-deliverables`'s file-reference guidance.
 *
 * @module @deepseek-ai/dsh-client-ui-handoff
 */

import type { Context } from '@deepseek-ai/cordis'

/** Stable Cordis plugin name. */
export const name = 'ui-handoff'

/**
 * Node-half apply: intentionally a no-op. The Hand off feature lives entirely
 * in the browser (it reads the client conversation snapshot); nothing here
 * reaches a model request or a Host registry.
 * @param _ctx - host context (unused).
 */
export function apply(_ctx: Context): void {}
