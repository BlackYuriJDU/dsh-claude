/**
 * The DSHC palette: `--dsw-*` overrides that recolor the shipped light and dark
 * palettes to the Claude app's warm neutrals and clay accent.
 *
 * Source values: the host style variables in Anthropic's MCP Apps design
 * guidelines (backgrounds `#FFFFFF`/`#F5F4ED`/`#FAF9F5` and `#30302E`/`#262624`/
 * `#141413`; text `#141413`/`#3D3D3A`/`#73726C` and `#FAF9F5`/`#C2C0B6`/`#9C9A92`;
 * borders `#1F1E1D` and `#DEDCD1` at 40/30/15/10 % alpha; danger, success,
 * warning, and info pairs), plus the app's `--bg-200` sidebar tone (`#F5F4ED`,
 * `#1F1E1D`) and its brand fill `#C6613F` with hover `#D97757`. Tokens the
 * guidelines do not name (hover washes, code blocks, bubbles, scrollbars) are
 * derived from those values and keep the base palette's light/dark contrast
 * direction.
 *
 * @module @deepseek-ai/dsh-client-ui-brand-dshc/client/tokens
 */

import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client'

/** Brand fill (the app's emphasized clay), used for primary actions in both schemes. */
export const DSHC_CLAY = '#c6613f'

/** Brand hover (the app's clay), lighter than the resting fill in both schemes. */
export const DSHC_CLAY_HOVER = '#d97757'

/** Theme-service layer id; one layer per source, so re-applying replaces it. */
export const DSHC_TOKEN_SOURCE = '@deepseek-ai/dsh-client-ui-brand-dshc'

/** Interface sans stack: the app falls back to the system UI face when its own face is absent. */
export const DSHC_FONT_SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans', 'Apple SD Gothic Neo', sans-serif"

/** Display serif stack for the wordmark and hero: the app's voice face falls back to the system serif. */
export const DSHC_FONT_SERIF = "ui-serif, Georgia, 'Times New Roman', serif"

const both = (value: string): { light: string; dark: string } => ({ light: value, dark: value })

/** Complete override layer passed to `ctx.theme.overrideTokens`. */
export const DSHC_TOKENS: ThemeTokenOverrides = Object.freeze({
  // Surfaces: canvas, raised cards and composer, sidebar.
  '--dsw-alias-bg-base': { light: '#faf9f5', dark: '#262624' },
  '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#30302e' },
  '--dsw-alias-bg-layer-2': { light: '#ffffff', dark: '#30302e' },
  '--dsw-alias-bg-layer-3': { light: '#ffffff', dark: '#3a3a37' },
  '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#30302e' },
  '--dsw-alias-bg-document-preview': { light: '#f5f4ed', dark: '#1f1e1d' },
  '--dsw-alias-bg-module-platform': { light: '#f5f4ed', dark: '#30302e' },
  '--dsw-alias-bg-multi-select': { light: '#f0eee6', dark: '#30302e' },
  '--dsw-alias-bg-skeleton': { light: 'rgba(31, 30, 29, 0.06)', dark: 'rgba(250, 249, 245, 0.06)' },
  '--dsw-alias-bg-mask-drop': { light: 'rgba(250, 249, 245, 0.7)', dark: 'rgba(38, 38, 36, 0.7)' },
  '--dsw-alias-bg-document-selection': { light: 'rgba(198, 97, 63, 0.18)', dark: 'rgba(217, 119, 87, 0.25)' },
  '--dsw-specific-sidebar-fill': { light: '#f5f4ed', dark: '#1f1e1d' },
  '--dsw-specific-sidebar-nav-item-active': { light: '#e8e6dc', dark: '#30302e' },
  '--dsw-specific-sidebar-nav-item-active-accent': { light: '#f0eee6', dark: '#262624' },
  '--dsw-specific-input-major': { light: '#ffffff', dark: '#30302e' },
  '--dsw-specific-login-input': { light: '#ffffff', dark: '#30302e' },
  '--dsw-specific-selector': { light: '#f0eee6', dark: '#3a3a37' },
  '--dsw-specific-tip': { light: '#f0eee6', dark: '#30302e' },
  '--dsw-specific-bubble': { light: '#f0eee6', dark: '#141413' },
  '--dsw-specific-bubble-highlight': { light: '#e8e6dc', dark: '#1f1e1d' },
  '--dsw-alias-menu-group-header-fill': { light: 'rgba(255, 255, 255, 0.94)', dark: 'rgba(48, 48, 46, 0.94)' },

  // Text.
  '--dsw-alias-label-primary': { light: '#141413', dark: '#faf9f5' },
  '--dsw-alias-label-primary-bluish': { light: '#141413', dark: '#faf9f5' },
  '--dsw-alias-label-primary-dimmed': { light: '#3d3d3a', dark: '#e8e6dc' },
  '--dsw-alias-label-secondary': { light: '#3d3d3a', dark: '#c2c0b6' },
  '--dsw-alias-label-tertiary': { light: '#73726c', dark: '#9c9a92' },
  '--dsw-alias-label-caption': { light: '#73726c', dark: '#9c9a92' },
  '--dsw-alias-label-dimmed': { light: 'rgba(115, 114, 108, 0.5)', dark: 'rgba(156, 154, 146, 0.5)' },
  '--dsw-alias-label-primary-foreground': both('#ffffff'),
  '--dsw-alias-label-primary-inverted': { light: '#ffffff', dark: '#141413' },
  '--dsw-alias-label-document-preview': { light: '#3d3d3a', dark: '#c2c0b6' },
  '--dsw-alias-menu-icon': { light: '#3d3d3a', dark: '#c2c0b6' },
  '--dsw-alias-link': { light: DSHC_CLAY, dark: DSHC_CLAY_HOVER },
  '--dsw-alias-label-deep-diving': { light: DSHC_CLAY, dark: DSHC_CLAY_HOVER },
  '--dsw-alias-label-deep-diving-shimmer': {
    light: `color-mix(in srgb, ${DSHC_CLAY} 40%, #faf9f5)`,
    dark: `color-mix(in srgb, ${DSHC_CLAY_HOVER} 45%, #262624)`,
  },

  // Borders: the guidelines' tertiary (15 %), secondary (30 %), and primary (40 %) steps.
  '--dsw-alias-border-l1': { light: 'rgba(31, 30, 29, 0.1)', dark: 'rgba(222, 220, 209, 0.1)' },
  '--dsw-alias-border-l2': { light: 'rgba(31, 30, 29, 0.15)', dark: 'rgba(222, 220, 209, 0.15)' },
  '--dsw-alias-border-l2-darkmode-thin': { light: 'rgba(31, 30, 29, 0.15)', dark: 'rgba(222, 220, 209, 0.1)' },
  '--dsw-alias-border-l3': { light: 'rgba(31, 30, 29, 0.3)', dark: 'rgba(222, 220, 209, 0.3)' },
  '--dsw-alias-border-l4': { light: 'rgba(31, 30, 29, 0.4)', dark: 'rgba(222, 220, 209, 0.4)' },

  // Brand and buttons: clay primary in both schemes, warm neutral secondaries.
  '--dsw-alias-brand-primary': both(DSHC_CLAY),
  '--dsw-alias-brand-primary-new-colorprimary-new-color': both(DSHC_CLAY),
  '--dsw-alias-brand-primary-invert': { light: '#141413', dark: '#faf9f5' },
  '--dsw-alias-brand-text': { light: '#141413', dark: '#faf9f5' },
  '--dsw-alias-button-primary-fill': both(DSHC_CLAY),
  '--dsw-alias-button-primary-hover': both(DSHC_CLAY_HOVER),
  '--dsw-alias-button-primary-dimmed': { light: 'rgba(198, 97, 63, 0.4)', dark: 'rgba(217, 119, 87, 0.4)' },
  '--dsw-alias-button-info-fill': { light: DSHC_CLAY, dark: DSHC_CLAY_HOVER },
  '--dsw-alias-button-info-hover': { light: DSHC_CLAY_HOVER, dark: DSHC_CLAY },
  '--dsw-alias-button-contrast-fill': { light: '#141413', dark: '#faf9f5' },
  '--dsw-alias-button-elevated-fill': { light: '#ffffff', dark: '#3a3a37' },
  '--dsw-alias-button-floating-fill': { light: '#ffffff', dark: '#30302e' },
  '--dsw-alias-button-floating-hover': { light: '#f5f4ed', dark: '#3a3a37' },
  '--dsw-alias-button-ghost-active-border': { light: 'rgba(31, 30, 29, 0.3)', dark: 'rgba(222, 220, 209, 0.3)' },
  '--dsw-alias-button-ghost-active-fill': { light: '#f0eee6', dark: '#3a3a37' },
  '--dsw-alias-button-ghost-active-hover': { light: '#e8e6dc', dark: '#42423f' },

  // Interaction washes.
  '--dsw-alias-interactive-bg-hover': { light: 'rgba(31, 30, 29, 0.05)', dark: 'rgba(250, 249, 245, 0.06)' },
  '--dsw-alias-interactive-bg-active': { light: 'rgba(31, 30, 29, 0.09)', dark: 'rgba(250, 249, 245, 0.1)' },
  '--dsw-alias-interactive-bg-hover-accent': { light: 'rgba(198, 97, 63, 0.12)', dark: 'rgba(217, 119, 87, 0.18)' },
  '--dsw-alias-interactive-bg-hover-danger': { light: 'rgba(181, 51, 51, 0.08)', dark: 'rgba(221, 83, 83, 0.15)' },
  '--dsw-alias-interactive-bg-hover-solid': { light: '#f0eee6', dark: '#3a3a37' },

  // Markdown and code.
  '--dsw-alias-markdown-code-block': { light: '#f5f4ed', dark: '#1f1e1d' },
  '--dsw-alias-markdown-code-block-banner': { light: '#f0eee6', dark: '#30302e' },
  '--dsw-alias-markdown-code-segment-selected': { light: '#ffffff', dark: '#30302e' },
  '--dsw-alias-markdown-code-segment-unselected': { light: '#f0eee6', dark: '#1f1e1d' },
  '--dsw-alias-markdown-inline-code': { light: '#f0eee6', dark: '#30302e' },
  '--dsw-alias-markdown-citation': { light: '#f0eee6', dark: '#30302e' },
  '--dsw-alias-markdown-placeholder': { light: '#f5f4ed', dark: '#30302e' },
  '--dsw-alias-markdown-tag': { light: '#f0eee6', dark: '#30302e' },

  // Scrollbars.
  '--dsw-alias-scrollbar-bg-l1': { light: '#dedcd1', dark: '#42423f' },
  '--dsw-alias-scrollbar-bg-l2': { light: '#dedcd1', dark: '#4a4a46' },
  '--dsw-alias-scrollbar-hover-l1': { light: '#c2c0b6', dark: '#5a5955' },
  '--dsw-alias-scrollbar-hover-l2': { light: '#c2c0b6', dark: '#62615c' },

  // States: the guidelines' danger, success, and warning pairs; business accents follow the clay.
  '--dsw-alias-state-error-primary': { light: '#a73d39', dark: '#cd5c58' },
  '--dsw-alias-state-error-secondary': { light: '#b53333', dark: '#dd5353' },
  '--dsw-alias-state-success-primary': { light: '#437426', dark: '#599130' },
  '--dsw-alias-state-success-secondary': { light: '#265b19', dark: '#7ab948' },
  '--dsw-alias-state-success-tertiary': { light: '#e9f1dc', dark: '#1b4614' },
  '--dsw-alias-state-warn-primary': { light: '#805c1f', dark: '#a87829' },
  '--dsw-alias-state-warn-secondary': { light: '#a87829', dark: '#d1a041' },
  '--dsw-alias-state-warn-label': { light: '#5a4815', dark: '#d1a041' },
  '--dsw-alias-state-warn-tertiary': { light: '#f6eedf', dark: '#483a0f' },
  '--dsw-alias-state-business-primary': { light: DSHC_CLAY, dark: DSHC_CLAY_HOVER },
  '--dsw-alias-state-business-tertiary': { light: '#f7e7df', dark: '#4a2c21' },

  // Toasts and tooltips stay dark on the light canvas.
  '--dsw-alias-toast-bg': { light: '#262624', dark: '#3a3a37' },
  '--dsw-alias-toast-label': both('#faf9f5'),
  '--dsw-alias-tooltip-bg': { light: '#141413', dark: '#3a3a37' },

  // Typography: system UI sans for text, system serif for the brand display face.
  '--dsh-font-family-text-default': both(DSHC_FONT_SANS),
  '--dsw-font-family-brand': both(DSHC_FONT_SERIF),
})
