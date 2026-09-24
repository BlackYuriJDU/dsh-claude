/**
 * Memory plugin, browser half: registers the `memory` dictionaries and the
 * Settings Memory section — the editable list of across-session memories the
 * node half projects into every session's system prompt.
 * Export discipline: packages/client/AGENTS.md.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: the settings slot declarations plus the ctx.settingsScope Context
// merge. Cross-plugin collaboration goes through the service, never a value
// import (client bundle purity gate).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: pulls ctx.locale into this program.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { MemorySection } from './MemorySection.tsx'
import type { MemoryScopeSection } from './MemorySection.tsx'
import { en, pt, type MemoryKey } from './locales.ts'

export { MemorySection } from './MemorySection.tsx'
export type { MemoryScopeSection, MemorySectionComponentProps, MemorySectionInjected } from './MemorySection.tsx'
export type { MemoryKey } from './locales.ts'
export type { MemoryItem } from '../index.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The Memory section copy. */
    memory: MemoryKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'memory'

/**
 * Required services (cordis fiber inject). The settings.section slot is
 * declared by ui-settings-general's apply, whose activation order relative to
 * this one is NOT constrained; the registration depends on the slot through
 * `slots.inject()`.
 */
export const inject = ['slots', 'locale', 'connection', 'settingsScope']

/**
 * Register the `memory` dictionaries and the Memory settings section.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { en, pt }), 'ui-memory: dictionaries')

  // Copy freshness is framework-owned: the component reads the standard `t`
  // seat, and the nav label is a thunk the owner resolves per render.
  const t = ctx.locale.bind(NS)
  // The durable memory scope feeds the section; the node half reads the same
  // namespace into the system prompt of every session.
  const memoryHost = ctx.settingsScope.bind<MemoryScopeSection>({ namespace: 'ui-memory' })

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'memory',
    order: 13,
    label: () => t('title'),
    locale: NS,
    inject: () => ({ memory: memoryHost }),
  }, MemorySection))
}
