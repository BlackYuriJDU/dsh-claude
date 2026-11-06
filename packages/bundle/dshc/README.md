---
description: "The DSHC bundle: the patch layer that turns the Web profile into DSHC with the Claude-app palette, the DSHC brand, saved memories, per-workspace projects, and keyless SearXNG search, for users starting DSHC and maintainers extending its layer."
kind: "package-bundle"
---

# @deepseek-ai/dsh-dshc

English | [中文](README.zh.md)

## Summary

This bundle is the patch layer of the `dshc` profile, which stacks it over `dsh-base` and `dsh-web-app`. It replaces the official brand with [`ui-brand-dshc`](../../client/ui-brand-dshc/README.md), whose palette layer gives the Web client the Claude app's colors in light, dark, and system modes, mounts the keyless [`web-search-searxng`](../../web/web-search-searxng/README.md) provider, adds the saved memories of [`ui-memory`](../../client/ui-memory/README.md) and the per-workspace projects of [`ui-projects`](../../client/ui-projects/README.md), and replaces the upstream agent presets with the DSHC Chat, Cowork, and Code presets. It adds no code of its own and changes nothing in the other profiles.

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

### Chat, Cowork, Code, and Design

New sessions start in Chat; the segmented switch beside the workspace picker moves between the four, and the Settings default overrides the start choice. Every preset opens its persona with the same identity, DSHC powered by the configured model and not Claude, and closes with the same communication rules: warm and direct, prose by default with lists only when needed, effort matched to the ask, at most one question per reply, honest about uncertainty and mistakes, balanced on contested topics, and replies in the person's language.

| Preset | For | Tools | Persona focus |
|---|---|---|---|
| Chat | Conversation, questions, writing, learning | File reads, web search and fetch, skills, compaction; no shell and no file writes | Answers in the conversation and points to Cowork or Code when a task needs commands or files |
| Cowork | Multi-step knowledge work in the workspace folder | The upstream standard set: shell, files, search, jobs, schedules, skills, goals, plan mode, subagents, questions, todos, web, `present` | Clarifies the goal, plans visibly with todos, delivers finished files through `present`, asks before deleting or sending anything out |
| Code | Software engineering in the workspace | The same standard set | Gathers context, acts, verifies with real test results; minimal root-cause changes; commits only when asked |
| Design | Pages, screens, slides, and components | The same standard set | Builds each design as one self-contained HTML file under `designs/`, follows the workspace `DESIGN.md`, presents it in the preview, and treats quoted elements as comments to apply |

The upstream Standard, PTC, and Minimal presets are disabled because they describe themselves relative to Standard; Creator stays available from Settings and is hidden from the switch.

Set `$SEARXNG_URL` to a SearXNG instance with JSON output enabled to make the search provider usable, then choose it under **Plugins → Web search and fetch** or pin it with `$DSH_WEB_SEARCH_PROVIDER=searxng`; the `bin/dshc` launcher pins it when `$SEARXNG_URL` is set. The web service never falls back from the selected provider, so a search fails while the selected provider is unavailable.

DSHC sends no Session log to DeepSeek by default. The bundle disables the `session-telemetry-otel` row, which would export a Session-log prefix after message feedback, and starts `session-log-deepseek` with `enabled: false`, so requests to the official DeepSeek API carry no Session-log field until **Settings → General → Upload Session Log when using the official model API** is turned on.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

[`cordis.patch.yml`](cordis.patch.yml) disables the `ui-brand-official` row from the Web layer, because both brand packages occupy the same single slots, inserts the `ui-brand-dshc`, `web-search-searxng`, `ui-settings-searxng`, `ui-memory`, and `ui-projects` rows, disables the Standard, PTC, and Minimal presets, sets `chat` as the registry default, and marks the upstream DeepSeek Harness welcome notice as acknowledged at its current version, which a test keeps in step with `ui-settings-models`. The three files under [`presets/`](presets/) follow it in `dsh.bundle.patch`; Cowork and Code reuse the upstream standard rows unchanged apart from the persona, and a test keeps them equal. Each inserted package is a runtime dependency of this bundle, and the bundle is a dependency of the `dsh` installation, so the profile resolves them from the installation. [`src/index.ts`](src/index.ts) is an empty module that gives the package an entry point.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

Read these pages for the packages this layer composes and the profile mechanism it uses.

- [ui-brand-dshc](../../client/ui-brand-dshc/README.md) — the palette layer and brand occupants.
- [web-search-searxng](../../web/web-search-searxng/README.md) — the keyless search provider and its instance requirements.
- [ui-memory](../../client/ui-memory/README.md) — the saved-memory list and its runtime-context text.
- [ui-projects](../../client/ui-projects/README.md) — per-workspace instructions, knowledge files, and their runtime-context text.
- [Profile bundles](../README.md) — the other bundle layers and how profiles stack them.
- [app-boot profiles](../../boot/app-boot/README.md#profiles) — how a profile template, bundles, and user patches compose.

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through the persona, tool, and context plugins this bundle composes: each preset's `persona` prefix becomes the `deployment:persona-prefix` system section of that preset's sessions, the preset's tool rows decide which tools the model sees (Chat has no shell or write tools), `ui-memory` adds the saved memories to every session's runtime context, `ui-projects` adds the project of the session's workspace, `web-search-searxng` supplies `web_search` sources when it is the selected provider, and `ui-brand-dshc` reaches no model request.

#### KV Cache effect

The persona text is fixed per preset, so it stays in the cached prefix across turns; switching a session's preset changes the system prompt and tool list and starts a new prefix.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>


These limits define what the layer changes. They are current package constraints.

- **The personas steer, they do not retrain** — the configured model follows the written rules to the extent it follows instructions; behavior differs between models.
- **No Chat/Cowork/Code switch inside the composer** — the preset chip sits beside the workspace picker, as the Web layer places it.
- **Upstream product copy remains** — notices and onboarding text from the Web layer still name DeepSeek Harness.
- **The feedback dialog still mentions the conversation log** — its hint says a submission includes the log, although DSHC keeps feedback in the local Session log and exports nothing.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

#### Future: keyless snapshots for the personas

The personas have structural tests only; a keyless replay snapshot per preset would pin the rendered system prompt and catch drift from upstream preset changes.

</details>
