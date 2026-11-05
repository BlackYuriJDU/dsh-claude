/**
 * DSHC identity, browser half: stacks the Claude-app palette over the theme
 * service as one override layer and fills the sidebar and hero brand slots,
 * including a part-of-day greeting as the hero headline.
 * Light, dark, and system preferences keep working because every override
 * names both schemes.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { DSHC_WORDMARK, DshcMark, DshcName } from './Brand.tsx'
import { DshcGreeting } from './Greeting.tsx'
import { de, en, es, fr, ja, pt, ru, zh, type BrandDshcKey } from './locales.ts'
import { DSHC_TOKEN_SOURCE, DSHC_TOKENS } from './tokens.ts'

export { burstSpokes, DSHC_WORDMARK, DshcMark, DshcName } from './Brand.tsx'
export { DshcGreeting, greetingKey } from './Greeting.tsx'
export type { DshcGreetingProps } from './Greeting.tsx'
export type { BrandDshcKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The DSHC hero greeting. */
    'brand.dshc': BrandDshcKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'brand.dshc'
export {
  DSHC_CLAY,
  DSHC_CLAY_HOVER,
  DSHC_FONT_SANS,
  DSHC_FONT_SERIF,
  DSHC_TOKEN_SOURCE,
  DSHC_TOKENS,
} from './tokens.ts'

/** Required services: the slot registry, the theme registry, and the locale registry. */
export const inject = ['slots', 'theme', 'locale']

/**
 * Apply the DSHC palette, register the greeting dictionaries and the product
 * name that interface copy shows, and fill the brand slots. The palette
 * layer, the dictionaries, the product name, and each
 * slot occupant are fiber effects, so unloading the plugin restores the base
 * palette and the shell's fallback brand.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.theme.overrideTokens(DSHC_TOKEN_SOURCE, DSHC_TOKENS), 'ui-brand-dshc: palette layer')
  ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }), 'ui-brand-dshc: dictionaries')
  ctx.effect(() => ctx.locale.registerProductName(DSHC_WORDMARK), 'ui-brand-dshc: product name')
  ctx.slots.inject('sidebar.brand.mark', () =>
    ctx.slots.inject('sidebar.brand.name', function* () {
      yield ctx.slots.register({ name: 'sidebar.brand.mark' }, DshcMark)
      yield ctx.slots.register({ name: 'sidebar.brand.name' }, DshcName)
    }))
  ctx.slots.inject('conversation.hero.brand.mark', () =>
    ctx.slots.inject('conversation.hero.headline', function* () {
      yield ctx.slots.register({ name: 'conversation.hero.brand.mark' }, DshcMark)
      yield ctx.slots.register({ name: 'conversation.hero.headline', locale: NS }, DshcGreeting)
    }))
}
