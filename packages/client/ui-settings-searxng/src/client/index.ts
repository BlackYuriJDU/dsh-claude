/**
 * The SearXNG search provider's settings page, browser half: instance URL,
 * language, categories, and SafeSearch over the `web-search-searxng`
 * namespace. The page registers into the Plugins page's `plugins.item` slot
 * while the Host serves that namespace, so a deployment without the provider
 * shows no trace of it.
 */

// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: the ctx.configForms Context merge.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: the Plugins page's SlotMap merge (the 'plugins.item' entry).
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { SearxngCard } from './SearxngCard.tsx'
import { SEARXNG_NS, SearxngCardController } from './searxng-card-controller.ts'
import { en, ja, es, fr, de, ru, pt, zh, type SearxngSettingsLocaleKey } from './locales.ts'

export type { SearxngCardProps } from './SearxngCard.tsx'
export type { SearxngCardFace, SearxngCardState, SearxngSettings } from './searxng-card-controller.ts'
export type { SearxngSettingsLocaleKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** SearXNG settings page copy. */
    'settings.searxng': SearxngSettingsLocaleKey
  }
}

/** Dictionary namespace owned by this plugin. */
export const NS = 'settings.searxng'

/** Required services (cordis fiber inject). */
export const inject = ['slots', 'locale', 'configForms']

/**
 * Mount the SearXNG settings page, after the Web search and fetch page, while the Host serves its namespace.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }), 'ui-settings-searxng: dictionaries')
  const card = new SearxngCardController(ctx.configForms.get(SEARXNG_NS))
  ctx.effect(() => () => { card.dispose() }, 'ui-settings-searxng: form subscription')
  ctx.effect(() => ctx.configForms.whileServed([SEARXNG_NS], () => ctx.slots.inject('plugins.item', () => ctx.slots.register({
    name: 'plugins.item', id: 'searxng', order: 25, label: () => t('title'), locale: NS, inject: () => card.inject(),
  }, SearxngCard))), 'ui-settings-searxng: page')
}
