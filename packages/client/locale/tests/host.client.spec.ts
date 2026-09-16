import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import { SettingsProvider, settingsNamespace, type SettingsNamespace } from '@deepseek-ai/dsh-settings'
import { LOCALE_SETTINGS_NAMESPACE, RESPONSE_LANGUAGE_CONTEXT, apply, responseLanguageText } from '@deepseek-ai/dsh-client-locale'

class MemorySettings extends SettingsProvider {
  readonly writable = true
  protected load(): Promise<Record<string, unknown>> { return Promise.resolve({}) }
  protected persist(_ns: SettingsNamespace, _section: Record<string, unknown>): Promise<void> {
    return Promise.resolve()
  }
}

describe('locale host', () => {
  it('registers an optional explicit locale preference with the Host settings lifecycle', async () => {
    const ctx = new Context()
    await ctx.plugin(MemorySettings).await()
    const fiber = ctx.plugin({ apply })
    await fiber.await()
    const ns = settingsNamespace(LOCALE_SETTINGS_NAMESPACE)
    expect(ctx.settings.get(ns)).toEqual({})
    await ctx.settings.update(ns, { preference: 'en' })
    expect(ctx.settings.get(ns)).toEqual({ preference: 'en' })
    await expect(ctx.settings.update(ns, { preference: 'fr' })).rejects.toThrow()
    await fiber.dispose()
    expect(ctx.settings.describe().map(row => row.ns)).not.toContain(ns)
  })

  it('contributes the response-language instruction from the stored preference', async () => {
    const ctx = new Context()
    await ctx.plugin(MemorySettings).await()
    await ctx.plugin(SystemPrompt)
    const fiber = ctx.plugin({ apply })
    await fiber.await()
    const ns = settingsNamespace(LOCALE_SETTINGS_NAMESPACE)
    const contextText = async (): Promise<string> => {
      const assembly = await ctx.systemPrompt.assemble()
      return assembly.contexts.find(context => context.name === RESPONSE_LANGUAGE_CONTEXT)?.text ?? ''
    }
    // No stored preference contributes nothing.
    expect(await contextText()).toBe('')
    await ctx.settings.update(ns, { preference: 'pt' })
    expect(await contextText()).toContain('Answer in Brazilian Portuguese')
    await ctx.settings.update(ns, { preference: 'en' })
    expect(await contextText()).toContain('Answer in English')
    await fiber.dispose()
    expect((await ctx.systemPrompt.assemble()).contexts
      .find(context => context.name === RESPONSE_LANGUAGE_CONTEXT)).toBeUndefined()
  })

  it('maps only shipped locale ids to a response-language sentence', () => {
    expect(responseLanguageText(undefined)).toBe('')
    expect(responseLanguageText('fr')).toBe('')
    expect(responseLanguageText('pt')).toBe(
      'The user\'s interface language is Brazilian Portuguese. Answer in Brazilian Portuguese even when their messages are written in another language.',
    )
  })
})
