/**
 * SearXNG-backed `WebSearchProvider` plugin. It contributes to the `ctx.web`
 * registry without owning the service and needs no API key.
 *
 * @module @deepseek-ai/dsh-web-search-searxng
 */

import type { Context } from '@deepseek-ai/cordis'
import { launchEnvironmentOf } from '@deepseek-ai/dsh-launch-environment'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-web'
import { SearxngSearchProvider } from './provider.ts'
import type { SearxngSafeSearch } from './provider.ts'

export {
  mapSearxngResponse,
  mapSearxngResult,
  SEARXNG_PROVIDER_ID,
  SearxngSearchProvider,
  searxngSearchUrl,
} from './provider.ts'
export type { SearxngSafeSearch, SearxngSearchProviderOptions } from './provider.ts'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'web-search-searxng'

/** The web seam this provider registers into. */
export const inject = ['web']

/** Plugin config (all optional — `apply` fills the environment fallback). */
export interface Config {
  /** Instance base URL. Falls back to `$SEARXNG_URL`. Empty → provider unavailable. */
  baseURL?: string
  /** Search language sent as `language` (for example `pt-BR`). Omitted = instance default. */
  language?: string
  /** Comma-separated SearXNG categories (for example `general,news`). Omitted = instance default. */
  categories?: string
  /** SafeSearch level: 0 off, 1 moderate, 2 strict. Omitted = instance default. */
  safeSearch?: SearxngSafeSearch
}

export const Config: z<Config> = z.object({
  baseURL: z.string(),
  language: z.string(),
  categories: z.string(),
  safeSearch: z.union([0, 1, 2] as const),
})

/**
 * Register the SearXNG search provider with `ctx.web`.
 * @param ctx - the plugin context carrying the `web` service.
 * @param config - the validated plugin config.
 */
export function apply(ctx: Context, config: Config): void {
  ctx.web.registerSearchProvider(new SearxngSearchProvider({
    baseURL: config.baseURL ?? launchEnvironmentOf(ctx).get('SEARXNG_URL')?.value ?? '',
    ...config.language !== undefined ? { language: config.language } : {},
    ...config.categories !== undefined ? { categories: config.categories } : {},
    ...config.safeSearch !== undefined ? { safeSearch: config.safeSearch } : {},
  }))
}
