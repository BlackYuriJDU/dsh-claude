// @vitest-environment jsdom
import { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { SessionId } from '@deepseek-ai/dsh-session/types'
import { apply, inject } from '../src/client/index.ts'
import { DshcSuggestions, SUGGESTION_PROMPTS, type DshcSuggestionsInjected } from '../src/client/Suggestions.tsx'
import { en, type BrandDshcKey } from '../src/client/locales.ts'

afterEach(() => { cleanup() })

const t = (key: BrandDshcKey): string => en[key]

function mount(pickIndex: (count: number) => number = () => 0) {
  const fill = vi.fn<(text: string) => void>()
  render(<DshcSuggestions fill={fill} pickIndex={pickIndex} t={t as never} />)
  return { fill }
}

describe('DSHC starting suggestions', () => {
  it('opens a category, fills the chosen prompt, and closes the list', () => {
    const { fill } = mount()
    const pills = within(screen.getByRole('group', { name: en['suggest.group'] })).getAllByRole('button')
    expect(pills.map(pill => pill.textContent)).toEqual(['Write', 'Learn', 'Code', 'Life stuff', "DSHC's choice"])
    fireEvent.click(screen.getByRole('button', { name: 'Code' }))
    expect(screen.getByRole('button', { name: 'Code' }).getAttribute('aria-expanded')).toBe('true')
    const list = screen.getByRole('list', { name: 'Code' })
    expect(within(list).getAllByRole('button').map(button => button.textContent))
      .toEqual([en['suggest.code.1'], en['suggest.code.2'], en['suggest.code.3']])
    fireEvent.click(within(list).getByRole('button', { name: en['suggest.code.2'] }))
    expect(fill).toHaveBeenCalledWith(en['suggest.code.2'])
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('closes an open category when its pill is pressed again', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Learn' }))
    expect(screen.getByRole('list', { name: 'Learn' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Learn' }))
    expect(screen.queryByRole('list')).toBeNull()
  })

  it("fills the prompt DSHC's choice picks from every category", () => {
    const pickIndex = vi.fn(() => SUGGESTION_PROMPTS.length - 1)
    const { fill } = mount(pickIndex)
    expect(SUGGESTION_PROMPTS).toHaveLength(12)
    fireEvent.click(screen.getByRole('button', { name: "DSHC's choice" }))
    expect(pickIndex).toHaveBeenCalledWith(12)
    expect(fill).toHaveBeenCalledWith(en['suggest.life.3'])
  })

  it('falls back to the first prompt when the pick is out of range', () => {
    const { fill } = mount(() => 99)
    fireEvent.click(screen.getByRole('button', { name: "DSHC's choice" }))
    expect(fill).toHaveBeenCalledWith(en['suggest.write.1'])
  })
})

/**
 * Recognize the suggestions face among erased slot inject results.
 * @param value - one inject result.
 * @returns whether it carries both verbs.
 */
function isSuggestionsFace(value: Record<string, unknown> | undefined): value is Record<string, unknown> & DshcSuggestionsInjected {
  return typeof value?.fill === 'function' && typeof value.pickIndex === 'function'
}

/**
 * Read the registered face through its erased slot signature.
 * @param inject - the stored entry's inject function.
 * @param sessionId - Session the face is built for.
 * @returns the face.
 */
function faceOf(inject: ((...args: never[]) => Record<string, unknown>) | undefined, sessionId: SessionId): DshcSuggestionsInjected {
  const face = inject?.(sessionId as never)
  if (!isSuggestionsFace(face)) throw new Error('suggestions face is incomplete')
  return face
}

describe('DSHC suggestions registration', () => {
  async function bench(withSessions: boolean) {
    const ctx = new Context()
    await ctx.plugin(SlotRegistry).await()
    ctx.provide('theme')
    ctx.set('theme', { overrideTokens: () => () => undefined })
    ctx.provide('locale')
    ctx.set('locale', { register: () => () => undefined, registerProductName: () => () => undefined })
    const setDraft = vi.fn<(text: string) => void>()
    const focus = vi.fn()
    const scope = { get: (name: string) => name === 'conversation' ? { input: { for: () => ({ setDraft, focus }) } } : undefined }
    if (withSessions) {
      ctx.provide('sessions')
      ctx.set('sessions', { scope: (id: string) => id === 'known' ? scope : undefined })
    }
    const slots = ctx.get('slots') as SlotRegistry
    slots.register({ name: 'root', children: { 'conversation.hero.suggestions': { kind: 'list', scope: 'session' } } } as never, () => null)
    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    return { slots, fiber, setDraft, focus }
  }

  it('fills the known Session draft, ignores an unknown Session, and leaves on unload', async () => {
    const b = await bench(true)
    const [entry] = b.slots.entries('conversation.hero.suggestions')
    expect(entry?.options.id).toBe('dshc-suggestions')
    const face = faceOf(entry?.inject, SessionId('known'))
    face.fill('hello')
    expect(b.setDraft).toHaveBeenCalledWith('hello')
    expect(b.focus).toHaveBeenCalledOnce()
    faceOf(entry?.inject, SessionId('gone')).fill('x')
    expect(b.setDraft).toHaveBeenCalledOnce()
    const index = face.pickIndex(3)
    expect(index >= 0 && index < 3 && Number.isInteger(index)).toBe(true)
    await b.fiber.dispose()
    expect(b.slots.entries('conversation.hero.suggestions')).toHaveLength(0)
  })

  it('shows no suggestions without the Session registry', async () => {
    const b = await bench(false)
    expect(b.slots.entries('conversation.hero.suggestions')).toHaveLength(0)
  })
})
