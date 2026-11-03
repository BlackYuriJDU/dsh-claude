---
description: "The DSHC bundle: the patch layer that turns the Web profile into DSHC with the Claude-app palette, the DSHC brand, and keyless SearXNG search, for users starting DSHC and maintainers extending its layer."
kind: "package-bundle"
---

# @deepseek-ai/dsh-dshc

English | [中文](README.zh.md)

## Summary

This bundle is the patch layer of the `dshc` profile, which stacks it over `dsh-base` and `dsh-web-app`. It replaces the official brand with [`ui-brand-dshc`](../../client/ui-brand-dshc/README.md), whose palette layer gives the Web client the Claude app's colors in light, dark, and system modes, and mounts the keyless [`web-search-searxng`](../../web/web-search-searxng/README.md) provider. It adds no code of its own and changes nothing in the other profiles.

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

Start the `dshc` profile; its template lists `dsh-base`, `dsh-web-app`, and this bundle, and is created on first use at `$DSH_HOME/profiles/dshc`.

```sh
dsh dshc
```

Set `$SEARXNG_URL` to a SearXNG instance with JSON output enabled to make the search provider usable. Without it the provider stays unavailable, and the web service keeps selecting among the other usable search providers. When more than one search provider is usable, pin one with `$DSH_WEB_SEARCH_PROVIDER`, for example `searxng`.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

[`cordis.patch.yml`](cordis.patch.yml) disables the `ui-brand-official` row from the Web layer, because both brand packages occupy the same single slots, and inserts the `ui-brand-dshc` and `web-search-searxng` rows. Each inserted package is a runtime dependency of this bundle, and the bundle is a dependency of the `dsh` installation, so the profile resolves them from the installation. [`src/index.ts`](src/index.ts) is an empty module that gives the package an entry point.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

Read these pages for the packages this layer composes and the profile mechanism it uses.

- [ui-brand-dshc](../../client/ui-brand-dshc/README.md) — the palette layer and brand occupants.
- [web-search-searxng](../../web/web-search-searxng/README.md) — the keyless search provider and its instance requirements.
- [Profile bundles](../README.md) — the other bundle layers and how profiles stack them.
- [app-boot profiles](../../boot/app-boot/README.md#profiles) — how a profile template, bundles, and user patches compose.

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through the inserted rows: `web-search-searxng` supplies `web_search` sources when it is the selected provider, and `ui-brand-dshc` reaches no model request.

#### KV Cache effect

No direct invalidation; the inserted packages own any request-prefix changes.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>


These limits define what the layer changes. They are current package constraints.

- **The agent persona is unchanged** — the presets inherited from `dsh-web-app` keep their own persona text, so the model does not introduce itself as DSHC.
- **Upstream product copy remains** — notices and onboarding text from the Web layer still name DeepSeek Harness.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

#### Future: DSHC surface presets

Chat, Cowork, and Code presets with the DSHC persona belong in this layer as preset patch files, registered after the Web presets.

</details>
