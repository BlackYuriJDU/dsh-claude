import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import * as memoryPlugin from '../src/index.ts'
import { MEMORY_CONTEXT_NAME, MEMORY_CONTEXT_ORDER, memoryContextText } from '../src/memory.ts'

const item = (text: string, id = text) => ({ id, text })
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

  it('contributes nothing when not even the first memory fits', () => {
    expect(memoryContextText([item('x'.repeat(500))], HEADER.length + 10)).toBe('')
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
    const fiber = ctx.plugin(memoryPlugin, { memories: [item('Prefers short answers')], maxChars: 8000 })
    await fiber.await()
    expect(configured).toEqual([{ auto: false }])
    expect(contexts).toHaveLength(1)
    expect(contexts[0]).toMatchObject({ name: MEMORY_CONTEXT_NAME, order: MEMORY_CONTEXT_ORDER, interpolate: false })
    expect(contexts[0]!.text()).toBe(`${HEADER}\n- Prefers short answers`)
    await fiber.dispose()
  })
})
