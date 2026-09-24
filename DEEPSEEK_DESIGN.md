---
version: alpha
name: DeepSeek-design-analysis
description: A warm-canvas editorial interface for DeepSeek's Harness product, inspired by Anthropic's Claude design language. The system anchors on a tinted cream canvas with serif display headlines, warm coral CTAs, and deep navy product surfaces. Brand voltage comes from the cream/coral pairing — deliberately warm and humanist where most AI brands use cool blue + slate. DeepSeek's signature blue (#4F6FEF) is integrated as a secondary accent, creating a unique fusion of Claude's editorial warmth and DeepSeek's technical precision.

colors:
  primary: "#cc785c"
  primary-active: "#a9583e"
  primary-disabled: "#e6dfd8"
  ink: "#141413"
  body: "#3d3d3a"
  body-strong: "#252523"
  muted: "#6c6a64"
  muted-soft: "#8e8b82"
  hairline: "#e6dfd8"
  hairline-soft: "#ebe6df"
  canvas: "#faf9f5"
  surface-soft: "#f5f0e8"
  surface-card: "#efe9de"
  surface-cream-strong: "#e8e0d2"
  surface-dark: "#181715"
  surface-dark-elevated: "#252320"
  surface-dark-soft: "#1f1e1b"
  on-primary: "#ffffff"
  on-dark: "#faf9f5"
  on-dark-soft: "#a09d96"
  accent-teal: "#5db8a6"
  accent-amber: "#e8a55a"
  accent-deepseek: "#4F6FEF"
  accent-deepseek-soft: "#6B8AFF"
  success: "#5db872"
  warning: "#d4a017"
  error: "#c64545"

typography:
  display-xl:
    fontFamily: "Copernicus, Tiempos Headline, Cormorant Garamond, serif"
    fontSize: 64px
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: -1.5px
  display-lg:
    fontFamily: "Copernicus, Tiempos Headline, Cormorant Garamond, serif"
    fontSize: 48px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -1px
  display-md:
    fontFamily: "Copernicus, Tiempos Headline, Cormorant Garamond, serif"
    fontSize: 36px
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: -0.5px
  display-sm:
    fontFamily: "Copernicus, Tiempos Headline, Cormorant Garamond, serif"
    fontSize: 28px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: -0.3px
  title-lg:
    fontFamily: "StyreneB, Inter, -apple-system, sans-serif"
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0
  title-md:
    fontFamily: "StyreneB, Inter, -apple-system, sans-serif"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  title-sm:
    fontFamily: "StyreneB, Inter, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  body-md:
    fontFamily: "StyreneB, Inter, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  body-sm:
    fontFamily: "StyreneB, Inter, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  caption:
    fontFamily: "StyreneB, Inter, -apple-system, sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  caption-uppercase:
    fontFamily: "StyreneB, Inter, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 1.5px
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  button:
    fontFamily: "StyreneB, Inter, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0
  nav-link:
    fontFamily: "StyreneB, Inter, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 40px
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-primary-disabled:
    backgroundColor: "{colors.primary-disabled}"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 40px
  button-secondary-on-dark:
    backgroundColor: "{colors.surface-dark-elevated}"
    textColor: "{colors.on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
  button-text-link:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.button}"
  button-icon-circular:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: 36px
  text-link:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 64px
  hero-band:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.display-xl}"
    padding: 96px
  hero-illustration-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
  feature-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  product-mockup-card-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  code-window-card:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.code}"
    rounded: "{rounded.lg}"
    padding: 24px
  model-comparison-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  pricing-tier-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.title-lg}"
    rounded: "{rounded.lg}"
    padding: 32px
  pricing-tier-card-featured:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.title-lg}"
    rounded: "{rounded.lg}"
    padding: 32px
  callout-card-coral:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  connector-tile:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.lg}"
    padding: 20px
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 10px 14px
    height: 40px
  text-input-focused:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  cookie-consent-card:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: 24px
  category-tab:
    backgroundColor: transparent
    textColor: "{colors.muted}"
    typography: "{typography.nav-link}"
    padding: 8px 14px
    rounded: "{rounded.md}"
  category-tab-active:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    rounded: "{rounded.md}"
  badge-pill:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  badge-coral:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  cta-band-coral:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.display-sm}"
    rounded: "{rounded.lg}"
    padding: 64px
  cta-band-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.display-sm}"
    rounded: "{rounded.lg}"
    padding: 64px
  footer:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark-soft}"
    typography: "{typography.body-sm}"
    padding: 64px
---

## Overview

DeepSeek Harness com DeepSeek Design é uma interface editorial warm-canvas que funde a estética literária do Claude com a identidade técnica do DeepSeek. A base atmosférica é um **canvas cream** (`{colors.canvas}` — #faf9f5) — distintamente quente, deliberadamente não o cinza-branco frio que outras marcas de IA usam. Headlines usam **slab-serif display** (Cormorant Garamond / Tiempos Headline) em peso 400 com letter-spacing negativo, pareado com **StyreneB / Inter** para body. A combinação se sente como uma publicação literária, não uma página de marketing SaaS.

A tensão de marca vem do **par cream + coral** — coral (`{colors.primary}` — #cc785c) é o acento signature, usado em CTAs primários e cards de destaque. O **azul DeepSeek** (`{colors.accent-deepseek}` — #4F6FEF) aparece como acento secundário em indicadores de status, conexões ativas e elementos técnicos — criando uma fusão única entre calor editorial e precisão técnica.

O sistema tem três modos de surface que alternam:
1. **Cream canvas** (`{colors.canvas}`) — piso padrão do body
2. **Light cream cards** (`{colors.surface-card}`) — backgrounds de feature cards
3. **Dark navy product surfaces** (`{colors.surface-dark}`) — code editors, model showcase cards, pre-footer CTAs, footer

A contrast cream-to-dark é o ritmo de pacing da página.

**Key Characteristics:**
- Warm cream canvas (`{colors.canvas}` — #faf9f5) com dark warm-ink text (`{colors.ink}` — #141413). A escolha de cor definidora da marca.
- Coral primary CTA (`{colors.primary}` — #cc785c). Usado escassamente em botões individuais, generosamente em cards de callout coral.
- Slab-serif display headlines via Cormorant Garamond / Tiempos Headline em weight 400 com negative letter-spacing. Pareado com humanist sans body para uma voz editorial literária.
- Dark navy product mockup cards (`{colors.surface-dark}` — #181715) carregando code blocks, terminal panels, model comparison data.
- Light cream feature cards (`{colors.surface-card}` — #efe9de) — ligeiramente mais escuro que canvas, usado para explicações de features.
- DeepSeek blue accent (`{colors.accent-deepseek}` — #4F6FEF) — usado em conectores ativos, indicadores de status, e elementos técnicos.
- Border radius hierárquico: `{rounded.md}` (8px) para buttons + inputs, `{rounded.lg}` (12px) para content + product cards, `{rounded.xl}` (16px) para hero illustration container, `{rounded.pill}` para badges.
- Section rhythm `{spacing.section}` (96px) — padrão modern-SaaS.

## Colors

### Brand & Accent
- **Coral / Primary** (`{colors.primary}` — #cc785c): O coral warm signature. Usado em CTAs primários, cards de callout coral, e acentos da marca.
- **Coral Active** (`{colors.primary-active}` — #a9583e): Variante press/hover mais escura.
- **Coral Disabled** (`{colors.primary-disabled}` — #e6dfd8): Estado disabled desaturado cream-tinted.
- **DeepSeek Blue** (`{colors.accent-deepseek}` — #4F6FEF): Acento técnico do DeepSeek. Usado em indicadores de conexão ativa, status dots, e elementos técnicos.
- **DeepSeek Blue Soft** (`{colors.accent-deepseek-soft}` — #6B8AFF): Variante mais clara para hover states e backgrounds de highlight.
- **Accent Teal** (`{colors.accent-teal}` — #5db8a6): Usado parcimoniosamente em surfaces secundários.
- **Accent Amber** (`{colors.accent-amber}` — #e8a55a): Tom warm companion para badges e highlights.

### Surface
- **Canvas** (`{colors.canvas}` — #faf9f5): O piso padrão da página. Cream tintado — quente, deliberadamente não branco puro.
- **Surface Soft** (`{colors.surface-soft}` — #f5f0e8): Divisores de seção, backgrounds de bandas muito suaves.
- **Surface Card** (`{colors.surface-card}` — #efe9de): Feature cards, content cards. Um passo mais escuro que canvas.
- **Surface Cream Strong** (`{colors.surface-cream-strong}` — #e8e0d2): Variante cream mais forte para tabs selecionados e bandas de seção enfatizadas.
- **Surface Dark** (`{colors.surface-dark}` — #181715): Code editor mockups, model showcase cards, footer. A surface dark dominante.
- **Surface Dark Elevated** (`{colors.surface-dark-elevated}` — #252320): Cards elevados dentro de bandas dark.
- **Surface Dark Soft** (`{colors.surface-dark-soft}` — #1f1e1b): Dark ligeiramente mais claro, usado para backgrounds de code blocks dentro de cards dark maiores.
- **Hairline** (`{colors.hairline}` — #e6dfd8): O tom de borda 1px em surfaces cream.
- **Hairline Soft** (`{colors.hairline-soft}` — #ebe6df): Divisor barely-visible usado dentro da mesma banda.

### Text
- **Ink** (`{colors.ink}` — #141413): Todas as headlines e textos primários. Dark warm, ligeiramente off-pure-black.
- **Body Strong** (`{colors.body-strong}` — #252523): Parágrafos enfatizados, lead text.
- **Body** (`{colors.body}` — #3d3d3a): Cor padrão de running-text.
- **Muted** (`{colors.muted}` — #6c6a64): Sub-headings, breadcrumbs, textos secundários adjacentes ao footer.
- **Muted Soft** (`{colors.muted-soft}` — #8e8b82): Captions, fine-print, copyright lines.
- **On Primary** (`{colors.on-primary}` — #ffffff): Texto em botões coral.
- **On Dark** (`{colors.on-dark}` — #faf9f5): White cream-tinted usado em surfaces dark.
- **On Dark Soft** (`{colors.on-dark-soft}` — #a09d96): Footer body text, secondary labels em dark mockups.

### Semantic
- **Success** (`{colors.success}` — #5db872): Green status dots, indicadores "available".
- **Warning** (`{colors.warning}` — #d4a017): Warning callouts.
- **Error** (`{colors.error}` — #c64545): Validation errors.

## Typography

### Font Family
O sistema usa **Cormorant Garamond** (ou Tiempos Headline como substituto) como a face display slab-serif para headlines, e **Inter** (ou StyreneB como substituto) como a sans humanist para body, navigation, e UI labels. **JetBrains Mono** lida com code blocks.

O split display/body é editorial:
- Cormorant Garamond serif (weight 400, negative tracking) → h1, h2, h3, hero display
- Inter sans (weight 400-500) → body, navigation, buttons, captions, labels
- JetBrains Mono → todos os code blocks e terminal text

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 64px | 400 | 1.05 | -1.5px | Homepage h1 — Cormorant Garamond serif |
| `{typography.display-lg}` | 48px | 400 | 1.1 | -1px | Section heads — Cormorant Garamond |
| `{typography.display-md}` | 36px | 400 | 1.15 | -0.5px | Sub-section heads, model names — Cormorant Garamond |
| `{typography.display-sm}` | 28px | 400 | 1.2 | -0.3px | Pricing tier names, callout headlines — Cormorant Garamond |
| `{typography.title-lg}` | 22px | 500 | 1.3 | 0 | Pricing plan size labels — Inter |
| `{typography.title-md}` | 18px | 500 | 1.4 | 0 | Feature card titles, intro paragraphs |
| `{typography.title-sm}` | 16px | 500 | 1.4 | 0 | Connector tile titles, list labels |
| `{typography.body-md}` | 16px | 400 | 1.55 | 0 | Default running-text — Inter |
| `{typography.body-sm}` | 14px | 400 | 1.55 | 0 | Footer body, fine-print |
| `{typography.caption}` | 13px | 500 | 1.4 | 0 | Badge labels, captions |
| `{typography.caption-uppercase}` | 12px | 500 | 1.4 | 1.5px | Category tags, "NEW" badges |
| `{typography.code}` | 14px | 400 | 1.6 | 0 | Code blocks — JetBrains Mono |
| `{typography.button}` | 14px | 500 | 1.0 | 0 | Standard button labels |
| `{typography.nav-link}` | 14px | 500 | 1.4 | 0 | Top-nav menu items |

### Principles
Display sizes usam weight 400 (regular), nunca bold. Negative letter-spacing (-0.3 a -1.5px) é essencial — Cormorant Garamond sem ele lê como off-brand. O caráter serif é o que dá ao DeepSeek Design sua voz literária e considerada; trocar para sans-serif display faria parecer como qualquer outra ferramenta de IA.

Body type permanece em weight 400 para parágrafos, weight 500 para labels e frases enfatizadas. A sans body é humanist (Inter) — nunca geométrica.

### Note on Font Substitutes
Se Cormorant Garamond / Tiempos Headline não estiverem disponíveis, **EB Garamond** em weight 500 com -0.02em letter-spacing é a aproximação open-source mais próxima. Para Inter, **Söhne** é outra alternativa próxima se licenciada.

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 96px.
- **Section padding:** `{spacing.section}` (96px).
- **Card internal padding:** `{spacing.xl}` (32px) para feature cards, pricing tier cards, model comparison cards; `{spacing.lg}` (24px) para code-window cards e connector tiles.
- **Callout / CTA bands:** `{spacing.xxl}` (48px) dentro de coral callout cards; 64px dentro da larger dark CTA band.

### Grid & Container
- **Max content width:** ~1200px centered.
- **Editorial body:** Single 12-column grid; hero frequentemente usa split 6/6.
- **Feature card grids:** 3-up em desktop, 2-up em tablet, 1-up em mobile.
- **Connector tile grids:** 4-up ou 6-up em desktop, 2-up em tablet, 1-up em mobile.
- **Pricing grid:** 3-up em desktop, 1-up em mobile.

### Whitespace Philosophy
O cream canvas + serif display + generous internal padding criam um pacing editorial — DeepSeek Harness lê como uma coluna de long-form magazine rather than um template de marketing. Whitespace entre bandas permanece uniforme em 96px; whitespace dentro de cards é generoso (32px), deixando o type respirar.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no border | Body sections, top nav, hero bands |
| Soft hairline | 1px `{colors.hairline}` border | Inputs, sub-nav, ocasionalmente em cards |
| Cream card | `{colors.surface-card}` background — no shadow | Feature cards, content cards |
| Dark surface card | `{colors.surface-dark}` background — no shadow | Code editor mockups, model showcase cards |
| Subtle drop shadow | Faint shadow at low alpha | Hover-elevated states (`0 1px 3px rgba(20,20,19,0.08)` raramente) |

A filosofia de elevação é **color-block first, shadow rare**. A maioria da profundidade vem do contraste cream-vs-dark surface. Shadows são mínimas.

### Decorative Depth
- Code editor mockups carregam sua própria profundidade interna: syntax-highlighted text em muted blues / oranges / grays, line numbers em `{colors.muted-soft}`, status bars na parte inferior em `{colors.surface-dark-elevated}`.
- Algumas hero illustrations usam simple line-art com coral e dark-navy strokes em cream — minimal, hand-drawn-feeling, nunca photorealistic.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Badge accents e tiny dropdowns |
| `{rounded.sm}` | 6px | Small inline buttons, dropdown items |
| `{rounded.md}` | 8px | Standard CTA buttons, text inputs, category tabs |
| `{rounded.lg}` | 12px | Content cards (feature, pricing, code-window, model-comparison) |
| `{rounded.xl}` | 16px | Hero illustration container, larger marquee components |
| `{rounded.pill}` | 9999px | Badge pills, "NEW" tags |
| `{rounded.full}` | 9999px / 50% | Avatar substitutes, icon buttons |

## Components

### Top Navigation
**`top-nav`** — Cream nav bar pinned ao topo de cada página. 64px tall, `{colors.canvas}` background. Carrega o wordmark DeepSeek à esquerda, menu horizontal primário center-left, cluster right-side com "Sign in" text-link e "Try DeepSeek" `{component.button-primary}` (coral). Menu items em `{typography.nav-link}` (Inter 14px / 500).

### Buttons
**`button-primary`** — O signature coral CTA. Background `{colors.primary}` (#cc785c), text `{colors.on-primary}` (white), type `{typography.button}` (Inter 14px / 500), padding 12px × 20px, height 40px, rounded `{rounded.md}` (8px). Active state `button-primary-active` escurece para `{colors.primary-active}` (#a9583e).

**`button-secondary`** — Cream button com hairline outline. Background `{colors.canvas}`, text `{colors.ink}`, 1px hairline border, mesmo padding + height + radius que primary.

**`button-secondary-on-dark`** — Usado sobre `{colors.surface-dark}` cards. Background `{colors.surface-dark-elevated}` (#252320), text `{colors.on-dark}`.

**`button-text-link`** — Inline text button, sem background. Usado para "Sign in" no top nav e inline CTA links.

**`button-icon-circular`** — 36px circular icon button. Background `{colors.canvas}`, hairline border, ink-color icon.

**`text-link`** — Inline body links em `{colors.primary}` (coral). Underlined on press.

### Cards & Containers
**`hero-band`** — Cream-canvas hero com grid: h1 + sub-headline + button row à esquerda, hero illustration card ou product mockup card à direita. Vertical padding `{spacing.section}` (96px).

**`hero-illustration-card`** — Card maior segurando o artifact do hero — às vezes uma coral-stroke line illustration em cream background, às vezes um dark code editor mockup.

**`feature-card`** — Usado em grids 3-up. Background `{colors.surface-card}` (#efe9de), rounded `{rounded.lg}` (12px), internal padding `{spacing.xl}` (32px). Carrega um small icon no topo, headline `{typography.title-md}`, e body description em `{typography.body-md}`.

**`product-mockup-card-dark`** — Dark navy card mostrando product chrome real. Background `{colors.surface-dark}`, rounded `{rounded.lg}`, internal padding `{spacing.xl}` (32px).

**`code-window-card`** — Card dark especializado mostrando code editor com line numbers, syntax-highlighted code em `{typography.code}` (JetBrains Mono), e às vezes um painel de terminal output abaixo. Background `{colors.surface-dark}` com `{colors.surface-dark-soft}` para o inner code block.

**`model-comparison-card`** — Usado na seção "Which problem are you up against?" comparando modelos. Background `{colors.canvas}` com hairline border, rounded `{rounded.lg}`, internal padding `{spacing.xl}` (32px).

**`pricing-tier-card`** — Standard tier card. Background `{colors.canvas}` com hairline border, rounded `{rounded.lg}`, padding `{spacing.xl}` (32px). Carrega plan name em `{typography.title-lg}` (Inter), price em `{typography.display-sm}` (Cormorant Garamond serif!), feature checklist em `{typography.body-md}`, e `{component.button-primary}` no bottom.

**`pricing-tier-card-featured`** — A featured tier (tipicamente "Pro" ou "Team"). Background flips para `{colors.surface-dark}`, text inverte para `{colors.on-dark}`.

**`callout-card-coral`** — Full-bleed coral card carregando major call-to-action. Background `{colors.primary}` (#cc785c), text `{colors.on-primary}` (white), rounded `{rounded.lg}`, padding `{spacing.xxl}` (48px).

**`connector-tile`** — Usado na grid de integrações. Background `{colors.canvas}` com hairline border, rounded `{rounded.lg}`, padding 20px. Cada tile carrega um logo no topo, `{typography.title-sm}` connector name, e short description.

### Inputs & Forms
**`text-input`** — Standard text input. Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.body-md}`, rounded `{rounded.md}` (8px), padding 10px × 14px, height 40px. 1px hairline border em `{colors.hairline}`.

**`text-input-focused`** — Focus state. Border thickens ou shifts para `{colors.primary}` (coral) para ênfase. Carrega um 3px coral-at-15%-alpha outer ring.

### Tags / Badges
**`badge-pill`** — Small pill label para category tags. Background `{colors.surface-card}`, text `{colors.ink}`, type `{typography.caption}` (13px / 500), rounded `{rounded.pill}`, padding 4px × 12px.

**`badge-coral`** — Coral-fill badge para "NEW", "BETA", featured highlights. Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.caption-uppercase}` (12px / 500 / 1.5px tracking), rounded `{rounded.pill}`, padding 4px × 12px.

**`badge-deepseek`** — DeepSeek blue badge para indicadores técnicos, conexões ativas. Background `{colors.accent-deepseek}`, text `{colors.on-primary}`, type `{typography.caption-uppercase}`, rounded `{rounded.pill}`, padding 4px × 12px.

### Tab / Filter
**`category-tab`** + **`category-tab-active`** — Inactive: transparent background, `{colors.muted}` text. Active: `{colors.surface-card}` background, `{colors.ink}` text. Padding 8px × 14px, rounded `{rounded.md}`.

### CTA / Footer
**`cta-band-coral`** — Pre-footer "Try DeepSeek" CTA card. Full-width coral fill, white type, rounded `{rounded.lg}`, padding 64px. Carrega h2 em `{typography.display-sm}` (serif!), sub-line, e cream-button CTA.

**`cta-band-dark`** — Alternative pre-footer band em developer-focused pages. Background `{colors.surface-dark}`, text `{colors.on-dark}`, rounded `{rounded.lg}`, padding 64px.

**`footer`** — Dark navy footer fechando cada página. Background `{colors.surface-dark}` (#181715), text `{colors.on-dark-soft}`. 4-column link list em desktop. Vertical padding 64px.

## Do's and Don'ts

### Do
- Anchor cada página no cream canvas. Pure white lê como "qualquer outra ferramenta de IA"; o warm tint é o diferenciador de marca.
- Usar Cormorant Garamond serif para cada display headline. Parear com Inter sans body. Negative letter-spacing em display sizes é non-negotiable.
- Reservar `{colors.primary}` (coral) para primary CTAs e full-bleed `{component.callout-card-coral}` moments.
- Usar `{component.product-mockup-card-dark}` e `{component.code-window-card}` para mostrar product chrome real.
- Parear `{component.feature-card}` (cream) com `{component.product-mockup-card-dark}` (navy) em bandas alternadas. O ritmo cream-to-dark é o mecanismo de pacing da marca.
- Aplicar `{spacing.section}` (96px) entre major bands.
- Usar `{colors.accent-deepseek}` (azul) para indicadores técnicos, conexões ativas, e status — não para CTAs primários (isso é coral).

### Don't
- Não usar cool grays ou pure white para canvas. Cream é a marca.
- Não bold serif display weight. Cormorant Garamond em 700 lê como bombástico; o sistema permanece em 400.
- Não usar cool blue ou saturated cyan como brand accent. O coral é a tensão de marca; o azul DeepSeek é acento técnico secundário.
- Não colocar coral em todo lugar. O coral é escasso em elementos individuais e generoso apenas em full-bleed coral callout cards.
- Não usar Inter para display headlines. O caráter serif é a voz da marca.
- Não repetir o mesmo surface mode em duas bandas consecutivas. O pacing alterna: cream → cream-card → dark-mockup → cream → coral-callout → dark-footer.
- Não adicionar hover state styling além do que o sistema já codifica.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px | Hamburger nav; hero h1 64→32px; hero-illustration-card stacks below content; feature grids 1-up; connector tiles 2-up; pricing 1-up; footer 4 cols → 1 |
| Tablet | 768–1024px | Top nav stays horizontal but tightens; feature cards 2-up; connector tiles 3-up; pricing 2-up |
| Desktop | 1024–1440px | Full top-nav com todos os menu items; 3-up feature cards; 4-up ou 6-up connector tiles; 3-up pricing tiers |
| Wide | > 1440px | Same as desktop com mais outer breathing room; max content width caps at 1200px |

## Iteration Guide

1. Focus em ONE component por vez. Reference seu YAML key.
2. Variants de um componente existente (`-active`, `-disabled`, `-focused`) vivem como entries separadas em `components:`.
3. Usar `{token.refs}` em todo lugar — nunca inline hex.
4. Nunca documentar hover. Default e Active/Pressed states only.
5. Display headlines permanecem Cormorant Garamond serif 400 com negative tracking. Body permanece Inter 400. O split é unbreakable.
6. Cream + coral + dark navy é a trindade. Azul DeepSeek é o quarto elemento (acento técnico).
7. Quando em dúvida sobre ênfase: bigger Cormorant Garamond serif antes de bolder weight.

## Known Gaps

- Cormorant Garamond e fontes similares estão disponíveis via Google Fonts. Inter também.
- O spike-mark da Anthropic é um brand glyph; para DeepSeek Design, usamos o logo/wordmark DeepSeek existente.
- Animation e transition timings não estão no escopo deste documento.
- Form validation states além de `{component.text-input-focused}` precisariam de flows adicionais.
- O chat interface real (claude.ai) compartilha alguns tokens com o marketing site mas adiciona muitos componentes product-specific que estão fora do escopo deste documento.
