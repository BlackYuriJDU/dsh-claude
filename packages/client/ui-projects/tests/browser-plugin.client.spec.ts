// @vitest-environment jsdom
// Browser-plugin registration: dictionaries, the Settings section entry, its
// localized label, the durable scope it binds, and fiber disposal.
import { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { SlotRegistry } from '@deepseek-ai/dsh-client-runtime/client'
import { resolveSlotLabel } from '@deepseek-ai/dsh-client-ui-slots'
import { usePinnedBrowserLanguages } from '@deepseek-ai/dsh-client-test-runtime'
import { apply, inject } from '../src/client/index.ts'
import { ProjectsSection } from '../src/client/ProjectsSection.tsx'

usePinnedBrowserLanguages('en-US')
afterEach(cleanup)

async function bench() {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  const locale = new LocaleRuntime(ctx)
  ctx.provide('locale', locale)
  const scope = { getSnapshot: vi.fn(), subscribe: vi.fn(), set: vi.fn(), unset: vi.fn() }
  const bind = vi.fn(() => scope)
  ctx.provide('settingsScope', { bind })
  const pickDirectory = vi.fn(async () => '/picked')
  ctx.provide('workspaces', { pickDirectory })
  const slots = ctx.get('slots') as SlotRegistry
  slots.register({
    name: 'root',
    children: { 'settings.section': { kind: 'list', scope: 'root' } },
  } as never, () => null)
  return { ctx, slots, locale, bind, scope, pickDirectory }
}

describe('ui-projects browser plugin', () => {
  it('declares the services the section registration uses', () => {
    expect(inject).toEqual(['slots', 'locale', 'settingsScope', 'workspaces'])
  })

  it('registers the localized section over the durable ui-projects scope and removes it on dispose', async () => {
    const b = await bench()
    const fiber = b.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    expect(b.bind).toHaveBeenCalledWith({ namespace: 'ui-projects' })

    const entry = b.slots.entries('settings.section')[0]!
    expect(entry.component).toBe(ProjectsSection)
    expect(entry.options).toMatchObject({ id: 'projects', order: 13 })
    expect(entry.locale).toBe('projects')
    expect(resolveSlotLabel(entry.options.label)).toBe('Projects')
    b.locale.setLocale('pt')
    expect(resolveSlotLabel(entry.options.label)).toBe('Projetos')

    const injected = (entry.inject as unknown as () => Record<string, unknown>)()
    expect(injected['projects']).toBe(b.scope)
    await expect((injected.pickFile as () => Promise<string>)()).resolves.toBe('/picked')
    expect(b.pickDirectory).toHaveBeenCalledOnce()

    await fiber.dispose()
    expect(b.slots.entries('settings.section')).toHaveLength(0)
  })
})
