---
description: "The SearXNG search provider's settings page on the dsh web client's Plugins page: instance URL, language, categories, and SafeSearch of the web-search-searxng namespace."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-settings-searxng

English | [中文](README.zh.md)

## Summary

Open **Plugins** in the sidebar and select **SearXNG search** in the Official group to set the SearXNG instance web search uses and how it filters results. The page stages what is typed and writes it only on save, marks the values the user overrode, and offers to reset each back to the deployment's default. The page exists while the Host serves the `web-search-searxng` namespace, so a deployment without the provider shows no trace of it.

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

The **SearXNG search** card in the Official group opens the page. **Instance URL** is the base URL of a SearXNG instance with JSON output enabled; left blank, the provider uses `$SEARXNG_URL`. **Language**, **Categories**, and **SafeSearch** (`0` off, `1` moderate, `2` strict) narrow results; left blank, the instance's own defaults apply. A field the user overrode carries an **Overridden** badge with **Reset to default** beside it. Nothing is written until **Save**, and the provider reads the saved values on its next search. Choose SearXNG as the provider under **Web search and fetch** to search through it.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The Host half is an empty `apply`, present only so the package holds a Loader row the client module system serves the browser half for. The browser half binds the `web-search-searxng` entry through `ctx.configForms.get`, keeps the staged form in `SearxngCardController` over the shared `SettingsFormModel` of `ui-primitives`, and registers `SearxngCard` into the Plugins page's `plugins.item` slot through `ctx.configForms.whileServed`, at order `25`, after the Web search and fetch page. The page's copy lives in this package's `settings.searxng` dictionary; the `SettingsForm` frame takes its copy as props.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [web-search-searxng](../../web/web-search-searxng/README.md) — the provider whose live fields the page edits.
- [ui-plugin-manager](../ui-plugin-manager/README.md) — the Plugins page and the `plugins.item` slot the page registers into.
- [ui-primitives](../ui-primitives/README.md) — the settings form model and fields the page renders.
- [dsh-dshc](../../bundle/dshc/README.md) — the profile layer that mounts the provider and this page.

-----

<a id="model-experience"></a>
## Model Experience

None, as the package is a browser-side settings surface that registers no model surface.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **The Host schema validates each save** — a SafeSearch value other than `0`, `1`, or `2`, or a value the provider schema rejects, fails the save and leaves the draft for correction; the page does not validate URLs or language codes itself.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
