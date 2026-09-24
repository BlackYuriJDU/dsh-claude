/**
 * Projects plugin, browser half: occupies the `projects` settings section
 * with one card per project (workspace) carrying its instructions and
 * knowledge files, persisting through the durable `ui-projects` scope. The
 * node half (src/index.ts) projects the same content into the system prompt
 * of every session in that project.
 * Export discipline: packages/client/AGENTS.md.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: the settings slot declarations plus the ctx.settingsScope Context
// merge. Cross-plugin collaboration goes through the service, never a value
// import (client bundle purity gate).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: pulls ctx.locale into this program.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { ProjectsSection } from './ProjectsSection.tsx'
import type { ProjectsScopeSection } from './ProjectsSection.tsx'
import { en, pt, type ProjectsKey } from './locales.ts'

export { ProjectsSection } from './ProjectsSection.tsx'
export type { ProjectsScopeSection, ProjectsSectionComponentProps, ProjectsSectionInjected } from './ProjectsSection.tsx'
export type { ProjectsKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The Projects section copy. */
    projects: ProjectsKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'projects'

/** Durable settings namespace mirrored from the node half. */
const PROJECTS_SETTINGS_NAMESPACE = 'ui-projects'

/**
 * Required services (cordis fiber inject). The target slot is declared by
 * ui-settings' apply, whose activation order relative to this one is NOT
 * constrained; the registration depends on the slot through `slots.inject()`.
 */
export const inject = ['slots', 'locale', 'settingsScope', 'workspaces']

/**
 * Register the `projects` dictionaries and the Projects settings section.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { en, pt }), 'ui-projects: dictionaries')
  const t = ctx.locale.bind(NS)
  const projectsHost = ctx.settingsScope.bind<ProjectsScopeSection>({ namespace: PROJECTS_SETTINGS_NAMESPACE })
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'projects',
    order: 13,
    label: () => t('nav'),
    locale: NS,
    inject: () => ({
      projects: projectsHost,
      pickFile: () => ctx.workspaces.pickDirectory(),
    }),
  }, ProjectsSection))
}
