// @vitest-environment jsdom
import { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client'
import { apply, inject } from '../src/client/index.ts'
import { DSHC_MONOGRAM, DSHC_WORDMARK, DshcMark, DshcName } from '../src/client/Brand.tsx'
import { DSHC_CLAY, DSHC_TOKEN_SOURCE, DSHC_TOKENS } from '../src/client/tokens.ts'
import { DshcGreeting, greetingKey, type DshcGreetingProps } from '../src/client/Greeting.tsx'
import { en } from '../src/client/locales.ts'
import { apply as hostApply } from '../src/index.ts'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const HOLES = ['sidebar.brand.mark', 'sidebar.brand.name', 'conversation.hero.brand.mark', 'conversation.hero.headline'] as const

/** Minimal theme service: records the live override layers by source. */
class FakeTheme {
  readonly layers = new Map<string, ThemeTokenOverrides>()
  overrideTokens(source: string, tokens: ThemeTokenOverrides): () => void {
    this.layers.set(source, tokens)
    return () => { this.layers.delete(source) }
  }
}

async function bench(declare = true) {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  const theme = new FakeTheme()
  ctx.provide('theme')
  ctx.set('theme', theme)
  const dictionaries = new Map<string, Record<string, unknown>>()
  const products: string[] = []
  ctx.provide('locale')
  ctx.set('locale', {
    register: (ns: string, dicts: Record<string, unknown>) => { dictionaries.set(ns, dicts); return () => { dictionaries.delete(ns) } },
    registerProductName: (name: string) => { products.push(name); return () => { products.splice(products.indexOf(name), 1) } },
  })
  const slots = ctx.get('slots') as SlotRegistry
  const declareHoles = () => slots.register({
    name: 'root',
    children: Object.fromEntries(HOLES.map(name => [name, { kind: 'single', scope: 'root' }])),
  } as never, () => null)
  const disposeHoles = declare ? declareHoles() : undefined
  return { ctx, slots, theme, dictionaries, products, declareHoles, disposeHoles }
}

describe('DSHC browser-brand plugin', () => {
  it('keeps the host Loader entry inert', () => {
    expect(hostApply).not.toThrow()
  })

  it('declares the slot, theme, and locale services it uses', () => {
    expect(inject).toEqual(['slots', 'theme', 'locale'])
  })

  it('stacks the palette layer and fills every brand slot until teardown', async () => {
    const subject = await bench()
    const fiber = subject.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    expect(subject.theme.layers.get(DSHC_TOKEN_SOURCE)).toBe(DSHC_TOKENS)
    expect(Object.keys(subject.dictionaries.get('brand.dshc') ?? {}).sort()).toEqual(['de', 'en', 'es', 'fr', 'ja', 'pt', 'ru', 'zh'])
    for (const hole of HOLES) expect(subject.slots.entries(hole)).toHaveLength(1)
    expect(subject.slots.entries('conversation.hero.headline')[0]?.locale).toBe('brand.dshc')
    expect(subject.products).toEqual([DSHC_WORDMARK])

    await fiber.dispose()
    expect(subject.products).toEqual([])
    expect(subject.theme.layers.has(DSHC_TOKEN_SOURCE)).toBe(false)
    expect(subject.dictionaries.has('brand.dshc')).toBe(false)
    for (const hole of HOLES) expect(subject.slots.entries(hole)).toHaveLength(0)
  })

  it('fills slots declared after apply and withdraws them with the declaration', async () => {
    const subject = await bench(false)
    await subject.ctx.plugin({ inject: [...inject], apply }).await()
    for (const hole of HOLES) expect(subject.slots.entries(hole)).toHaveLength(0)
    const dispose = subject.declareHoles()
    await Promise.resolve()
    for (const hole of HOLES) expect(subject.slots.entries(hole)).toHaveLength(1)
    dispose()
    for (const hole of HOLES) expect(subject.slots.entries(hole)).toHaveLength(0)
  })
})

describe('DSHC palette', () => {
  it('names both color schemes for every token', () => {
    for (const [name, modes] of Object.entries(DSHC_TOKENS)) {
      expect(name).toMatch(/^--(dsw|dsh|shiki)-/)
      expect(typeof modes.light).toBe('string')
      expect(typeof modes.dark).toBe('string')
    }
  })

  it('pins the Claude-app surfaces, text, and clay accent', () => {
    expect(DSHC_TOKENS['--dsw-alias-bg-base']).toEqual({ light: '#faf9f5', dark: '#262624' })
    expect(DSHC_TOKENS['--dsw-alias-bg-layer-1']).toEqual({ light: '#ffffff', dark: '#30302e' })
    expect(DSHC_TOKENS['--dsw-specific-sidebar-fill']).toEqual({ light: '#f5f4ed', dark: '#1f1e1d' })
    expect(DSHC_TOKENS['--dsw-alias-label-primary']).toEqual({ light: '#141413', dark: '#faf9f5' })
    expect(DSHC_TOKENS['--dsw-alias-label-secondary']).toEqual({ light: '#3d3d3a', dark: '#c2c0b6' })
    expect(DSHC_TOKENS['--dsw-alias-label-tertiary']).toEqual({ light: '#686761', dark: '#a5a39b' })
    expect(DSHC_TOKENS['--dsw-alias-button-primary-fill']).toEqual({ light: '#141413', dark: '#faf9f5' })
    expect(DSHC_TOKENS['--dsw-alias-button-info-fill']).toEqual({ light: DSHC_CLAY, dark: DSHC_CLAY })
  })
})

/** WCAG relative luminance of a `#rrggbb` color. */
function luminance(hex: string): number {
  const channel = (offset: number) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

/** WCAG contrast ratio between two `#rrggbb` colors. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

describe('DSHC contrast', () => {
  const token = (name: string) => DSHC_TOKENS[name]!

  it('keeps the business accent at WCAG AA on the canvas, cards, and sidebar', () => {
    const accent = token('--dsw-alias-state-business-primary')
    for (const surface of ['--dsw-alias-bg-base', '--dsw-alias-bg-layer-1', '--dsw-specific-sidebar-fill']) {
      expect(contrast(accent.light, token(surface).light)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(accent.dark, token(surface).dark)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('keeps every code highlight color at WCAG AA on the code block', () => {
    const block = token('--dsw-alias-markdown-code-block')
    const highlights = Object.keys(DSHC_TOKENS).filter(name => name.startsWith('--shiki-token-'))
    expect(highlights).toHaveLength(9)
    for (const name of highlights) {
      expect(contrast(token(name).light, block.light)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(token(name).dark, block.dark)).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('DSHC artwork', () => {
  it('draws the clay monogram tile with the wordmark initial at the requested size', () => {
    const { container } = render(<DshcMark size={24} className="mark" />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('24')
    expect(svg?.getAttribute('height')).toBe('24')
    expect(svg?.getAttribute('class')).toBe('mark')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelector('rect')?.getAttribute('fill')).toBe(DSHC_CLAY)
    expect(container.querySelector('path')).toBeNull()
    expect(container.querySelector('text')?.textContent).toBe(DSHC_MONOGRAM)
    expect(DSHC_MONOGRAM).toBe('D')
  })

  it('renders the serif wordmark', () => {
    const { container } = render(<DshcName />)
    expect(container.textContent).toBe(DSHC_WORDMARK)
  })
})

describe('DSHC hero greeting', () => {
  it('splits the day at noon and at 18:00', () => {
    expect([0, 11, 12, 17, 18, 23].map(greetingKey))
      .toEqual(['greeting.morning', 'greeting.morning', 'greeting.afternoon', 'greeting.afternoon', 'greeting.evening', 'greeting.evening'])
  })

  it('greets by the local clock in the brand serif and keeps the host class', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 4, 19, 30))
    const t: DshcGreetingProps['t'] = key => (en as Record<string, string>)[key] ?? key
    const { container } = render(<DshcGreeting className="title" t={t} />)
    const span = container.querySelector('span')
    expect(span?.textContent).toBe('Good evening')
    expect(span?.getAttribute('class')).toBe('title')
    expect(span?.style.fontFamily).toMatch(/^ui-serif, Georgia/)
  })
})
