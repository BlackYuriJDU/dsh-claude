/**
 * Message feedback surface plugin, node half: declares the log-sharing
 * notice policy the browser half reads; the browser half ships via
 * exports["./client"], discovered through the package.json dsh.client
 * declaration.
 */
import type {} from '@deepseek-ai/dsh-settings'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'

/** Feedback dialog policy projected to the browser. */
export interface Config {
  /**
   * Whether a composed exporter sends the conversation log with submitted
   * feedback. The dialog states that the submission includes the log when
   * true, and that feedback stays in the local conversation log when false.
   */
  sharesConversationLog?: boolean
}

/** Feedback dialog policy; the default matches the shipped feedback export. */
export const Config = z.object({
  sharesConversationLog: z.boolean().default(true),
})

/**
 * Hide the generated settings page; the policy is a composition fact, not a user preference.
 * @param ctx - plugin context used for optional settings presentation.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (child) => { child.effect(() => child.settings.configure({ auto: false }, ctx.fiber)) })
}
