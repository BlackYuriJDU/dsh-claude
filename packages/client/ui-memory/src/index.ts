/** Host loader entry for the browser implementation exported from `./client`. */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
// Type-only: the Context merge for ctx.systemPrompt (this node face
// contributes a prompt context; no executable import crosses here).
import type {} from '@deepseek-ai/dsh-system-prompt'

/** Durable settings namespace for the owner's across-session memories. */
export const MEMORY_SETTINGS_NAMESPACE = 'ui-memory'

/** One remembered fact the agent should honor across every session. */
export interface MemoryItem {
  /** Stable identity within the list (crypto.randomUUID at creation). */
  id: string
  /** The remembered fact, preference, or correction, in the owner's words. */
  text: string
}

interface MemorySettings {
  /** Ordered remembered facts; the agent honors the whole list every session. */
  memories?: MemoryItem[]
}

const MemoryItemSchema: z<MemoryItem> = z.object({
  id: z.string(),
  text: z.string(),
})

const MemorySettingsSchema: z<MemorySettings> = z.object({
  memories: z.array(MemoryItemSchema).required(false),
})

/** Prompt-context name carrying the owner's remembered facts. */
export const MEMORY_CONTEXT = 'memory:standing'

/**
 * The model-facing instruction for one stored memory list: the Settings
 * surface promises the agent honors them in every session, so they travel as
 * a standing context rather than a per-message injection. An empty list (or
 * only blank entries) contributes nothing.
 * @param memories - the stored ordered memories, or undefined when unset.
 * @returns the context text, or '' to contribute nothing.
 */
export function memoryContextText(memories: readonly MemoryItem[] | undefined): string {
  const items = (memories ?? [])
    .map(item => item.text.trim())
    .filter(text => text !== '')
  if (items.length === 0) return ''
  const lines = items.map(text => `- ${text}`).join('\n')
  return `The user's memories, saved by them in Settings and applying to this`
    + ` and every session — honor them unless a direct user message supersedes`
    + ` them:\n${lines}`
}

/** Register the durable memory namespace and its prompt context when the services exist. */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(
      settingsNamespace(MEMORY_SETTINGS_NAMESPACE),
      MemorySettingsSchema,
    )
  })
  ctx.inject(['settings', 'systemPrompt'], (scope) => {
    const settings = scope.settings
    scope.systemPrompt.context({
      name: MEMORY_CONTEXT,
      order: 3,
      text: () => {
        const section = settings.get(settingsNamespace(MEMORY_SETTINGS_NAMESPACE)) as MemorySettings | undefined
        return memoryContextText(section?.memories)
      },
    })
  })
}
