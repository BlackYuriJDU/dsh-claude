/**
 * Agent-preset surface plugin, node half: declares how the new-session seat
 * presents the roster; the browser half ships through exports["./client"],
 * discovered from the package.json dsh.client declaration.
 */
import type {} from '@deepseek-ai/dsh-settings'
import type { Context, Volatile } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'

/** New-session seat presentation. */
export type SeatPresentation = 'menu' | 'segmented'

/** Picker policy fields the browser reads. */
export interface SeatPolicy {
  seatPresentation?: SeatPresentation
  seatHiddenPresets?: readonly string[]
}

/** New-session picker policy projected to the browser. */
export interface Config {
  /**
   * `menu` shows the chosen preset with a menu of the others; `segmented`
   * shows every visible preset side by side. Volatile because only live
   * fields are projected to the browser.
   */
  seatPresentation: Volatile<SeatPresentation>
  /**
   * Preset ids the new-session picker leaves out unless one is the staged
   * choice; other entry points can still stage them.
   */
  seatHiddenPresets: Volatile<readonly string[]>
}

/** Picker policy; the defaults are the upstream menu with every preset. */
export const Config = z.object({
  seatPresentation: z.union(['menu', 'segmented'] as const).default('menu').volatile(),
  seatHiddenPresets: z.array(z.string()).default([]).volatile(),
})

/**
 * Hide the generated settings page; the presentation is a composition choice.
 * @param ctx - plugin context used for optional settings presentation.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (child) => { child.effect(() => child.settings.configure({ auto: false }, ctx.fiber)) })
}
