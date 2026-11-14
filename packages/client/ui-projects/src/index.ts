/**
 * Projects plugin, Host half: owns per-workspace instructions and knowledge
 * files as live Config and contributes the current session's project to its
 * runtime context. The browser half edits the same Config in Settings.
 * @module @deepseek-ai/dsh-client-ui-projects
 */

import type { Context, Volatile } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from '@deepseek-ai/dsh-working-directory'
import type {} from '@deepseek-ai/dsh-workspace'
import { KnowledgeReader } from './knowledge.ts'
import { PROJECT_CONTEXT_NAME, PROJECT_CONTEXT_ORDER, projectContextText, workspaceFor, type ProjectEntry } from './projects.ts'

export type { KnowledgeRead, ProjectEntry, ProjectKnowledgeFile, ProjectLimits, ProjectsFormValue } from './projects.ts'

/** Plugin config. */
export interface Config {
  /** Project content keyed by workspace id, edited from Settings. */
  projects: Volatile<Record<string, ProjectEntry>>
  /** Characters kept from one knowledge file. */
  maxFileChars: number
  /** Bound on the complete project text of one session. */
  maxTotalChars: number
}

const ProjectEntrySchema = z.object({
  instructions: z.string(),
  files: z.array(z.object({ id: z.string().required(), path: z.string().required() })),
})

export const Config = z.object({
  projects: z.dict(ProjectEntrySchema).default({}).volatile(),
  maxFileChars: z.number().step(1).min(100).default(20000),
  maxTotalChars: z.number().step(1).min(200).default(60000),
})

/** Services this plugin uses. */
export const inject = ['settings', 'systemPrompt', 'workspaceRegistry', 'workingDirectory']

/**
 * Register the project context and hand the Config to the Settings section.
 * The context resolves the session's workspace from its current working
 * directory; sessions outside every workspace, assemblies without an agent,
 * and projects without content contribute nothing.
 * @param ctx - Host plugin context.
 * @param config - validated Config.
 */
export function apply(ctx: Context, config: Config): void {
  ctx.effect(() => ctx.settings.configure({ auto: false }, ctx.fiber), 'ui-projects: settings presentation')
  const reader = new KnowledgeReader()
  ctx.systemPrompt.context({
    name: PROJECT_CONTEXT_NAME,
    order: PROJECT_CONTEXT_ORDER,
    interpolate: false,
    text: (context) => {
      if (context.agent === undefined) return ''
      const cwd = ctx.workingDirectory.get(context.agent.session)
      const workspace = workspaceFor(cwd, ctx.workspaceRegistry.list())
      if (workspace === undefined) return ''
      const entry = config.projects.get()[workspace.id]
      return projectContextText(entry, file => reader.read(file, workspace.path, config.maxFileChars), config)
    },
  })
}
