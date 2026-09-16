/** Registers the sidebar shell into the layout-owned slot. */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { SidebarRootInjected } from './contract/slots.ts'
import { DesignRow } from './DesignRow.tsx'
import { SidebarRoot } from './SidebarRoot.tsx'
import { en, pt, type SidebarKey } from './locales.ts'

export type {
  SidebarBrandMarkOwnerProps, SidebarBrandNameOwnerProps, SidebarFooterActionOwnerProps,
  SidebarRootComponentProps, SidebarRootInjected, SidebarLocaleInjected,
  SidebarSectionOwnerProps, SidebarSettingsOwnerProps,
} from './contract/slots.ts'
export type { DesignRowComponentProps } from './DesignRow.tsx'
export { SIDEBAR_DESIGN_EVENT, SIDEBAR_SEARCH_EVENT } from './SidebarRoot.tsx'
export type { SidebarKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Sidebar shell controls copy. */
    sidebar: SidebarKey
  }
}

/** Dictionary namespace owned by this plugin (shell controls copy). */
const NS = 'sidebar'

/** Services required by the sidebar plugin. */
export const inject = ['slots', 'layout', 'sessions', 'workspaces', 'locale']

/** Registers the sidebar shell and its service callbacks.
 * @param ctx - Client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { en, pt }), 'ui-sidebar: dictionaries')

  const injectProps = (): SidebarRootInjected => ({
    // The shell's New Session button rides the runtime's shared action
    // (current Session Workspace, then recent Workspace).
    startSession: (workspaceId) => { ctx.workspaces.startSession(workspaceId) },
    toggleSidebar: () => { ctx.layout.toggleSidebar() },
    // The profile popover's Idioma submenu: reads evaluated at render time
    // (a menu opening re-renders) and the durable preference write.
    locale: {
      active: () => ctx.locale.getLocale().active,
      options: () => ctx.locale.getLocale().locales.map(option => ({ id: option.id, label: option.label })),
      set: (id) => { ctx.locale.setLocale(id) },
    },
    // The write actions the shell's Projetos modal wires (connect-on-click,
    // create from the Host directory picker, open-folder). The modal's
    // reactive list source is the runtime's standard useWorkspaces hook.
    workspaces: {
      connect: workspaceId => ctx.workspaces.connectWorkspace(workspaceId),
      create: input => ctx.workspaces.create(input),
      pickDirectory: () => ctx.workspaces.pickDirectory(),
      openPath: path => ctx.workspaces.openPath(path),
    },
  })
  ctx.effect(
    () => ctx.slots.register({
      name: 'sidebar',
      locale: NS,
      // The shell owns geometry; ui-workspace registers the whole browsing
      // region (header, search, session list, workspace dialogs), ui-settings
      // registers the foot trigger + settings panel.
      children: {
        'sidebar.brand.mark': { kind: 'single', scope: 'root' },
        'sidebar.brand.name': { kind: 'single', scope: 'root' },
        'sidebar.workspaces': { kind: 'single', scope: 'root' },
        'sidebar.settings': { kind: 'single', scope: 'root' },
        'sidebar.footer.action': { kind: 'list', scope: 'root' },
      },
      inject: injectProps,
    }, SidebarRoot),
    'ui-sidebar: slot registration',
  )
  // The Design footer row: this package registers the first occupant of its
  // own footer-action seat (full-width row above the profile pill).
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register(
    { name: 'sidebar.footer.action', id: 'design', locale: NS },
    DesignRow,
  ))
}
