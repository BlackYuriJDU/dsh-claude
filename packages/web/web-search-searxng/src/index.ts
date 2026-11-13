/**
 * SearXNG-backed `WebSearchProvider` plugin. It contributes to the `ctx.web`
 * registry without owning the service and needs no API key.
 *
 * @module @deepseek-ai/dsh-web-search-searxng
 */

import type { Context, Volatile } from '@deepseek-ai/cordis'
import { launchEnvironmentOf } from '@deepseek-ai/dsh-launch-environment'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-web'
import { SEARXNG_DESCRIPTION, SEARXNG_PROVIDER_ID, SEARXNG_TITLE, SearxngSearchProvider } from './provider.ts'
import type { SearxngSafeSearch, SearxngSearchProviderOptions } from './provider.ts'

export type { SearxngSafeSearch, SearxngSearchProviderOptions } from './provider.ts'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'web-search-searxng'

/** The web seam this provider registers into. */
export const inject = ['web']

/**
 * Plugin config. Every field is live: Settings edits apply to the next search
 * without reloading the plugin.
 */
export interface Config {
  /** Instance base URL. Empty or unset falls back to `$SEARXNG_URL`; neither → provider unavailable. */
  baseURL: Volatile<string | undefined>
  /** Search language sent as `language` (for example `pt-BR`). Unset = instance default. */
  language: Volatile<string | undefined>
  /** Comma-separated SearXNG categories (for example `general,news`). Unset = instance default. */
  categories: Volatile<string | undefined>
  /** SafeSearch level: 0 off, 1 moderate, 2 strict. Unset = instance default. */
  safeSearch: Volatile<SearxngSafeSearch | undefined>
}

export const Config = z.object({
  baseURL: z.string().volatile(),
  language: z.string().volatile(),
  categories: z.string().volatile(),
  safeSearch: z.union([0, 1, 2] as const).volatile(),
})

/**
 * Register the SearXNG search provider with `ctx.web`. Options resolve from
 * the live Config, then `$SEARXNG_URL`, on every availability check and search.
 * @param ctx - the plugin context carrying the `web` service.
 * @param config - the validated plugin config.
 */
export function apply(ctx: Context, config: Config): void {
  const options = (): SearxngSearchProviderOptions => {
    const language = config.language.get()
    const categories = config.categories.get()
    const safeSearch = config.safeSearch.get()
    return {
      baseURL: config.baseURL.get() || (launchEnvironmentOf(ctx).get('SEARXNG_URL')?.value ?? ''),
      ...language !== undefined ? { language } : {},
      ...categories !== undefined ? { categories } : {},
      ...safeSearch !== undefined ? { safeSearch } : {},
    }
  }
  ctx.web.registerSearchProvider({
    id: SEARXNG_PROVIDER_ID,
    title: SEARXNG_TITLE,
    description: SEARXNG_DESCRIPTION,
    available: () => new SearxngSearchProvider(options()).available(),
    search: (request, signal) => new SearxngSearchProvider(options()).search(request, signal),
  })
}
