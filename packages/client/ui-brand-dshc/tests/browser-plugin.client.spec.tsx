// @vitest-environment jsdom
import { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client'
import { apply, inject } from '../src/client/index.ts'
import { burstSpokes, DSHC_WORDMARK, DshcMark, DshcName } from '../src/client/Brand.tsx'
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
  ctx.provide('locale')
  ctx.set('locale', {
    register: (ns: string, dicts: Record<string, unknown>) => { dictionaries.set(ns, dicts); return () => { dictionaries.delete(ns) } },
  })
  const slots = ctx.get('slots') as SlotRegistry
  const declareHoles = () => slots.register({
    name: 'root',
    children: Object.fromEntries(HOLES.map(name => [name, { kind: 'single', scope: 'root' }])),
  } as never, () => null)
  const disposeHoles = declare ? declareHoles() : undefined
  return { ctx, slots, theme, dictionaries, declareHoles, disposeHoles }
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

    await fiber.dispose()
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
      expect(name).toMatch(/^--(dsw|dsh)-/)
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
    expect(DSHC_TOKENS['--dsw-alias-label-tertiary']).toEqual({ light: '#73726c', dark: '#9c9a92' })
    expect(DSHC_TOKENS['--dsw-alias-button-primary-fill']).toEqual({ light: '#141413', dark: '#faf9f5' })
    expect(DSHC_TOKENS['--dsw-alias-button-info-fill']).toEqual({ light: DSHC_CLAY, dark: DSHC_CLAY })
  })
})

describe('DSHC artwork', () => {
  it('draws eight clay spokes at the requested size', () => {
    const { container } = render(<DshcMark size={24} className="mark" />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('24')
    expect(svg?.getAttribute('class')).toBe('mark')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    const paths = container.querySelectorAll('path')
    expect(paths).toHaveLength(8)
    expect(paths[0]?.getAttribute('stroke')).toBe(DSHC_CLAY)
    expect(burstSpokes(24)).toHaveLength(8)
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
