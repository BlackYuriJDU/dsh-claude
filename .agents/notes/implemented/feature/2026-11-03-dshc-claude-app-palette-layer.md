# Agent Note: DSHC identity as a theme override layer

Status: implemented

English | [中文](2026-11-03-dshc-claude-app-palette-layer.zh.md)

## Problem

DSH Claude restyled the Web client by editing the shipped theme stylesheets and component CSS, matching CSS-module class names with `[class*='_x']` selectors, and forcing a dark-only preference. Its palette came from Anthropic's marketing site (`#cc785c`, `#181715`) rather than the Claude app. Rebasing onto upstream produced 259 merge conflicts, most of them in those edited packages.

## Decision

- [`ui-brand-dshc`](../../../../packages/client/ui-brand-dshc/README.md) registers one `ctx.theme.overrideTokens` layer and occupies the `sidebar.brand.mark`, `sidebar.brand.name`, and `conversation.hero.brand.mark` slots. It edits no upstream package.
- Every override names a light and a dark value, so the built-in light, dark, and system preferences keep working; the upstream default preference `system` stays.
- Values follow the host style variables in Anthropic's MCP Apps design guidelines, plus the app's sidebar tone and clay brand fill and hover. Tokens without a published value are derived from published ones, and the source file marks them.
- Interface text uses the system UI sans stack and the wordmark uses the system serif stack, which is what the app renders when its own faces are absent. No font file ships, because the app's faces are not redistributable.
- The mark is the DSHC monogram, and text tokens hold a WCAG AA floor enforced by a test ([contrast floor and monogram](2026-11-13-dshc-aa-contrast-and-monogram.md)); no Anthropic logo or font is included.

## Alternatives considered

**Port the previous stylesheet overrides.** They depended on hashed class names and on editing upstream CSS, so every upstream change to those components would conflict again.

**Register a third built-in theme.** A registered theme replaces the active preference, so users would lose the light, dark, and system choice. An override layer recolors whichever base palette is active.

**Embed open-source font substitutes.** The previous build embedded 371 KB of base64 fonts in the CSS bundle, and the substitutes (Cormorant Garamond, Inter) differ visibly from the app's faces. The system stacks cost nothing and match the app's own fallback.

## Consequences

- Upstream updates to `ui-theme` and component styles merge without DSHC conflicts; only token renames require changes here.
- Components that hard-code colors or read `--dsw-static-*` steps directly keep the base values.
- Radius and border-width geometry from the guidelines is not applied until `ui-theme` exposes tokens for it.
