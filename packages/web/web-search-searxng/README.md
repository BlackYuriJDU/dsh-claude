---
description: "The SearXNG-backed keyless search provider for ctx.web: how deployments mount web search against a self-hosted or trusted SearXNG instance without an API key."
kind: "package-reference"
---

# @deepseek-ai/dsh-web-search-searxng

English | [中文](README.zh.md)

## Summary

With `dsh-web-search-searxng`, the harness searches the web through a SearXNG instance and needs no API key. Choose it when a deployment runs its own SearXNG (or trusts one) and wants keyless metasearch with citeable sources. SearXNG returns no generated answer, so results carry no `content` — only sources. A result without an http(s) URL or a non-blank excerpt is dropped, and duplicate URLs from different engines keep their first occurrence, so a call can return fewer sources than requested. The model-facing `web_search` tool lives in `dsh-tool-web`.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount the provider in a composition that already loads the web service; it registers as the `searxng` search provider, so `ctx.web.search()` resolves it automatically when it is the only usable search backend — or pin it with `searchProvider: searxng`.

### When to choose it

Choose this backend when a deployment can reach a SearXNG instance whose settings enable the `json` format under `search.formats`, and wants web search without a vendor key. The provider is unavailable — and every search call fails with a structured error — when the base URL is empty, does not parse, or is not http(s).

### Minimal configuration

Load the web service and the provider; the base URL falls back to `$SEARXNG_URL` from the launch environment, and every other field defaults to the instance's own setting.

```yaml
- name: '@deepseek-ai/dsh-web'
- name: '@deepseek-ai/dsh-web-search-searxng'
  config:
    baseURL: http://127.0.0.1:8888
```

| Field | Default | Meaning |
|---|---|---|
| `baseURL` | `$SEARXNG_URL` | Instance base URL; `/search` is appended. Empty, unparseable, or non-http(s) makes the provider unavailable |
| `language` | (instance default) | Search language sent as `language`, for example `pt-BR` |
| `categories` | (instance default) | Comma-separated SearXNG categories sent as `categories`, for example `general,news` |
| `safeSearch` | (instance default) | SafeSearch level sent as `safesearch`: `0` off, `1` moderate, `2` strict |

All four fields are live: an edit to the profile configuration (**Settings → Open configuration file**) applies to the next availability check and search without a reload. An empty `baseURL` falls back to `$SEARXNG_URL`. The provider registers with the title **SearXNG** and a localized description, so **Web search and fetch** lists it in the search provider menu; selecting it there, or `$DSH_WEB_SEARCH_PROVIDER=searxng`, makes it the search provider.

The generated [configuration catalog](../../../docs/config-catalog.md#deepseek-aidsh-web-search-searxng) is the exhaustive source for every accepted field and its JSDoc.

### What a search returns

Each SearXNG result maps to a `WebSearchSource`: `url`, the trimmed `title`, the trimmed `content` excerpt as `snippet`, and `publishedDate` as `publishedAt`. SearXNG has no result-count parameter, so the service applies the request's `maxResults` bound by truncating and flagging. The result carries no `content`.

### Failures and recovery

Provider failures — HTTP errors, network failures, unparseable or wrong-shape bodies — surface as `WebError` `WEB_PROVIDER_ERROR`; an aborted request surfaces as `WEB_ABORTED`. An HTTP `403` adds a hint to enable the `json` format, because that is SearXNG's answer when JSON output is disabled. HTTP redirects are rejected before the `Location` target is contacted and surface as `WEB_PROVIDER_ERROR`.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

This section explains the design decisions behind the provider; the observable behavior is fully covered in [Use this package](#use-this-package).

### Design philosophy

The provider is a thin adapter over SearXNG's JSON output with three rules:

- **Citeable sources only.** A source needs an http(s) URL and a real excerpt; other schemes (magnet links, `javascript:`) and excerpt-less entries are dropped instead of inventing a snippet.
- **One entry per URL.** SearXNG merges many engines, so the first occurrence of a URL wins.
- **No invented answers.** SearXNG's instant answers vary by engine and version, so `content` is omitted.

### Source map

| File | Role |
|---|---|
| [`src/index.ts`](src/index.ts) | Plugin entry: live config schema, environment fallback, provider registration |
| [`src/provider.ts`](src/provider.ts) | The `SearxngSearchProvider`: URL building, request dispatch, abort classification, result mapping |
| [`src/types.ts`](src/types.ts) | SearXNG wire types: `SearxngSearchResponse`, `SearxngResult` |

### Request and mapping flow

`search()` sends `GET {baseURL}/search?q=…&format=json` with the configured `language`, `categories`, and `safesearch` and `redirect: 'error'`, so a redirect fails the request without contacting the target. The parsed `results[]` are mapped one by one, uncitable and duplicate entries dropped, and the service applies the final `maxResults` bound on the way back. An abort — a `DOMException` named `AbortError` — becomes `WEB_ABORTED`; anything else becomes `WEB_PROVIDER_ERROR`.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

Read these pages when the package-level contract is not enough. They move from the shared vocabulary to the service, the model-facing tools, and the design rationale.

- [Web subsystem](../../../docs/subsystems/web.md) — the exhaustive search request/result vocabulary and error codes.
- [Web package map](../README.md) — the web package family and each role.
- [dsh-web](../web/README.md) — the web service this provider registers into.
- [dsh-tool-web](../tool-web/README.md) — the model-facing `web_search` tool that renders this provider's sources.
- [Generated configuration catalog](../../../docs/config-catalog.md#deepseek-aidsh-web-search-searxng) — every accepted config field and its source declaration.
- [Web capability seam decision](../../../.agents/notes/implemented/architecture/2026-06-24-web-capability-seam.md) — why search and fetch share one provider-selection service.

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through `dsh-tool-web`, which retains this provider's `maxResults`-bounded URLs, titles, excerpts, and publication dates or its exact `SearXNG search aborted`, `SearXNG search request failed: <error>`, `SearXNG API error (HTTP <status>)`, and `SearXNG returned an unprocessable response body: <error>` failures under the consumer's error wrapper.

#### KV Cache effect

No direct invalidation; the named consumer owns any request-prefix changes.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>


These limits define when the provider is a poor fit. They are current package constraints.

- **The instance must enable JSON output** — SearXNG ships with `json` disabled in `search.formats`; public instances commonly keep it disabled and rate-limit automated clients, so a self-hosted instance is the supported deployment.
- **Result quality follows the instance's engines** — the provider sends no engine selection; the instance's `engines` settings decide coverage and ranking.
- **No settings page yet** — the Plugins page lists no SearXNG page, so the fields change only in the profile configuration; the search provider menu still lists and selects SearXNG.
- **Abort classification is error-shape-based** — only a `DOMException` named `AbortError` maps to `WEB_ABORTED`; an abort carrying a custom reason surfaces as `WEB_PROVIDER_ERROR`.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

This Dev Note is working context for maintainers: open questions and undecided directions. It is explicitly non-authoritative — shipped behavior, limits, and rationale live in the sections above and the linked Agent Notes.

#### Future: instant answers as `content`

SearXNG's `answers[]` could feed the result's optional `content`, but its entry format differs across engines and SearXNG versions. Mapping it needs a pinned minimum SearXNG version and a fixture per answer format first.

</details>
