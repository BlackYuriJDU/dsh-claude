---
description: "DSHC identity for the Web client: a Claude-app palette layer over the theme service plus the DSHC mark in the sidebar and hero, for users and maintainers composing the DSHC deployment."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-brand-dshc

English | [中文](README.zh.md)

## Summary

This package gives the Web client the DSHC identity. It stacks one palette layer over the theme service that recolors the shipped light and dark palettes to the Claude app's warm neutrals and clay accent, and it fills the sidebar and blank-session hero brand slots with the DSHC clay burst, the serif wordmark, and a serif part-of-day greeting as the hero headline. Light, dark, and system preferences keep working, because every override names both schemes. Choose it for the DSHC deployment instead of `ui-brand-official`. It has no runtime state and does not affect model requests.

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

Mount this plugin in the browser roster and disable `ui-brand-official`, because both occupy the same single slots. The plugin needs the `slots`, `theme`, and `locale` services; the Web bundle provides all three.

```yaml
- insert:
    - id: ui-brand-dshc
      name: '@deepseek-ai/dsh-client-ui-brand-dshc'
- id: ui-brand-official
  disabled: true
```

### What changes on screen

The canvas becomes `#FAF9F5` in light and `#262624` in dark, raised cards and the composer `#FFFFFF` and `#30302E`, the sidebar `#F5F4ED` and `#1F1E1D`, and text follows the three-step `#141413`/`#3D3D3A`/`#686761` and `#FAF9F5`/`#C2C0B6`/`#A5A39B` ladders. Generic primary buttons are ink (`#141413` in light, `#FAF9F5` in dark), as on the app's own dialogs; the composer's send button and other filled accents use the clay `#C6613F` with the lighter `#D97757` hover in both schemes. Accent text, such as the active tab, links, and selected rows, uses a deeper clay (`#A64C2A` light, `#E38D6F` dark), links use `#AB4926` and `#EC8868`, and the status text steps are adjusted in lightness only. A contrast test reads the layer and fails when a text token drops below 4.5:1, or an icon or the focus ring below 3:1, on any surface the layer defines. Code highlighting uses a warm palette whose every color reaches 4.5:1 on the code block, and empty-state illustrations use warm neutrals. Interface text uses the system UI sans stack and the wordmark uses the system serif stack, so no font file ships. The blank-session hero greets with Good morning before noon, Good afternoon before 18:00, and Good evening after, by the browser's local clock and in the interface language, in place of the upstream headline and Preview badge. Assistant responses use the system serif stack, as in the Claude app; reasoning stays sans, and a text font chosen in Settings applies to responses too. Interface text that names the product, such as the plugin safety notice, the Office preview notice, and the Platform Back button, says DSHC, the same name as the wordmark. Below the New Session composer, pills for Write, Learn, Code, and Life stuff each open three example prompts, and DSHC's choice picks one of the twelve at random; choosing a prompt replaces the draft and focuses the composer without sending. The suggestions appear once the Session registry is available.

### Replacing the palette or the brand

A user font choice in Settings still wins over the default sans stack, and a later `ctx.theme.overrideTokens` layer still wins per token. To keep the palette with another brand, register different occupants for the brand slots in a separate package; to keep the brand with the shipped palette, this package has no switch, so compose another brand package instead.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The palette is one `ctx.theme.overrideTokens` layer whose source is the package name, registered as a fiber effect, so unloading the plugin removes exactly that layer and the theme service republishes the base palette. Values come from the host style variables in Anthropic's MCP Apps design guidelines and the Claude app's sidebar and brand tokens; tokens those sources do not name are derived from them, and [`src/client/tokens.ts`](src/client/tokens.ts) records which are which. The three brand occupants register as declaration-aware sets through nested `ctx.slots.inject()` calls, so they work whether this row activates before or after the declaring packages and withdraw with the declaration. The node half is an empty Loader seat.

| File | Role |
|---|---|
| [`src/client/index.ts`](src/client/index.ts) | Browser entry: palette layer, product name, and slot registrations |
| [`src/client/tokens.ts`](src/client/tokens.ts) | The override map, clay constants, and font stacks |
| [`src/client/Brand.tsx`](src/client/Brand.tsx) | The clay burst mark and serif wordmark |
| [`src/client/Greeting.tsx`](src/client/Greeting.tsx) | The part-of-day hero greeting |
| [`src/client/Suggestions.tsx`](src/client/Suggestions.tsx) | The starting suggestions below the hero composer |
| [`src/client/locales.ts`](src/client/locales.ts) | Greeting dictionaries for every shipped language |
| [`src/index.ts`](src/index.ts) | Empty node half |

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

Read these pages when the identity surface is not enough. They move from the services this package uses to the shell that renders them.

- [ui-theme](../ui-theme/README.md) — the theme service, its built-in palettes, and override layers.
- [ui-sidebar](../ui-sidebar/README.md) — declares `sidebar.brand.mark` and `sidebar.brand.name` and renders their fallbacks.
- [ui-conversation](../ui-conversation/README.md) — declares `conversation.hero.brand.mark` and `conversation.hero.headline` in the hero.
- [ui-brand-official](../ui-brand-official/README.md) — the official occupants this package replaces.

-----

<a id="model-experience"></a>
## Model Experience

None, as the package contributes browser presentation only; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>


These limits define what the palette layer can reach. They are current package constraints.

- **Only token-driven surfaces change** — a component that hard-codes a color or reads a static `--dsw-static-*` step directly keeps the base value.
- **Derived tokens are approximations** — hover washes, code blocks, bubbles, and scrollbars have no published Claude-app value and are derived from the published ones.
- **The browser title and favicon are independent** — they are build-environment concerns outside the slot system.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

#### Future: geometry tokens

Radius steps (4/6/8/10/12 px) and the 0.5 px border width from the same guidelines are not applied yet; the base styles hard-code radii per component, so they need radius tokens in `ui-theme` first.

</details>
