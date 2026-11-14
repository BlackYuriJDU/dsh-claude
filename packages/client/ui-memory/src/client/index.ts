/**
 * Memory plugin, browser half: registers the `memory` dictionaries and the
 * Settings Memory section, which edits the saved-memory list the Host half
 * renders into every session's runtime context.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: the settings slot declarations plus the ctx.configForms Context merge.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: the ctx.slots Context merge.
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
// Type-only: pulls ctx.locale into this program.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { IconContextInjectionOutlineMedium, IconUserOutlineMedium } from '@deepseek-ai/dsh-client-ui-primitives'
import { MEMORY_ENTRY_ID, type MemoryFormValue } from '../memory.ts'
import { MemorySection } from './MemorySection.tsx'
import { ProfileSection } from './ProfileSection.tsx'
import { ProfileBadge } from './ProfileBadge.tsx'
import { de, en, es, fr, ja, pt, ru, zh, type MemoryKey } from './locales.ts'

export { MemorySection } from './MemorySection.tsx'
export { ProfileSection } from './ProfileSection.tsx'
export { initialsOf, ProfileBadge } from './ProfileBadge.tsx'
export type { ProfileBadgeProps } from './ProfileBadge.tsx'
export type { ProfileSectionComponentProps } from './ProfileSection.tsx'
export type { MemorySectionComponentProps, MemorySectionInjected } from './MemorySection.tsx'
export type { MemoryKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The Memory section copy. */
    memory: MemoryKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'memory'

/** Required services. */
export const inject = ['slots', 'locale', 'configForms']

/**
 * Register the dictionaries, the Memory and profile row icons, and, while the
 * Host serves the `ui-memory` entry, the Settings profile and Memory sections
 * and, while a name is set, the account launcher's identity badge.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }), 'ui-memory: dictionaries')
  const t = ctx.locale.bind(NS)
  const memory = ctx.configForms.get<MemoryFormValue>(MEMORY_ENTRY_ID)
  ctx.effect(() => ctx.configForms.whileServed([MEMORY_ENTRY_ID], () => ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'memory',
    order: 13,
    label: () => t('title'),
    locale: NS,
    inject: () => ({ memory }),
  }, MemorySection))), 'ui-memory: settings section')
  ctx.effect(() => ctx.configForms.whileServed([MEMORY_ENTRY_ID], () => ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'profile',
    order: 12,
    label: () => t('profile.title'),
    locale: NS,
    inject: () => ({ memory }),
  }, ProfileSection))), 'ui-memory: profile section')
  // The badge exists only while a name is set, so the launcher keeps its own label otherwise.
  ctx.effect(() => ctx.configForms.whileServed([MEMORY_ENTRY_ID], () => {
    let unregister: (() => void) | undefined
    const sync = (): void => {
      const named = (memory.getSnapshot().value?.profileName?.trim() ?? '') !== ''
      if (named && unregister === undefined) {
        unregister = ctx.slots.inject('settings.launcher.badge', () => ctx.slots.register({
          name: 'settings.launcher.badge',
          inject: () => ({ memory }),
        }, ProfileBadge))
      } else if (!named && unregister !== undefined) {
        unregister()
        unregister = undefined
      }
    }
    const unsubscribe = memory.subscribe(sync)
    sync()
    return () => {
      unsubscribe()
      unregister?.()
    }
  }), 'ui-memory: launcher identity badge')
  ctx.effect(() => ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
    name: 'settings.section.icon',
    id: 'profile',
  }, IconUserOutlineMedium)), 'ui-memory: profile section icon')
  ctx.effect(() => ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
    name: 'settings.section.icon',
    id: 'memory',
  }, IconContextInjectionOutlineMedium)), 'ui-memory: settings section icon')
}
