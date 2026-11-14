/**
 * Wire types for the SearXNG search API (`GET {base}/search?format=json`).
 * Types only — no runtime code. The instance must enable the `json` format in
 * its `search.formats` setting; otherwise it answers `403`. Each result carries
 * a URL, an optional title, an optional `content` excerpt, and an optional
 * `publishedDate`.
 *
 * @module @deepseek-ai/dsh-web-search-searxng/types
 */

/** One entry of SearXNG's `results[]`. */
export interface SearxngResult {
  url: string
  title?: string | null
  content?: string | null
  publishedDate?: string | null
}

/** SearXNG's JSON search response envelope (fields the provider reads). */
export interface SearxngSearchResponse {
  results?: SearxngResult[]
}
