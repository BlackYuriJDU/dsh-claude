/**
 * Memory plugin, Host half: owns the saved-memory list as live Config and
 * contributes it to every session's runtime context. The browser half edits
 * the same list through the Settings Memory section.
 * @module @deepseek-ai/dsh-client-ui-memory
 */

import type { Context, Volatile } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/dsh-system-prompt'
import { MEMORY_CONTEXT_NAME, MEMORY_CONTEXT_ORDER, memoryContextText, type MemoryItem } from './memory.ts'

export { MEMORY_CONTEXT_NAME, MEMORY_CONTEXT_ORDER, MEMORY_ENTRY_ID, memoryContextText } from './memory.ts'
export type { MemoryFormValue, MemoryItem } from './memory.ts'

/** Plugin config. */
export interface Config {
  /** Ordered saved memories, edited from Settings. */
  memories: Volatile<MemoryItem[]>
  /** Bound on the complete memory context text, in characters. */
  maxChars: number
}

const MemoryItemSchema: z<MemoryItem> = z.object({
  id: z.string().required(),
  text: z.string().required(),
})

export const Config = z.object({
  memories: z.array(MemoryItemSchema).default([]).volatile(),
  maxChars: z.number().step(1).min(200).default(8000),
})

/** Services this plugin uses. */
export const inject = ['settings', 'systemPrompt']

/**
 * Register the memory context and hand the Config to the Settings section
 * instead of the generated plugin page.
 * @param ctx - Host plugin context.
 * @param config - validated Config.
 */
export function apply(ctx: Context, config: Config): void {
  ctx.effect(() => ctx.settings.configure({ auto: false }, ctx.fiber), 'ui-memory: settings presentation')
  ctx.systemPrompt.context({
    name: MEMORY_CONTEXT_NAME,
    order: MEMORY_CONTEXT_ORDER,
    interpolate: false,
    text: () => memoryContextText(config.memories.get(), config.maxChars),
  })
}
