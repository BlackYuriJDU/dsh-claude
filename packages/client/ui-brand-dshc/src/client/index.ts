/**
 * DSHC identity, browser half: stacks the Claude-app palette over the theme
 * service as one override layer and fills the sidebar and hero brand slots.
 * Light, dark, and system preferences keep working because every override
 * names both schemes.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import { DshcMark, DshcName } from './Brand.tsx'
import { DSHC_TOKEN_SOURCE, DSHC_TOKENS } from './tokens.ts'

export { burstSpokes, DSHC_WORDMARK, DshcMark, DshcName } from './Brand.tsx'
export {
  DSHC_CLAY,
  DSHC_CLAY_HOVER,
  DSHC_FONT_SANS,
  DSHC_FONT_SERIF,
  DSHC_TOKEN_SOURCE,
  DSHC_TOKENS,
} from './tokens.ts'

/** Required services: the slot registry and the theme registry. */
export const inject = ['slots', 'theme']

/**
 * Apply the DSHC palette and fill the brand slots. The palette layer and each
 * slot occupant are fiber effects, so unloading the plugin restores the base
 * palette and the shell's fallback brand.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.theme.overrideTokens(DSHC_TOKEN_SOURCE, DSHC_TOKENS), 'ui-brand-dshc: palette layer')
  ctx.slots.inject('sidebar.brand.mark', () =>
    ctx.slots.inject('sidebar.brand.name', function* () {
      yield ctx.slots.register({ name: 'sidebar.brand.mark' }, DshcMark)
      yield ctx.slots.register({ name: 'sidebar.brand.name' }, DshcName)
    }))
  ctx.slots.inject('conversation.hero.brand.mark', () =>
    ctx.slots.register({ name: 'conversation.hero.brand.mark' }, DshcMark))
}
