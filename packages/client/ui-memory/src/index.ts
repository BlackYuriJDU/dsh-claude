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
import {
  MEMORY_CONTEXT_NAME, MEMORY_CONTEXT_ORDER, memoryContextText, PROFILE_CONTEXT_NAME, PROFILE_CONTEXT_ORDER, profileContextText,
  type MemoryItem,
} from './memory.ts'

export {
  MEMORY_CONTEXT_NAME, MEMORY_CONTEXT_ORDER, MEMORY_ENTRY_ID, memoryContextText,
  PROFILE_CONTEXT_NAME, PROFILE_CONTEXT_ORDER, profileContextText,
} from './memory.ts'
export type { MemoryFormValue, MemoryItem } from './memory.ts'

/** Plugin config. */
export interface Config {
  /** Ordered saved memories, edited from Settings. */
  memories: Volatile<MemoryItem[]>
  /** What the person wants to be called, edited from Settings. */
  profileName: Volatile<string>
  /** The person's instructions for every conversation, edited from Settings. */
  instructions: Volatile<string>
  /** Bound on each complete context text (profile and memories), in characters. */
  maxChars: number
}

const MemoryItemSchema: z<MemoryItem> = z.object({
  id: z.string().required(),
  text: z.string().required(),
})

export const Config = z.object({
  memories: z.array(MemoryItemSchema).default([]).volatile(),
  profileName: z.string().default('').volatile(),
  instructions: z.string().default('').volatile(),
  maxChars: z.number().step(1).min(200).default(8000),
})

/** Services this plugin uses. */
export const inject = ['settings', 'systemPrompt']

/**
 * Register the profile and memory contexts and hand the Config to the
 * Settings sections instead of the generated plugin page.
 * @param ctx - Host plugin context.
 * @param config - validated Config.
 */
export function apply(ctx: Context, config: Config): void {
  ctx.effect(() => ctx.settings.configure({ auto: false }, ctx.fiber), 'ui-memory: settings presentation')
  ctx.systemPrompt.context({
    name: PROFILE_CONTEXT_NAME,
    order: PROFILE_CONTEXT_ORDER,
    interpolate: false,
    text: () => profileContextText(config.profileName.get(), config.instructions.get(), config.maxChars),
  })
  ctx.systemPrompt.context({
    name: MEMORY_CONTEXT_NAME,
    order: MEMORY_CONTEXT_ORDER,
    interpolate: false,
    text: () => memoryContextText(config.memories.get(), config.maxChars),
  })
}
