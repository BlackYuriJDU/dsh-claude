import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import * as memoryPlugin from '../src/index.ts'
import {
  MEMORY_CONTEXT_NAME, MEMORY_CONTEXT_ORDER, memoryContextText, PROFILE_CONTEXT_NAME, PROFILE_CONTEXT_ORDER, profileContextText,
} from '../src/memory.ts'

const item = (text: string, id = text) => ({ id, text })
const PROFILE_HEADER = 'The person set these in Settings. They apply to this and every session; follow them unless the person says otherwise in this conversation:'
const HEADER = 'Memories the person saved in Settings. They apply to this and every session; follow them unless the person says otherwise in this conversation:'

describe('memoryContextText', () => {
  it('contributes nothing without non-blank memories', () => {
    expect(memoryContextText([], 8000)).toBe('')
    expect(memoryContextText([item('  '), item('')], 8000)).toBe('')
  })

  it('lists trimmed memories in order under one header', () => {
    expect(memoryContextText([item(' Prefers pt-BR '), item('Uses pnpm')], 8000))
      .toBe(`${HEADER}\n- Prefers pt-BR\n- Uses pnpm`)
  })

  it('keeps the complete text within the bound and reports what it omitted', () => {
    const memories = [item('a'.repeat(40)), item('b'.repeat(40)), item('c'.repeat(40))]
    const full = memoryContextText(memories, 100_000)
    const limit = full.length - 1
    const bounded = memoryContextText(memories, limit)
    expect(bounded.length).toBeLessThanOrEqual(limit)
    expect(bounded).toContain('more saved memories omitted to fit the limit')
    expect(memoryContextText(memories, full.length)).toBe(full)
  })

  it('skips a memory that does not fit, keeps the later ones in order, and counts it as omitted', () => {
    const omitted = '\n(1 more saved memories omitted to fit the limit.)'
    const kept = `${HEADER}\n- small\n- tail`
    const memories = [item('x'.repeat(500)), item('small'), item('tail')]
    expect(memoryContextText(memories, kept.length + omitted.length)).toBe(kept + omitted)
  })

  it('says every memory was omitted when only the header fits, and contributes nothing below that', () => {
    const allOmitted = `${HEADER}\n(1 more saved memories omitted to fit the limit.)`
    expect(memoryContextText([item('x'.repeat(500))], allOmitted.length)).toBe(allOmitted)
    expect(memoryContextText([item('x'.repeat(500))], allOmitted.length - 1)).toBe('')
  })
})

describe('ui-memory Host plugin', () => {
  it('registers a live, uninterpolated runtime context and hands Settings its own page', async () => {
    const contexts: { name: string; order: number; interpolate?: boolean; text: () => string }[] = []
    const configured: unknown[] = []
    const ctx = new Context()
    ctx.provide('settings')
    ctx.set('settings', { configure: (presentation: unknown) => { configured.push(presentation); return () => undefined } })
    ctx.provide('systemPrompt')
    ctx.set('systemPrompt', { context: (entry: (typeof contexts)[number]) => { contexts.push(entry); return () => undefined } })
    const fiber = ctx.plugin(memoryPlugin, { memories: [item('Prefers short answers')], profileName: 'Ana', instructions: 'Be brief.', maxChars: 8000 })
    await fiber.await()
    expect(configured).toEqual([{ auto: false }])
    expect(contexts.map(entry => entry.name)).toEqual([PROFILE_CONTEXT_NAME, MEMORY_CONTEXT_NAME])
    expect(contexts[0]).toMatchObject({ order: PROFILE_CONTEXT_ORDER, interpolate: false })
    expect(contexts[0]!.text()).toBe(`${PROFILE_HEADER}\n- Call them Ana.\n- Their instructions:\nBe brief.`)
    expect(contexts[1]).toMatchObject({ name: MEMORY_CONTEXT_NAME, order: MEMORY_CONTEXT_ORDER, interpolate: false })
    expect(contexts[1]!.text()).toBe(`${HEADER}\n- Prefers short answers`)
    expect(PROFILE_CONTEXT_ORDER).toBeLessThan(MEMORY_CONTEXT_ORDER)
    await fiber.dispose()
  })
})

describe('profileContextText', () => {
  it('renders nothing until a name or instructions are set', () => {
    expect(profileContextText('  ', '\n', 8000)).toBe('')
  })

  it('renders the name alone, the instructions alone, or both', () => {
    expect(profileContextText(' Ana ', '', 8000)).toBe(`${PROFILE_HEADER}\n- Call them Ana.`)
    expect(profileContextText('', ' Be brief. ', 8000)).toBe(`${PROFILE_HEADER}\n- Their instructions:\nBe brief.`)
  })

  it('shortens the instructions to fit and says so, keeping the complete text within the bound', () => {
    const full = profileContextText('Ana', 'x'.repeat(500), 8000)
    const bound = full.length - 100
    const text = profileContextText('Ana', 'x'.repeat(500), bound)
    expect(text.length).toBe(bound)
    expect(text.startsWith(`${PROFILE_HEADER}\n- Call them Ana.\n- Their instructions:\nxxx`)).toBe(true)
    expect(text.endsWith('\n(Instructions shortened to fit the limit.)')).toBe(true)
  })

  it('keeps only the name when not even a shortened excerpt fits, and nothing when the name does not fit', () => {
    const nameOnly = `${PROFILE_HEADER}\n- Call them Ana.`
    expect(profileContextText('Ana', 'x'.repeat(500), nameOnly.length + 10)).toBe(nameOnly)
    expect(profileContextText('', 'x'.repeat(500), nameOnly.length + 10)).toBe('')
    expect(profileContextText('Ana', '', nameOnly.length - 1)).toBe('')
  })
})
