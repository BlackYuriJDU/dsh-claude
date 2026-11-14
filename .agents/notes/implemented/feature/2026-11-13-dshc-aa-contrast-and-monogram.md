# Agent Note: DSHC contrast floor and monogram mark

Status: implemented

English | [中文](2026-11-13-dshc-aa-contrast-and-monogram.zh.md)

## Problem

The [theme override layer](2026-11-03-dshc-claude-app-palette-layer.md) copied the published values of the Claude app, and seven text tokens fell below WCAG AA (4.5:1) on surfaces of the same layer: tertiary and caption text, links, the deep-diving label, the business accent that also colors the focus ring, and the dark success, warning, and error text. The source comment promised AA on every surface without a check. The layer's eight-spoke clay burst was also the element closest to a logo, which the Anthropic trademark guidelines name explicitly, and the visible product name "DSH Claude" contained the Claude trademark.

## Decision

- The palette stays the app's. Each failing token is adjusted in lightness only, keeping hue and chroma, until it reaches 4.5:1 on the worst surface the layer defines; links and the deep-diving label take their own `DSHC_LINK` pair, and the clay fill of the send button stays `DSHC_CLAY`.
- [`ui-brand-dshc/tests/contrast.client.spec.ts`](../../../../packages/client/ui-brand-dshc/tests/contrast.client.spec.ts) reads `DSHC_TOKENS` and fails when a text token drops below 4.5:1, or an icon or the focus ring below 3:1, on any opaque surface of the layer, and when a code-highlighting token drops below 4.5:1 on the code block. It is proven against a failing pair.
- The mark is a monogram: a rounded clay tile holding the white serif initial of the wordmark, drawn from the same palette and the system serif stack.
- The visible product name is DSHC in the preset personas and the README, which follows the upstream `DSH` prefix for derived projects.

## Alternatives considered

**Replace the palette with an original one.** The owner chose to keep the app's palette; lightness-only adjustments fix contrast with a visible change of ΔE 0.4 to 12 per token.

**Keep the burst and record the risk.** The owner chose the monogram.

**A four-letter monogram.** At the sidebar's 16 to 24 px the letters of `DSHC` are illegible; the initial reads at every size the slots request.

## Consequences

- A token edit that breaks contrast fails `pnpm run test` and the coverage gate, not a later visual review.
- The favicon and the web app manifest still come from the upstream Web app, which every profile shares; replacing them for the `dshc` profile needs a build-time asset override.
- The send button's white glyph on the clay fill measures 4.05:1, enough for an icon (3:1) but not for text.
