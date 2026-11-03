/**
 * `SearxngSearchProvider`: a `WebSearchProvider` backed by a SearXNG instance
 * (`GET {baseURL}/search?format=json`). SearXNG is a self-hostable metasearch
 * engine that needs no API key. The provider maps each result's `content`
 * excerpt to `snippet`, maps `publishedDate` to `publishedAt`, drops entries
 * without a URL or excerpt, and omits `content` because SearXNG returns no
 * generated answer.
 * @module @deepseek-ai/dsh-web-search-searxng/provider
 */

import { WebError } from '@deepseek-ai/dsh-web'
import type {
  WebSearchProvider,
  WebSearchRequest,
  WebSearchResult,
  WebSearchSource,
} from '@deepseek-ai/dsh-web'
import type { SearxngResult, SearxngSearchResponse } from './types.ts'

/** Stable id this provider registers under. */
export const SEARXNG_PROVIDER_ID = 'searxng'

/** SafeSearch levels SearXNG accepts: off, moderate, strict. */
export type SearxngSafeSearch = 0 | 1 | 2

/** Attribution header sent on every request. */
const USER_AGENT = 'deepseek-harness-searxng'

/** Resolved provider options (the plugin's `apply` supplies the environment fallback). */
export interface SearxngSearchProviderOptions {
  /** Instance base URL; `/search` is appended. Empty or unparseable makes the provider unavailable. */
  baseURL: string
  /** Search language sent as `language` (for example `pt-BR`); omitted lets the instance decide. */
  language?: string
  /** Comma-separated SearXNG categories sent as `categories`; omitted uses the instance default. */
  categories?: string
  /** SafeSearch level sent as `safesearch`; omitted uses the instance default. */
  safeSearch?: SearxngSafeSearch
}

/**
 * Map one SearXNG result to a normalized source, or `undefined` when it has no
 * http(s) URL or no non-blank excerpt to serve as a portable snippet.
 *
 * @param result - one entry of SearXNG's `results[]`.
 * @returns the normalized source, or `undefined` when the entry cannot be cited.
 */
export function mapSearxngResult(result: SearxngResult): WebSearchSource | undefined {
  if (typeof result.url !== 'string' || !/^https?:\/\//i.test(result.url)) return undefined
  const snippet = typeof result.content === 'string' ? result.content.trim() : ''
  if (snippet.length === 0) return undefined
  const title = typeof result.title === 'string' ? result.title.trim() : ''
  const publishedAt = typeof result.publishedDate === 'string' ? result.publishedDate : ''
  return {
    url: result.url,
    ...title.length > 0 ? { title } : {},
    snippet,
    ...publishedAt.length > 0 ? { publishedAt } : {},
  }
}

/**
 * Map a SearXNG response envelope to a normalized search result.
 *
 * @param response - the parsed `GET /search?format=json` response body.
 * @returns the normalized result; uncitable entries are dropped
 *   ({@link mapSearxngResult}) and duplicate URLs keep their first occurrence.
 */
export function mapSearxngResponse(response: SearxngSearchResponse): WebSearchResult {
  const seen = new Set<string>()
  const sources: WebSearchSource[] = []
  for (const entry of Array.isArray(response.results) ? response.results : []) {
    const source = mapSearxngResult(entry)
    if (source === undefined || seen.has(source.url)) continue
    seen.add(source.url)
    sources.push(source)
  }
  // The web service owns the final `maxResults` truncation, so this provider
  // reports `truncated: false`.
  return { sources, truncated: false }
}

/**
 * Build the search URL for one request.
 *
 * @param options - the resolved provider options.
 * @param query - the search query.
 * @returns the absolute `GET` URL with `format=json` and the configured filters.
 */
export function searxngSearchUrl(options: SearxngSearchProviderOptions, query: string): string {
  const url = new URL('search', options.baseURL.endsWith('/') ? options.baseURL : `${options.baseURL}/`)
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  if (options.language !== undefined && options.language.length > 0) url.searchParams.set('language', options.language)
  if (options.categories !== undefined && options.categories.length > 0) url.searchParams.set('categories', options.categories)
  if (options.safeSearch !== undefined) url.searchParams.set('safesearch', String(options.safeSearch))
  return url.toString()
}

/** The SearXNG-backed search provider; HTTP redirects fail as `WEB_PROVIDER_ERROR`. */
export class SearxngSearchProvider implements WebSearchProvider {
  readonly id = SEARXNG_PROVIDER_ID

  constructor(private readonly options: SearxngSearchProviderOptions) {}

  available(): boolean {
    return isHttpUrl(this.options.baseURL)
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    let response: Response
    try {
      response = await fetch(searxngSearchUrl(this.options, request.query), {
        method: 'GET',
        redirect: 'error',
        headers: { 'accept': 'application/json', 'user-agent': USER_AGENT },
        ...signal !== undefined ? { signal } : {},
      })
    } catch (error: unknown) {
      if (isAbortError(error)) throw new WebError('SearXNG search aborted', 'WEB_ABORTED', { cause: error })
      throw new WebError(`SearXNG search request failed: ${String(error)}`, 'WEB_PROVIDER_ERROR', { cause: error })
    }

    if (!response.ok) {
      // 403 is SearXNG's answer when the instance does not enable the JSON format.
      const hint = response.status === 403 ? '; enable `json` under `search.formats` in the instance settings' : ''
      throw new WebError(`SearXNG API error (HTTP ${String(response.status)})${hint}`, 'WEB_PROVIDER_ERROR')
    }

    try {
      const payload = await response.json() as SearxngSearchResponse
      return mapSearxngResponse(payload)
    } catch (error: unknown) {
      if (isAbortError(error)) throw new WebError('SearXNG search aborted', 'WEB_ABORTED', { cause: error })
      throw new WebError(`SearXNG returned an unprocessable response body: ${String(error)}`, 'WEB_PROVIDER_ERROR', { cause: error })
    }
  }
}

/** True when `baseURL` parses as an absolute http(s) URL (a cheap local config check). */
function isHttpUrl(baseURL: string): boolean {
  if (!URL.canParse(baseURL)) return false
  const protocol = new URL(baseURL).protocol
  return protocol === 'http:' || protocol === 'https:'
}

/** True for a fetch/`AbortSignal` abort, surfaced as `WEB_ABORTED`. */
function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
