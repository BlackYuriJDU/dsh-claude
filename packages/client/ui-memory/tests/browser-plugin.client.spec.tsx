// @vitest-environment jsdom
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { IconContextInjectionOutlineMedium, IconUserOutlineMedium } from '@deepseek-ai/dsh-client-ui-primitives'
import { apply, inject } from '../src/client/index.ts'
import { ProfileBadge } from '../src/client/ProfileBadge.tsx'
import { MEMORY_ENTRY_ID } from '../src/memory.ts'

/** Config forms fake: one observable form per entry, and every watcher served on demand. */
class FakeConfigForms {
  readonly requested: string[] = []
  private readonly watchers = new Set<{ register: () => () => void; off?: () => void }>()
  private value: { profileName?: string } | undefined
  private readonly listeners = new Set<() => void>()
  get(entry: string) {
    this.requested.push(entry)
    return {
      entry,
      getSnapshot: () => ({ value: this.value }),
      subscribe: (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } },
    }
  }
  publish(value: { profileName?: string }): void {
    this.value = value
    for (const listener of [...this.listeners]) listener()
  }
  whileServed(_namespaces: readonly string[], register: () => () => void): () => void {
    const watcher: { register: () => () => void; off?: () => void } = { register }
    this.watchers.add(watcher)
    return () => {
      watcher.off?.()
      this.watchers.delete(watcher)
    }
  }
  serve(): void {
    for (const watcher of this.watchers) watcher.off = watcher.register()
  }
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
  slots.register({ name: 'root', children: { 'settings.section': { kind: 'list', scope: 'root' }, 'settings.section.icon': { kind: 'list', scope: 'root' }, 'settings.launcher.badge': { kind: 'single', scope: 'root' } } } as never, () => null)
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
    expect(subject.slots.entries('settings.section').map(item => item.options.id).sort()).toEqual(['memory', 'profile'])
    const entry = subject.slots.entries('settings.section').find(item => item.options.id === 'memory')
    const profile = subject.slots.entries('settings.section').find(item => item.options.id === 'profile')
    expect(profile?.options.order).toBeLessThan(entry?.options.order ?? 0)
    expect((profile?.options.label as () => string)()).toBe('profile.title')
    expect((profile?.inject as () => { memory: { entry: string } })().memory.entry).toBe(MEMORY_ENTRY_ID)
    expect((entry?.options.label as () => string)()).toBe('title')
    expect((entry?.inject as () => { memory: { entry: string } })().memory.entry).toBe(MEMORY_ENTRY_ID)
    await fiber.dispose()
    expect(subject.slots.entries('settings.section')).toHaveLength(0)
  })

  it('gives the Memory row its own icon and removes it on unload', async () => {
    const subject = await bench()
    const fiber = subject.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    const icons = subject.slots.entries('settings.section.icon')
    expect(icons.find(icon => icon.options.id === 'memory')?.component).toBe(IconContextInjectionOutlineMedium)
    expect(icons.find(icon => icon.options.id === 'profile')?.component).toBe(IconUserOutlineMedium)
    await fiber.dispose()
    expect(subject.slots.entries('settings.section.icon')).toHaveLength(0)
  })

  it('shows the launcher identity badge only while a name is set, and removes it on unload', async () => {
    const subject = await bench()
    const fiber = subject.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    subject.configForms.serve()
    expect(subject.slots.entries('settings.launcher.badge')).toHaveLength(0)
    subject.configForms.publish({ profileName: '  Ana  ' })
    const [badge] = subject.slots.entries('settings.launcher.badge')
    expect(badge?.component).toBe(ProfileBadge)
    expect((badge?.inject as () => { memory: { entry: string } })().memory.entry).toBe(MEMORY_ENTRY_ID)
    subject.configForms.publish({ profileName: 'Ana Paula' })
    expect(subject.slots.entries('settings.launcher.badge')).toHaveLength(1)
    subject.configForms.publish({ profileName: ' ' })
    expect(subject.slots.entries('settings.launcher.badge')).toHaveLength(0)
    subject.configForms.publish({ profileName: 'Ana' })
    expect(subject.slots.entries('settings.launcher.badge')).toHaveLength(1)
    await fiber.dispose()
    expect(subject.slots.entries('settings.launcher.badge')).toHaveLength(0)
  })
})
