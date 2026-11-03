import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import WebRuntime from '@deepseek-ai/dsh-web'
import { SearxngSearchProvider, SEARXNG_PROVIDER_ID, searxngSearchUrl } from '@deepseek-ai/dsh-web-search-searxng'
import * as searxngPlugin from '@deepseek-ai/dsh-web-search-searxng'
import { mapSearxngResponse, mapSearxngResult } from '../src/provider.ts'

const options = { baseURL: 'https://searx.test' }

type FetchArgs = [url: string, init?: RequestInit]

/** A `fetch` stand-in whose recorded calls keep the URL and init types. */
function fetchReturning(respond: () => Promise<Response>) {
  return vi.fn<(...args: FetchArgs) => Promise<Response>>(respond)
}

/** A 200 response whose body stream fails with an abort while being read. */
function abortingBody(): Response {
  return new Response(new ReadableStream({ start(controller) { controller.error(new DOMException('aborted', 'AbortError')) } }))
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' }, ...init })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SearXNG result mapping', () => {
  it('maps a full result entry', () => {
    expect(mapSearxngResult({
      url: 'https://a.test/page',
      title: ' A ',
      content: ' an excerpt ',
      publishedDate: '2026-01-01T00:00:00',
    })).toEqual({ url: 'https://a.test/page', title: 'A', snippet: 'an excerpt', publishedAt: '2026-01-01T00:00:00' })
  })

  it('drops an entry without a usable excerpt', () => {
    expect(mapSearxngResult({ url: 'https://a.test' })).toBeUndefined()
    expect(mapSearxngResult({ url: 'https://a.test', content: null })).toBeUndefined()
    expect(mapSearxngResult({ url: 'https://a.test', content: '   ' })).toBeUndefined()
  })

  it('drops an entry whose URL is not http(s)', () => {
    expect(mapSearxngResult({ url: 'magnet:?xt=urn:btih:abc', content: 'torrent' })).toBeUndefined()
    expect(mapSearxngResult({ url: 'javascript:alert(1)', content: 'x' })).toBeUndefined()
  })

  it('omits null or empty optional fields', () => {
    expect(mapSearxngResult({ url: 'https://a.test', title: null, publishedDate: null, content: 'hi' }))
      .toEqual({ url: 'https://a.test', snippet: 'hi' })
    expect(mapSearxngResult({ url: 'https://a.test', title: '', publishedDate: '', content: 'hi' }))
      .toEqual({ url: 'https://a.test', snippet: 'hi' })
  })

  it('maps a response, dropping uncitable entries and duplicate URLs', () => {
    const result = mapSearxngResponse({
      results: [
        { url: 'https://a.test', content: 'one' },
        { url: 'https://b.test' },
        { url: 'https://a.test', content: 'duplicate from another engine' },
        { url: 'https://c.test', title: 'C', content: 'three' },
      ],
    })
    expect(result).toEqual({
      sources: [
        { url: 'https://a.test', snippet: 'one' },
        { url: 'https://c.test', title: 'C', snippet: 'three' },
      ],
      truncated: false,
    })
    expect(result.content).toBeUndefined()
  })

  it('tolerates a missing or non-array results field', () => {
    expect(mapSearxngResponse({}).sources).toEqual([])
    expect(mapSearxngResponse({ results: {} as never }).sources).toEqual([])
  })
})

describe('SearXNG search URL', () => {
  it('appends /search with the query and JSON format', () => {
    expect(searxngSearchUrl(options, 'hello world')).toBe('https://searx.test/search?q=hello+world&format=json')
  })

  it('keeps a base path and accepts a trailing slash', () => {
    expect(searxngSearchUrl({ baseURL: 'https://host.test/searx' }, 'q')).toBe('https://host.test/searx/search?q=q&format=json')
    expect(searxngSearchUrl({ baseURL: 'https://host.test/searx/' }, 'q')).toBe('https://host.test/searx/search?q=q&format=json')
  })

  it('sends the configured language, categories, and safesearch', () => {
    const url = new URL(searxngSearchUrl({ ...options, language: 'pt-BR', categories: 'general,news', safeSearch: 0 }, 'q'))
    expect(url.searchParams.get('language')).toBe('pt-BR')
    expect(url.searchParams.get('categories')).toBe('general,news')
    expect(url.searchParams.get('safesearch')).toBe('0')
  })

  it('omits empty optional filters', () => {
    const url = new URL(searxngSearchUrl({ ...options, language: '', categories: '' }, 'q'))
    expect(url.searchParams.has('language')).toBe(false)
    expect(url.searchParams.has('categories')).toBe(false)
    expect(url.searchParams.has('safesearch')).toBe(false)
  })
})

describe('SearxngSearchProvider availability', () => {
  it('is unavailable without a base URL', () => {
    expect(new SearxngSearchProvider({ baseURL: '' }).available()).toBe(false)
  })

  it('is unavailable when the base URL is unparseable or not http(s)', () => {
    expect(new SearxngSearchProvider({ baseURL: 'not a url' }).available()).toBe(false)
    expect(new SearxngSearchProvider({ baseURL: 'ftp://searx.test' }).available()).toBe(false)
  })

  it('is available with an http(s) base URL and needs no key', () => {
    expect(new SearxngSearchProvider(options).available()).toBe(true)
    expect(new SearxngSearchProvider({ baseURL: 'http://127.0.0.1:8888' }).available()).toBe(true)
  })
})

describe('SearxngSearchProvider request', () => {
  it('sends a GET with JSON accept and refuses redirects', async () => {
    const fetchMock = fetchReturning(async () => jsonResponse({ results: [{ url: 'https://a.test', content: 'hi' }] }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await new SearxngSearchProvider(options).search({ query: 'hello', maxResults: 5 })
    expect(result.sources).toEqual([{ url: 'https://a.test', snippet: 'hi' }])
    const [url, init = {}] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://searx.test/search?q=hello&format=json')
    expect(init).toMatchObject({ method: 'GET', redirect: 'error' })
    expect((init.headers as Record<string, string>)['accept']).toBe('application/json')
  })

  it('forwards the abort signal', async () => {
    const fetchMock = fetchReturning(async () => jsonResponse({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()
    await new SearxngSearchProvider(options).search({ query: 'q' }, controller.signal)
    const [, init = {}] = fetchMock.mock.calls[0]!
    expect(init.signal).toBe(controller.signal)
  })
})

describe('SearxngSearchProvider error handling', () => {
  it('explains a 403 as a disabled JSON format', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Forbidden', { status: 403 })))
    await expect(new SearxngSearchProvider(options).search({ query: 'q' }))
      .rejects.toThrow(expect.objectContaining({
        code: 'WEB_PROVIDER_ERROR',
        message: 'SearXNG API error (HTTP 403); enable `json` under `search.formats` in the instance settings',
      }))
  })

  it('reports other HTTP errors with their status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('busy', { status: 429 })))
    await expect(new SearxngSearchProvider(options).search({ query: 'q' }))
      .rejects.toThrow(expect.objectContaining({ code: 'WEB_PROVIDER_ERROR', message: 'SearXNG API error (HTTP 429)' }))
  })

  it('maps a network failure to WEB_PROVIDER_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('connection refused'))))
    await expect(new SearxngSearchProvider(options).search({ query: 'q' }))
      .rejects.toThrow(expect.objectContaining({ code: 'WEB_PROVIDER_ERROR' }))
  })

  it('maps an abort to WEB_ABORTED', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new DOMException('aborted', 'AbortError'))))
    await expect(new SearxngSearchProvider(options).search({ query: 'q' }))
      .rejects.toThrow(expect.objectContaining({ code: 'WEB_ABORTED' }))
  })

  it('maps an unparseable success body to WEB_PROVIDER_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>not json</html>', { status: 200 })))
    await expect(new SearxngSearchProvider(options).search({ query: 'q' }))
      .rejects.toThrow(expect.objectContaining({ code: 'WEB_PROVIDER_ERROR' }))
  })

  it('maps a null JSON body to WEB_PROVIDER_ERROR, not a raw TypeError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(null)))
    await expect(new SearxngSearchProvider(options).search({ query: 'q' }))
      .rejects.toThrow(expect.objectContaining({ code: 'WEB_PROVIDER_ERROR' }))
  })

  it('surfaces an abort during body parse as WEB_ABORTED', async () => {
    vi.stubGlobal('fetch', fetchReturning(async () => abortingBody()))
    await expect(new SearxngSearchProvider(options).search({ query: 'q' }))
      .rejects.toThrow(expect.objectContaining({ code: 'WEB_ABORTED' }))
  })
})

describe('web-search-searxng plugin registration', () => {
  it('registers the provider into ctx.web (HMR-safe)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ results: [] })))
    const ctx = new Context()
    await ctx.plugin(WebRuntime, { searchProvider: SEARXNG_PROVIDER_ID })
    const fiber = await ctx.plugin(searxngPlugin, { baseURL: 'https://searx.test' })
    await expect(ctx.web.search({ query: 'q' })).resolves.toMatchObject({ sources: [], truncated: false })
    await fiber.dispose()
    await expect(ctx.web.search({ query: 'q' }))
      .rejects.toThrow(expect.objectContaining({ code: 'WEB_PROVIDER_CONFIGURED_MISSING' }))
  })

  it('has no default export (namespace plugin export shape)', () => {
    expect('default' in searxngPlugin).toBe(false)
  })

  it('threads language, categories, and safeSearch config into the request', async () => {
    const fetchMock = fetchReturning(async () => jsonResponse({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const ctx = new Context()
    await ctx.plugin(WebRuntime, { searchProvider: SEARXNG_PROVIDER_ID })
    const fiber = await ctx.plugin(searxngPlugin, { baseURL: 'https://searx.test', language: 'pt-BR', categories: 'news', safeSearch: 2 })
    await ctx.web.search({ query: 'q' })
    const [url] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://searx.test/search?q=q&format=json&language=pt-BR&categories=news&safesearch=2')
    await fiber.dispose()
  })

  it('falls back to $SEARXNG_URL when config omits the base URL', async () => {
    const prev = process.env.SEARXNG_URL
    process.env.SEARXNG_URL = 'http://127.0.0.1:8888'
    try {
      const fetchMock = fetchReturning(async () => jsonResponse({ results: [] }))
      vi.stubGlobal('fetch', fetchMock)
      const ctx = new Context()
      await ctx.plugin(WebRuntime, { searchProvider: SEARXNG_PROVIDER_ID })
      const fiber = await ctx.plugin(searxngPlugin, {})
      await ctx.web.search({ query: 'q' })
      const [url] = fetchMock.mock.calls[0]!
      expect(url).toBe('http://127.0.0.1:8888/search?q=q&format=json')
      await fiber.dispose()
    } finally {
      if (prev === undefined) delete process.env.SEARXNG_URL
      else process.env.SEARXNG_URL = prev
    }
  })

  it('is unavailable when neither config nor env supplies a base URL', async () => {
    const prev = process.env.SEARXNG_URL
    delete process.env.SEARXNG_URL
    try {
      const ctx = new Context()
      await ctx.plugin(WebRuntime, { searchProvider: SEARXNG_PROVIDER_ID })
      await ctx.plugin(searxngPlugin, {})
      await expect(ctx.web.search({ query: 'q' }))
        .rejects.toThrow(expect.objectContaining({ code: 'WEB_PROVIDER_CONFIGURED_UNAVAILABLE' }))
    } finally {
      if (prev !== undefined) process.env.SEARXNG_URL = prev
    }
  })
})
