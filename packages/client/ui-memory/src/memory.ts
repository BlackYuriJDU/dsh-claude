/**
 * Memory list types and the model-facing text, shared by the Host and browser
 * faces. Pure functions only.
 * @module @deepseek-ai/dsh-client-ui-memory/memory
 */

/** Composition row id of this plugin; the browser edits its Config through this entry. */
export const MEMORY_ENTRY_ID = 'ui-memory'

/** Prompt-context name carrying the saved memories. */
export const MEMORY_CONTEXT_NAME = 'memory:saved'

/** Runtime-context position, after the upstream allocations (100–210). */
export const MEMORY_CONTEXT_ORDER = 300

/** One remembered fact, preference, or correction. */
export interface MemoryItem {
  /** Stable identity within the list. */
  id: string
  /** The memory in the person's words. */
  text: string
}

/** Prompt-context name carrying the person's name and standing instructions. */
export const PROFILE_CONTEXT_NAME = 'memory:profile'

/** Runtime-context position, just before the saved memories. */
export const PROFILE_CONTEXT_ORDER = 295

/** The editable Config fields the browser sections read and write. */
export interface MemoryFormValue {
  /** Ordered saved memories. */
  memories: MemoryItem[]
  /** What the person wants to be called; empty when unset. */
  profileName?: string
  /** The person's instructions for every conversation; empty when unset. */
  instructions?: string
}

/**
 * Render the person's name and standing instructions as runtime context,
 * bounded as a whole: when the complete text exceeds `maxChars`, the
 * instructions are shortened and the text says so; when not even a shortened
 * excerpt fits, only the name is kept.
 * @param name - what the person wants to be called.
 * @param instructions - instructions for every conversation.
 * @param maxChars - the bound on the complete returned text.
 * @returns the context text, or `''` when nothing is set or nothing fits.
 */
export function profileContextText(name: string, instructions: string, maxChars: number): string {
  const called = name.trim()
  const rules = instructions.trim()
  if (called === '' && rules === '') return ''
  const header = 'The person set these in Settings. They apply to this and every session; follow them unless the person says otherwise in this conversation:'
  const nameLine = called === '' ? '' : `\n- Call them ${called}.`
  const lead = '\n- Their instructions:\n'
  const shortened = '\n(Instructions shortened to fit the limit.)'
  const complete = header + nameLine + (rules === '' ? '' : lead + rules)
  if (complete.length <= maxChars) return complete
  const room = maxChars - header.length - nameLine.length - lead.length - shortened.length
  if (rules !== '' && room > 0) return header + nameLine + lead + rules.slice(0, room) + shortened
  const nameOnly = header + nameLine
  return called !== '' && nameOnly.length <= maxChars ? nameOnly : ''
}

/**
 * Render the saved memories as runtime context, bounded as a whole: memories
 * are kept in order while the complete text, including the header and the
 * omission line, stays within `maxChars`.
 * @param memories - the saved memories in order.
 * @param maxChars - the bound on the complete returned text.
 * @returns the context text, or `''` when nothing fits or nothing is saved.
 */
export function memoryContextText(memories: readonly MemoryItem[], maxChars: number): string {
  const items = memories.map(item => item.text.trim()).filter(text => text !== '')
  if (items.length === 0) return ''
  const header = 'Memories the person saved in Settings. They apply to this and every session; follow them unless the person says otherwise in this conversation:'
  const omitted = (count: number): string => `\n(${String(count)} more saved memories omitted to fit the limit.)`
  const complete = header + items.map(item => `\n- ${item}`).join('')
  if (complete.length <= maxChars) return complete
  let text = header
  let kept = 0
  for (const [index, item] of items.entries()) {
    const line = `\n- ${item}`
    const remaining = items.length - index - 1
    const reserve = remaining > 0 ? omitted(remaining).length : 0
    if (text.length + line.length + reserve > maxChars) break
    text += line
    kept += 1
  }
  if (kept === 0) return ''
  // The complete list did not fit, so at least the last memory is omitted.
  return text + omitted(items.length - kept)
}
