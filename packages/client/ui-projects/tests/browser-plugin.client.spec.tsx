// @vitest-environment jsdom
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { IconFolderOpenOutlineMedium } from '@deepseek-ai/dsh-client-ui-primitives'
import { apply, inject } from '../src/client/index.ts'
import { PROJECTS_ENTRY_ID } from '../src/projects.ts'

/** Config forms fake: records the requested entry and lets the test serve every watcher of it. */
class FakeConfigForms {
  readonly requested: string[] = []
  private readonly watchers = new Set<{ register: () => () => void; off?: () => void }>()
  get(entry: string) {
    this.requested.push(entry)
    return { entry }
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
  slots.register({ name: 'root', children: {
    'settings.section': { kind: 'list', scope: 'root' },
    'settings.section.icon': { kind: 'list', scope: 'root' },
    'main': { kind: 'keyed', scope: 'root' },
    'sidebar.panellist': { kind: 'list', scope: 'root' },
  } } as never, () => null)
  return { ctx, slots, configForms, registered }
}

describe('ui-projects browser plugin', () => {
  it('declares the services it reads', () => {
    expect(inject).toEqual(['slots', 'locale', 'configForms'])
  })

  it('shows the Projects section only while the Host serves the entry, and removes it on unload', async () => {
    const subject = await bench()
    const fiber = subject.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    expect(subject.registered).toEqual(['projects'])
    expect(subject.configForms.requested).toEqual([PROJECTS_ENTRY_ID])
    expect(subject.slots.entries('settings.section')).toHaveLength(0)
    subject.configForms.serve()
    const [entry] = subject.slots.entries('settings.section')
    expect(entry?.options.id).toBe('projects')
    expect((entry?.options.label as () => string)()).toBe('title')
    expect((entry?.inject as () => unknown)()).toEqual({ projects: { entry: PROJECTS_ENTRY_ID } })
    await fiber.dispose()
    expect(subject.slots.entries('settings.section')).toHaveLength(0)
  })

  it('gives the Projects row its own icon and removes it on unload', async () => {
    const subject = await bench()
    const fiber = subject.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    const [icon] = subject.slots.entries('settings.section.icon')
    expect(icon?.options.id).toBe('projects')
    expect(icon?.component).toBe(IconFolderOpenOutlineMedium)
    await fiber.dispose()
    expect(subject.slots.entries('settings.section.icon')).toHaveLength(0)
  })

  it('offers the Projects page and its sidebar entry only while the Host serves the entry', async () => {
    const subject = await bench()
    const fiber = subject.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    expect(subject.slots.entries('main')).toHaveLength(0)
    expect(subject.slots.entries('sidebar.panellist')).toHaveLength(0)
    subject.configForms.serve()
    const [page] = subject.slots.entries('main')
    const [entry] = subject.slots.entries('sidebar.panellist')
    expect(page?.options.key).toBe('projects')
    expect((page?.inject as () => unknown)()).toEqual({ projects: { entry: PROJECTS_ENTRY_ID } })
    expect(entry?.options.id).toBe('projects')
    expect((entry?.options.label as () => string)()).toBe('title')
    const Icon = entry?.component as (props: { size: number }) => ReactElement
    const { container } = render(<Icon size={18} />)
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('18')
    await fiber.dispose()
    expect(subject.slots.entries('main')).toHaveLength(0)
    expect(subject.slots.entries('sidebar.panellist')).toHaveLength(0)
  })
})
