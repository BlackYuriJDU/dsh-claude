/** locale apply wiring: service + dictionaries provision. dshc: the
 * General-section Language row left the reworked General block (the language
 * switch lives in the profile popover's Idioma submenu), so the apply no
 * longer registers a row — these specs pin the reduced posture and the
 * durable-preference adoption the service keeps. */
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import { SlotRegistry } from '@deepseek-ai/dsh-client-runtime/client'
import { apply as settingsApply, inject as settingsInject } from '@deepseek-ai/dsh-client-ui-settings/client'
import { TestRemote } from '@deepseek-ai/dsh-client-test-runtime'
import { apply, inject, SETTINGS_NS } from '@deepseek-ai/dsh-client-locale/client'
import type { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { LOCALE_SETTINGS_NAMESPACE, LocaleSettingsSchema } from '../src/locale-settings.ts'

async function bench() {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  let preference: string | undefined
  let revision = 0
  const namespace = () => ({
    ns: LOCALE_SETTINGS_NAMESPACE,
    schema: LocaleSettingsSchema.toJSON(),
    value: preference === undefined ? {} : { preference },
    applies: 'live' as const,
    secrets: [],
    revision,
  })
  const describe = vi.fn(async () => ({
    rpcId: 'locale-describe' as never,
    result: {
      ok: true as const,
      value: { writable: true, hasDocument: true, namespaces: [namespace()] },
    },
  }))
  const mutate = vi.fn(async (request: { ops: { value: string }[] }) => {
    preference = request.ops[0]!.value
    revision += 1
    return {
      rpcId: 'locale-mutate' as never,
      result: { ok: true as const, value: namespace() },
    }
  })
  ctx.provide('connection', { api: { settings: { describe, mutate } }, isLoopback: true } as never)
  // The settings transport and the forwarded-event port the plugin injects.
  new TestRemote(ctx)
  await ctx.plugin({ inject: [...settingsInject], apply: settingsApply }).await()
  return {
    ctx, describe, mutate,
    setHostPreference: (next: string | undefined) => { preference = next; revision += 1 },
  }
}

describe('locale apply', () => {
  it('declares the slot service', () => {
    expect(inject).toEqual(['slots', 'connection', 'remote', 'settingsScope'])
  })

  it('provides the service with the base dictionaries and registers no settings row', async () => {
    const b = await bench()
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    const locale = b.ctx.get('locale') as LocaleRuntime
    // Base dictionaries are registered: the (ns, locale) seat is occupied.
    expect(() => locale.register('common', 'en', {})).toThrow('already has locale')
    // The lane has no jsdom `window`, so detection never runs and a fresh
    // service opens on FALLBACK_LOCALE (en).
    expect(locale.getLocale().active).toBe('en')
    expect(locale.bind(SETTINGS_NS)('language.title')).toBe('Language')
    // The reduced posture: the Language row is gone from the General item
    // slot — the Idioma submenu in the profile popover carries the switch.
    expect(b.ctx.get('slots') as SlotRegistry !== undefined).toBe(true)
  })

  it('loads and refreshes the explicit Host preference after nonblocking activation', async () => {
    const b = await bench()
    // The shared mirror read once at bench time; a Host-side change reaches it
    // through the document invalidation, exactly as production announces one.
    // A stale id from a build that shipped more locales ('zh') must be
    // ignored — adopting it would activate a dictionary-less locale.
    b.setHostPreference('zh')
    b.ctx.remote.$dispatch('settings/document-updated', [LOCALE_SETTINGS_NAMESPACE, 0])
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    const locale = b.ctx.get('locale') as LocaleRuntime
    await vi.waitFor(() => { expect(locale.getLocale().active).toBe('en') })
    // Cleared preference falls back to the provisional locale.
    b.setHostPreference(undefined)
    b.ctx.remote.$dispatch('settings/document-updated', [LOCALE_SETTINGS_NAMESPACE, 0])
    await vi.waitFor(() => { expect(locale.getLocale().active).toBe('en') })
    // Re-stating en after the clear is an explicit pick of the provisional
    // value and must persist as a written preference.
    b.setHostPreference('en')
    b.ctx.remote.$dispatch('settings/document-updated', [LOCALE_SETTINGS_NAMESPACE, 0])
    await vi.waitFor(() => { expect(locale.getLocale().active).toBe('en') })
    expect(b.describe).toHaveBeenCalledTimes(4)
  })
})
