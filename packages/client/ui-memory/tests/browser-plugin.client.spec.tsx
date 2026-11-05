// @vitest-environment jsdom
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { IconContextInjectionOutlineMedium } from '@deepseek-ai/dsh-client-ui-primitives'
import { apply, inject } from '../src/client/index.ts'
import { MEMORY_ENTRY_ID } from '../src/memory.ts'

/** Config forms fake: records the requested entry and lets the test serve it. */
class FakeConfigForms {
  readonly requested: string[] = []
  private register: (() => () => void) | undefined
  private off: (() => void) | undefined
  get(entry: string) {
    this.requested.push(entry)
    return { entry }
  }
  whileServed(_namespaces: readonly string[], register: () => () => void): () => void {
    this.register = register
    return () => { this.off?.() }
  }
  serve(): void { this.off = this.register?.() }
}

async function bench() {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  const configForms = new FakeConfigForms()
  const registered: string[] = []
  ctx.provide('configForms')
  ctx.set('configForms', configForms)
  ctx.provide('locale')
  ctx.set('locale', {
    register: (ns: string) => { registered.push(ns); return () => undefined },
    bind: () => (key: string) => key,
  })
  const slots = ctx.get('slots') as SlotRegistry
  slots.register({ name: 'root', children: { 'settings.section': { kind: 'list', scope: 'root' }, 'settings.section.icon': { kind: 'list', scope: 'root' } } } as never, () => null)
  return { ctx, slots, configForms, registered }
}

describe('ui-memory browser plugin', () => {
  it('declares the services it reads', () => {
    expect(inject).toEqual(['slots', 'locale', 'configForms'])
  })

  it('shows the Memory section only while the Host serves the entry, and removes it on unload', async () => {
    const subject = await bench()
    const fiber = subject.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    expect(subject.registered).toEqual(['memory'])
    expect(subject.configForms.requested).toEqual([MEMORY_ENTRY_ID])
    expect(subject.slots.entries('settings.section')).toHaveLength(0)
    subject.configForms.serve()
    const [entry] = subject.slots.entries('settings.section')
    expect(entry?.options.id).toBe('memory')
    expect((entry?.options.label as () => string)()).toBe('title')
    expect((entry?.inject as () => unknown)()).toEqual({ memory: { entry: MEMORY_ENTRY_ID } })
    await fiber.dispose()
    expect(subject.slots.entries('settings.section')).toHaveLength(0)
  })

  it('gives the Memory row its own icon and removes it on unload', async () => {
    const subject = await bench()
    const fiber = subject.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    const [icon] = subject.slots.entries('settings.section.icon')
    expect(icon?.options.id).toBe('memory')
    expect(icon?.component).toBe(IconContextInjectionOutlineMedium)
    await fiber.dispose()
    expect(subject.slots.entries('settings.section.icon')).toHaveLength(0)
  })
})
