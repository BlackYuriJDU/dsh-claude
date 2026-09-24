/**
 * Projects plugin, node half. Declares the durable `ui-projects` settings
 * namespace (per-workspace instructions + knowledge files) and contributes a
 * system-prompt context that projects the CURRENT session's project content
 * into every request that session makes. The browser half ships via
 * exports["./client"], discovered through the package.json dsh.client
 * declaration.
 *
 * The mapping from session to project follows the workspace registry: a
 * session's immutable cwd names a directory, and the workspace that owns that
 * path is its project. The prompt context provider is SYNCHRONOUS (the
 * assembly does not await provider results), so the workspace is matched by
 * path prefix against the registry's cached list and knowledge files are read
 * with readFileSync — both cheap, both already the pattern other context
 * providers use (every shipped context text is synchronous).
 */

import { readFileSync } from 'node:fs'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
// Type-only: the Context merges for ctx.systemPrompt, ctx.workspaceRegistry,
// and the AssembleContext.agent field (no executable import crosses here).
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-workspace'

/** Durable settings namespace for per-project (workspace) content. */
const PROJECTS_SETTINGS_NAMESPACE = 'ui-projects'

/** Prompt-context name carrying the current session's project content. */
export const PROJECT_CONTEXT = 'project:content'

/**
 * Hard cap on one knowledge file's contributed characters. Files are read
 * whole and truncated to this budget so a large attachment cannot blow up the
 * prompt; the cap is per file, applied after UTF-8 decoding on a character
 * boundary.
 */
export const KNOWLEDGE_FILE_MAX_CHARS = 20000

/** One knowledge file attached to a project. */
export interface ProjectKnowledgeFile {
  /** Stable id within the project's list. */
  id: string
  /** Display name (basename at attach time). */
  name: string
  /** Absolute path to the file on the Host. */
  path: string
}

/** One project's durable content: free-form instructions plus knowledge files. */
export interface ProjectEntry {
  /** Free-form project instructions the agent honors in every session of the project. */
  instructions?: string
  /** Knowledge files whose content is injected alongside the instructions. */
  files?: ProjectKnowledgeFile[]
}

/** The durable section shape: a map from workspace id to its project entry. */
interface ProjectsSettings {
  projects?: Record<string, ProjectEntry>
}

const ProjectKnowledgeFileSchema: z<ProjectKnowledgeFile> = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
})

const ProjectEntrySchema: z<ProjectEntry> = z.object({
  instructions: z.string().required(false),
  files: z.array(ProjectKnowledgeFileSchema).required(false),
})

const ProjectsSettingsSchema: z<ProjectsSettings> = z.object({
  projects: z.dict(ProjectEntrySchema).required(false),
})

/**
 * Read one knowledge file's content, truncated to the per-file budget on a
 * character boundary. An unreadable file (missing, permission, binary that
 * fails UTF-8 decoding) contributes a one-line notice rather than failing the
 * whole assembly — the model sees the gap and can ask.
 * @param file - the knowledge file descriptor.
 * @returns the file's (possibly truncated) text, or a bracketed notice.
 */
export function readKnowledge(file: ProjectKnowledgeFile): string {
  let text: string
  try {
    text = readFileSync(file.path, 'utf8')
  } catch {
    return `[Could not read knowledge file "${file.name}" at ${file.path}]`
  }
  if (text.length > KNOWLEDGE_FILE_MAX_CHARS) {
    return `${text.slice(0, KNOWLEDGE_FILE_MAX_CHARS)}\n[… truncated to ${KNOWLEDGE_FILE_MAX_CHARS} characters]`
  }
  return text
}

/**
 * Compose the model-facing project context for one project entry. Blank
 * instructions and no knowledge contribute nothing (empty string). Each
 * knowledge file is fenced with its name so the model can attribute content
 * to its source.
 * @param entry - the project's durable entry.
 * @returns the context text, or '' to contribute nothing.
 */
export function projectContextText(entry: ProjectEntry | undefined): string {
  if (entry === undefined) return ''
  const instructions = entry.instructions?.trim() ?? ''
  const files = entry.files ?? []
  const parts: string[] = []
  if (instructions !== '') {
    parts.push(
      `Instructions for this project, written by the user and applying to every session in it — honor them unless a direct user message supersedes them:\n${instructions}`,
    )
  }
  if (files.length > 0) {
    const bodies = files.map(file => `--- ${file.name} ---\n${readKnowledge(file)}`)
    parts.push(`Knowledge files attached to this project:\n\n${bodies.join('\n\n')}`)
  }
  return parts.join('\n\n')
}

/**
 * Find the workspace whose path contains the session cwd. The registry's
 * cached list carries canonical paths; a session cwd equals its workspace
 * path or sits beneath it, so the longest matching path prefix wins (a nested
 * cwd resolves to the most specific owning workspace). Both sides are
 * normalized to forward slashes and a trailing separator for the prefix test
 * so `proj` does not match `proj2`.
 * @param cwd - the session's immutable cwd.
 * @param paths - the workspace paths from the registry's cached list.
 * @returns the matching workspace path, or undefined when none contains cwd.
 */
export function workspacePathFor(cwd: string, paths: readonly string[]): string | undefined {
  const norm = (value: string): string => value.replace(/[/\\]+$/, '').replace(/\\/g, '/')
  const target = norm(cwd)
  let best: string | undefined
  for (const candidate of paths) {
    const path = norm(candidate)
    const contained = target === path || target.startsWith(`${path}/`)
    if (contained && (best === undefined || path.length > best.length)) best = path
  }
  return best
}

/**
 * Register the durable projects namespace and the per-session project
 * context. The context resolves the current session's workspace through the
 * registry's cached list (cwd → containing workspace path) and injects that
 * project's instructions and knowledge; sessions outside any registered
 * workspace, and workspaces with no project content, contribute nothing.
 * @param ctx - host context carrying settings, systemPrompt, and the workspace registry.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(
      settingsNamespace(PROJECTS_SETTINGS_NAMESPACE),
      ProjectsSettingsSchema,
    )
  })
  ctx.inject(['settings', 'systemPrompt', 'workspaceRegistry'], (scope) => {
    const settings = scope.settings
    scope.systemPrompt.context({
      name: PROJECT_CONTEXT,
      order: 3,
      text: (context) => {
        const cwd = context.agent?.session.header.cwd
        if (cwd === undefined) return ''
        const workspaces = scope.workspaceRegistry.list()
        const path = workspacePathFor(cwd, workspaces.map(workspace => workspace.path))
        if (path === undefined) return ''
        const normalize = (value: string): string => value.replace(/[/\\]+$/, '').replace(/\\/g, '/')
        const workspace = workspaces.find(candidate => normalize(candidate.path) === path)
        if (workspace === undefined) return ''
        const section = settings.get(settingsNamespace(PROJECTS_SETTINGS_NAMESPACE)) as ProjectsSettings | undefined
        const entry = section?.projects?.[workspace.id]
        return projectContextText(entry)
      },
    })
  })
}
