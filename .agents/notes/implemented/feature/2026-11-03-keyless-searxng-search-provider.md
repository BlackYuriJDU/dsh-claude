# Agent Note: Keyless web search through a SearXNG provider

Status: implemented

English | [中文](2026-11-03-keyless-searxng-search-provider.zh.md)

## Problem

Every shipped search provider (Exa, Perplexity, DeepSeek) needs a vendor credential, so a deployment without one has no `web_search`. DSH Claude had worked around this with a standalone Python MCP server that scraped DuckDuckGo's HTML results: it sat outside the plugin system, was registered by hand in a settings file, depended on the page markup, and had no tests.

## Decision

- [`dsh-web-search-searxng`](../../../../packages/web/web-search-searxng/README.md) registers the `searxng` provider on `ctx.web`. It sends `GET {baseURL}/search?q=…&format=json` to a SearXNG instance, a self-hostable metasearch engine with a documented JSON output and no API key.
- `baseURL` falls back to `$SEARXNG_URL`; `language`, `categories`, and `safeSearch` are optional and otherwise defer to the instance. An empty, unparseable, or non-http(s) base URL makes the provider unavailable, so selection reports `WEB_PROVIDER_UNAVAILABLE` or `WEB_PROVIDER_CONFIGURED_UNAVAILABLE` instead of sending requests.
- Results keep only http(s) URLs with a non-blank excerpt, and the first occurrence of a URL wins because SearXNG merges engines. The provider returns no `content`; the service applies `maxResults`.
- Requests use `redirect: 'error'`, matching the family rule for credentialed providers even though this request carries no credential, so the configured instance is the only origin contacted.
- An HTTP `403` names the `search.formats` setting, because SearXNG answers `403` when JSON output is disabled.
- The package is classified `optional`: the shipped default bundles do not mount it.

## Alternatives considered

**Keep scraping DuckDuckGo.** It needs no instance, but it parses markup that is not an API, breaks without notice, and automated scraping conflicts with the service's terms. It also cannot be tested against a stable contract.

**Default to a public SearXNG instance.** Public instances commonly disable JSON output and rate-limit automated clients, and a default would send every user's queries to a third party the deployment did not choose. Requiring `baseURL` or `$SEARXNG_URL` makes the instance an explicit deployment choice.

**Map SearXNG instant answers to `content`.** The `answers[]` entry format differs across engines and SearXNG versions; mapping it waits for a pinned minimum version and fixtures, recorded in the package Dev Note.

## Consequences

- A deployment with a reachable SearXNG instance gets `web_search` with no vendor key.
- Result quality and coverage follow the instance's engine settings, which the provider does not control.
- The live smoke test self-skips without `$SEARXNG_URL`, so CI covers the provider through mocked `fetch` and the egress-proxy spec only.
