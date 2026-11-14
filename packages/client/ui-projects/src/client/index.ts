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
import { createElement } from 'react'
import { IconFolderOpenOutlineMedium, IconFolderOpenOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
// Type-only: the sidebar.panellist slot declaration.
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: the useWorkspaces global standard prop.
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import { PROJECTS_ENTRY_ID, type ProjectsFormValue } from '../projects.ts'
import { ProjectsSection } from './ProjectsSection.tsx'
import { ProjectsPage } from './ProjectsPage.tsx'
import { de, en, es, fr, ja, pt, ru, zh, type ProjectsKey } from './locales.ts'

export { ProjectsSection } from './ProjectsSection.tsx'
export { ProjectsPage } from './ProjectsPage.tsx'
export type { ProjectsPageProps } from './ProjectsPage.tsx'
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

/** Main-area panel id of the Projects page and its sidebar entry. */
const PROJECTS_PANEL_ID = 'projects' as MainPanelId

/**
 * The Projects entry glyph in the sidebar panel list.
 * @param props - the list's icon size.
 * @returns the open-folder icon.
 */
function ProjectsPanelIcon({ size }: PropsRuntime<'sidebar.panellist'>) {
  return createElement(IconFolderOpenOutlineRegular, { size })
}

/** Required services. */
export const inject = ['slots', 'locale', 'configForms']

/**
 * Register the dictionaries, the Projects row icon, and, while the Host serves
 * the `ui-projects` entry, the Settings Projects section, the main-area
 * Projects page, and its sidebar entry.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }), 'ui-projects: dictionaries')
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
  ctx.effect(() => ctx.configForms.whileServed([PROJECTS_ENTRY_ID], () => {
    const page = ctx.slots.inject('main', () => ctx.slots.register({
      name: 'main',
      key: PROJECTS_PANEL_ID,
      locale: NS,
      inject: () => ({ projects }),
    }, ProjectsPage))
    const entry = ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
      name: 'sidebar.panellist',
      id: PROJECTS_PANEL_ID,
      order: 5,
      locale: NS,
      label: () => t('title'),
    }, ProjectsPanelIcon))
    return () => {
      entry()
      page()
    }
  }), 'ui-projects: sidebar entry and page')
  ctx.effect(() => ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
    name: 'settings.section.icon',
    id: 'projects',
  }, IconFolderOpenOutlineMedium)), 'ui-projects: settings section icon')
}
