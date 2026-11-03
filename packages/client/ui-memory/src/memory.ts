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

/** The editable Config fields the browser section reads and writes. */
export interface MemoryFormValue {
  /** Ordered saved memories. */
  memories: MemoryItem[]
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
