/**
 * Routines plugin, browser half: registers the `routines` dictionaries and
 * occupies the Settings `routines` section with the scheduled-routines
 * editor. The scheduler itself is the node half (`src/index.ts`); this half
 * only edits the durable section it reads.
 * Export discipline: packages/client/AGENTS.md.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: the settings slot declarations plus the ctx.settingsScope merge.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: pulls ctx.locale into this program.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { RoutinesSettings } from '../index.ts'
import { RoutinesSection } from './RoutinesSection.tsx'
import type { RoutinesSectionInjected } from './RoutinesSection.tsx'
import { en, pt, type RoutinesKey } from './locales.ts'

export type { RoutinesSectionComponentProps, RoutinesSectionInjected } from './RoutinesSection.tsx'
export { RoutinesSection } from './RoutinesSection.tsx'
export type { RoutinesKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The Routines section copy. */
    routines: RoutinesKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'routines'

/** The durable settings namespace the section edits (mirrors src/index.ts). */
const ROUTINES_NS = 'ui-routines'

/** Required services (cordis fiber inject). */
export const inject = ['slots', 'locale', 'settingsScope']

/**
 * Register the `routines` dictionaries and the Settings Routines section.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { en, pt }), 'ui-routines: dictionaries')

  const t = ctx.locale.bind(NS)
  const routinesScope = ctx.settingsScope.bind<RoutinesSettings>({ namespace: ROUTINES_NS })

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'routines',
    order: 4,
    label: () => t('title'),
    locale: NS,
    inject: (): RoutinesSectionInjected => ({ routines: routinesScope }),
  }, RoutinesSection))
}
