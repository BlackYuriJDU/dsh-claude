// @vitest-environment jsdom
// Browser-plugin registration: dictionaries, the shell.overlay entry, the
// sidebar design event that opens the modal, the Host opener, and disposal.
import { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { SlotRegistry, type ISessions } from '@deepseek-ai/dsh-client-runtime/client'
import { apply, inject, type ArtifactsModalComponentProps, type ArtifactsModalInjected } from '../src/client/index.tsx'

afterEach(cleanup)

/** A sessions service with no current session: the modal shows its empty state. */
const sessions = {
  list: { getSnapshot: () => ({ current: undefined, byId: {} }), subscribe: () => () => {} },
  binding: () => undefined,
} as unknown as ISessions

async function bench() {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  const locale = new LocaleRuntime(ctx)
  ctx.provide('locale', locale)
  ctx.provide('sessions', sessions)
  const openPath = vi.fn(() => Promise.reject(new Error('host refused')))
  ctx.provide('workspaces', { openPath })
  const slots = ctx.get('slots') as SlotRegistry
  slots.register({ name: 'root', children: { 'shell.overlay': { kind: 'list', scope: 'root' } } } as never, () => null)
  return { ctx, slots, locale, openPath }
}

describe('ui-handoff browser plugin', () => {
  it('declares the services the overlay registration uses', () => {
    expect(inject).toEqual(['slots', 'locale', 'sessions', 'workspaces'])
  })

  it('registers the overlay, opens it on the sidebar design event, and removes it on dispose', async () => {
    const b = await bench()
    const fiber = b.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()

    const entry = b.slots.entries('shell.overlay')[0]!
    expect(entry.options).toMatchObject({ id: 'artifacts' })
    expect(entry.locale).toBe('handoff')
    const injected = (entry.inject as unknown as () => ArtifactsModalInjected)()
    expect(injected.sessions).toBe(sessions)
    // The Host opener's rejection stays inside the injected face.
    injected.openPath('/ws/a.ts')
    expect(b.openPath).toHaveBeenCalledWith('/ws/a.ts')
    await Promise.resolve()

    b.locale.setLocale('pt')
    const t = b.locale.bind('handoff')
    const Overlay = entry.component as (props: ArtifactsModalComponentProps) => React.JSX.Element | null
    render(<Overlay {...({ ...injected, t } as unknown as ArtifactsModalComponentProps)} />)
    expect(screen.queryByRole('dialog')).toBeNull()

    act(() => { window.dispatchEvent(new Event('dshc:sidebar-design')) })
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('Artefatos')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByRole('dialog')).toBeNull()

    await fiber.dispose()
    expect(b.slots.entries('shell.overlay')).toHaveLength(0)
  })
})
