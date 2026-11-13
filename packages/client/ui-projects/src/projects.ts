/**
 * Project types, workspace matching, and the model-facing project text,
 * shared by the Host and browser faces. Pure functions only.
 * @module @deepseek-ai/dsh-client-ui-projects/projects
 */

/** Composition row id of this plugin; the browser edits its Config through this entry. */
export const PROJECTS_ENTRY_ID = 'ui-projects'

/** Prompt-context name carrying the current session's project content. */
export const PROJECT_CONTEXT_NAME = 'project:content'

/** Runtime-context position, after the saved memories (300). */
export const PROJECT_CONTEXT_ORDER = 310

/** One knowledge file attached to a project. */
export interface ProjectKnowledgeFile {
  /** Stable id within the project's list. */
  readonly id: string
  /** Path to the file on the Host: absolute, or relative to the workspace folder. */
  readonly path: string
}

/** One project's content: instructions plus knowledge files. */
export interface ProjectEntry {
  /** Instructions the agent follows in every session of the project. */
  readonly instructions?: string
  /** Knowledge files whose content joins the instructions. */
  readonly files?: readonly ProjectKnowledgeFile[]
}

/** The editable Config fields the browser section reads and writes. */
export interface ProjectsFormValue {
  /** Project content keyed by workspace id. */
  readonly projects: Readonly<Record<string, ProjectEntry>>
}

/** Bounds applied to the project text. */
export interface ProjectLimits {
  /** Characters kept from one knowledge file. */
  maxFileChars: number
  /** Bound on the complete project text. */
  maxTotalChars: number
}

/** One knowledge file as read for a prompt. */
export type KnowledgeRead =
  | { kind: 'text'; text: string; truncated: boolean }
  | { kind: 'error'; reason: string }

/**
 * Normalize a path for prefix comparison: forward slashes, no trailing separator.
 * @param value - an absolute path.
 * @returns the normalized path.
 */
export function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/\/+$/, '')
}

/**
 * Find the most specific workspace whose folder contains `cwd`.
 * @param cwd - the session's working directory.
 * @param workspaces - candidate workspaces with their folder paths.
 * @returns the containing workspace with the longest path, or `undefined`.
 */
export function workspaceFor<W extends { path: string }>(cwd: string, workspaces: readonly W[]): W | undefined {
  const target = normalizePath(cwd)
  let best: W | undefined
  for (const workspace of workspaces) {
    const path = normalizePath(workspace.path)
    const contains = target === path || target.startsWith(`${path}/`)
    if (contains && (best === undefined || path.length > normalizePath(best.path).length)) best = workspace
  }
  return best
}

/**
 * Render one project's instructions and knowledge files, bounded as a whole.
 * Instructions come first; each file follows under its path. A file that does
 * not fit the remaining budget is listed as omitted.
 * @param entry - the project's content.
 * @param read - reads one knowledge file, already bounded to `maxFileChars`.
 * @param limits - the per-file and total bounds.
 * @returns the context text, or `''` when the project has no content.
 */
export function projectContextText(
  entry: ProjectEntry | undefined,
  read: (file: ProjectKnowledgeFile) => KnowledgeRead,
  limits: ProjectLimits,
): string {
  const instructions = entry?.instructions?.trim() ?? ''
  const files = entry?.files ?? []
  if (instructions === '' && files.length === 0) return ''
  const parts: string[] = ['Project context for this workspace, set by the person in Settings. Follow the instructions unless the person says otherwise in this conversation.']
  if (instructions !== '') parts.push(`Instructions:\n${instructions}`)
  let text = parts.join('\n\n')
  if (text.length > limits.maxTotalChars) {
    const cut = '\n[Instructions truncated to fit the project context limit.]'
    return limits.maxTotalChars > cut.length ? text.slice(0, limits.maxTotalChars - cut.length) + cut : ''
  }
  for (const file of files) {
    const result = read(file)
    const body = result.kind === 'error'
      ? `[Could not read this file: ${result.reason}]`
      : `${result.text}${result.truncated ? `\n[Truncated to ${String(limits.maxFileChars)} characters.]` : ''}`
    const block = `\n\nKnowledge file ${file.path}:\n${body}`
    const omitted = `\n\nKnowledge file ${file.path}: [omitted to fit the project context limit]`
    if (text.length + block.length <= limits.maxTotalChars) text += block
    else if (text.length + omitted.length <= limits.maxTotalChars) text += omitted
  }
  return text
}
