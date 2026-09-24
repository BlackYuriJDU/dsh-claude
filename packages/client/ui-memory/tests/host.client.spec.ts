import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import { SettingsProvider, settingsNamespace, type SettingsNamespace } from '@deepseek-ai/dsh-settings'
import { MEMORY_CONTEXT, MEMORY_SETTINGS_NAMESPACE, apply, memoryContextText } from '../src/index.ts'

class MemorySettings extends SettingsProvider {
  readonly writable = true
  protected load(): Promise<Record<string, unknown>> { return Promise.resolve({}) }
  protected persist(_ns: SettingsNamespace, _section: Record<string, unknown>): Promise<void> {
    return Promise.resolve()
  }
}

describe('ui-memory host', () => {
  it('registers and disposes the durable memory namespace with its fiber', async () => {
    const ctx = new Context()
    await ctx.plugin(MemorySettings).await()
    const fiber = ctx.plugin({ apply })
    await fiber.await()
    expect(ctx.settings.describe().map(row => row.ns)).toContain(
      settingsNamespace(MEMORY_SETTINGS_NAMESPACE),
    )
    await fiber.dispose()
    expect(ctx.settings.describe().map(row => row.ns)).not.toContain(
      settingsNamespace(MEMORY_SETTINGS_NAMESPACE),
    )
  })

  it('contributes the standing memories from the stored section', async () => {
    const ctx = new Context()
    await ctx.plugin(MemorySettings).await()
    await ctx.plugin(SystemPrompt, { persona: '' })
    const fiber = ctx.plugin({ apply })
    await fiber.await()
    const ns = settingsNamespace(MEMORY_SETTINGS_NAMESPACE)
    const contextText = async (): Promise<string> => {
      const assembly = await ctx.systemPrompt.assemble()
      return assembly.contexts.find(context => context.name === MEMORY_CONTEXT)?.text ?? ''
    }
    // No stored memories contributes nothing.
    expect(await contextText()).toBe('')
    await ctx.settings.update(ns, {
      memories: [
        { id: 'm1', text: 'Prefers concise answers.' },
        { id: 'm2', text: '  Uses pnpm, never npm.  ' },
      ],
    })
    const text = await contextText()
    expect(text).toContain('Prefers concise answers.')
    expect(text).toContain('Uses pnpm, never npm.')
    // Blank-only memories contribute nothing again.
    await ctx.settings.update(ns, { memories: [{ id: 'm3', text: '   ' }] })
    expect(await contextText()).toBe('')
    await fiber.dispose()
    expect((await ctx.systemPrompt.assemble()).contexts
      .find(context => context.name === MEMORY_CONTEXT)).toBeUndefined()
  })

  it('maps memory list text, blank entries included', () => {
    expect(memoryContextText(undefined)).toBe('')
    expect(memoryContextText([])).toBe('')
    expect(memoryContextText([{ id: 'a', text: '  ' }])).toBe('')
    const text = memoryContextText([{ id: 'a', text: 'One' }, { id: 'b', text: 'Two' }])
    expect(text).toContain('- One')
    expect(text).toContain('- Two')
  })
})
