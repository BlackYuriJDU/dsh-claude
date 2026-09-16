import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import { SettingsProvider, settingsNamespace, type SettingsNamespace } from '@deepseek-ai/dsh-settings'
import { PROFILE_INSTRUCTIONS_CONTEXT, apply, profileInstructionsText } from '../src/index.ts'

/** Mirrors the module-local namespace id in src/index.ts. */
const ONBOARDING_SETTINGS_NAMESPACE = 'ui-onboarding'

class MemorySettings extends SettingsProvider {
  readonly writable = true
  protected load(): Promise<Record<string, unknown>> { return Promise.resolve({}) }
  protected persist(_ns: SettingsNamespace, _section: Record<string, unknown>): Promise<void> {
    return Promise.resolve()
  }
}

describe('ui-settings-general host', () => {
  it('registers and disposes the durable onboarding namespace with its fiber', async () => {
    const ctx = new Context()
    await ctx.plugin(MemorySettings).await()
    const fiber = ctx.plugin({ apply })
    await fiber.await()
    expect(ctx.settings.describe().map(row => row.ns)).toContain(
      settingsNamespace(ONBOARDING_SETTINGS_NAMESPACE),
    )
    await fiber.dispose()
    expect(ctx.settings.describe().map(row => row.ns)).not.toContain(
      settingsNamespace(ONBOARDING_SETTINGS_NAMESPACE),
    )
  })

  it('contributes the standing owner instructions from the stored section', async () => {
    const ctx = new Context()
    await ctx.plugin(MemorySettings).await()
    await ctx.plugin(SystemPrompt, { persona: '' })
    const fiber = ctx.plugin({ apply })
    await fiber.await()
    const ns = settingsNamespace(ONBOARDING_SETTINGS_NAMESPACE)
    const contextText = async (): Promise<string> => {
      const assembly = await ctx.systemPrompt.assemble()
      return assembly.contexts.find(context => context.name === PROFILE_INSTRUCTIONS_CONTEXT)?.text ?? ''
    }
    // No stored text contributes nothing.
    expect(await contextText()).toBe('')
    await ctx.settings.update(ns, { instructions: '  Always answer concisely.  ' })
    expect(await contextText()).toContain('Always answer concisely.')
    // Blank storage (whitespace only) contributes nothing again.
    await ctx.settings.update(ns, { instructions: '   ' })
    expect(await contextText()).toBe('')
    await fiber.dispose()
    expect((await ctx.systemPrompt.assemble()).contexts
      .find(context => context.name === PROFILE_INSTRUCTIONS_CONTEXT)).toBeUndefined()
  })

  it('maps standing instructions text, blank included', () => {
    expect(profileInstructionsText(undefined)).toBe('')
    expect(profileInstructionsText('  ')).toBe('')
    expect(profileInstructionsText('Prefer pt answers')).toContain('Prefer pt answers')
  })
})
