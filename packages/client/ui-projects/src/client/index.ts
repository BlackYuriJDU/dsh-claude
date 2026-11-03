/**
 * Projects plugin, browser half: registers the `projects` dictionaries and the
 * Settings Projects section, which edits the per-workspace instructions and
 * knowledge files the Host half renders into session runtime context.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: the settings slot declarations plus the ctx.configForms Context merge.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: the ctx.slots Context merge.
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
// Type-only: pulls ctx.locale into this program.
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: the useWorkspaces global standard prop.
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import { PROJECTS_ENTRY_ID, type ProjectsFormValue } from '../projects.ts'
import { ProjectsSection } from './ProjectsSection.tsx'
import { en, pt, zh, type ProjectsKey } from './locales.ts'

export { ProjectsSection } from './ProjectsSection.tsx'
export type { ProjectsSectionComponentProps, ProjectsSectionInjected } from './ProjectsSection.tsx'
export type { ProjectsKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The Projects section copy. */
    projects: ProjectsKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'projects'

/** Required services. */
export const inject = ['slots', 'locale', 'configForms']

/**
 * Register the dictionaries and, while the Host serves the `ui-projects` entry,
 * the Settings Projects section.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { en, zh, pt }), 'ui-projects: dictionaries')
  const t = ctx.locale.bind(NS)
  const projects = ctx.configForms.get<ProjectsFormValue>(PROJECTS_ENTRY_ID)
  ctx.effect(() => ctx.configForms.whileServed([PROJECTS_ENTRY_ID], () => ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'projects',
    order: 14,
    label: () => t('title'),
    locale: NS,
    inject: () => ({ projects }),
  }, ProjectsSection))), 'ui-projects: settings section')
}
