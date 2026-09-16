/**
 * dshc: the deployment ships ONE agent, so every preset surface went away —
 * the apply now registers only the namespace dictionaries. These specs pin
 * that posture: the inject list shrank with it, and NONE of the four preset
 * surfaces may return by accident (the stores/components remain tested
 * directly in their own specs).
 */

import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { SlotRegistry } from '@deepseek-ai/dsh-client-runtime/client'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { apply, inject } from '@deepseek-ai/dsh-client-ui-agent-preset/client'

async function bench(): Promise<{ ctx: Context; slots: SlotRegistry; locale: LocaleRuntime }> {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  const locale = new LocaleRuntime(ctx)
  ctx.provide('locale', locale)
  return { ctx, slots: ctx.get('slots') as SlotRegistry, locale }
}

describe('ui-agent-preset apply (single-agent posture)', () => {
  it('declares only the services the shrunken apply uses', () => {
    expect(inject).toEqual(['slots', 'locale'])
  })

  it('registers the namespace dictionaries and no preset surface', async () => {
    const b = await bench()
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    // The dictionary survives (straggler keys stay resolvable).
    expect(b.locale.translate('settings.agentPreset', 'nav')).not.toBe('settings.agentPreset/nav')
    // The four removed surfaces must not register again.
    expect(b.slots.entries('settings.general.item')).toHaveLength(0)
    expect(b.slots.entries('settings.section')).toHaveLength(0)
    expect(b.slots.entries('conversation.hero.agentPreset')).toHaveLength(0)
    expect(b.slots.entries('conversation.session.header.actions')).toHaveLength(0)
  })
})
