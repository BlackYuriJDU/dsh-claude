/**
 * Agent-preset surface plugin, browser half — dshc: the deployment ships ONE
 * agent, so every preset surface went away: the General-settings row, the
 * settings section that managed the roster, the new-session chip, and the
 * session-header label. The package keeps only its dictionaries (straggler
 * imports of the namespace keys stay valid) and its exported stores/components
 * (still exercised by the package specs); the HOST-side preset runtime — the
 * roster the standard agent mounts — is untouched.
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'

import { en } from './locales.ts'
import { AgentPresetLabel } from './AgentPresetLabel.tsx'
import { AgentPresetRow } from './AgentPresetRow.tsx'
import { AgentPresetSeat } from './AgentPresetSeat.tsx'
import { AgentPresetSection } from './AgentPresetSection.tsx'

export type { AgentPresetLabelInjected, AgentPresetLabelProps } from './AgentPresetLabel.tsx'
export type { AgentPresetRowInjected, AgentPresetRowProps } from './AgentPresetRow.tsx'
export type { AgentPresetSeatInjected, AgentPresetSeatProps } from './AgentPresetSeat.tsx'
export type { AgentPresetSectionInjected, AgentPresetSectionProps } from './AgentPresetSection.tsx'
export type { AgentPresetSeatState, SeatSessionSummary } from './seat-store.ts'
export {
  draftBlocker, type AgentPresetSectionState, type CopyDraft, type PresetRow, type PresetView,
} from './section-store.ts'
export type { AgentPresetOption, AgentPresetSettingsState } from './settings-store.ts'
export { AGENT_PRESET_SETTINGS_NS, writeDefaultPreset } from './settings-store.ts'

/** Required services (cordis fiber inject). */
export const inject = ['slots', 'locale']

/**
 * Mount the namespace dictionaries. The four preset surfaces went away with
 * the single-agent posture; nothing else this package owned is wired.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register('settings.agentPreset', { en }), 'ui-agent-preset: settings row dictionaries')
}

/* Re-exported component aliases keep the package's public component face
   importable for its specs without the registration wiring. */
export { AgentPresetLabel, AgentPresetRow, AgentPresetSeat, AgentPresetSection }
