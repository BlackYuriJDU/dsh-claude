/**
 * The new-session picker policy the Host projects and the browser reads. Types
 * only, so the browser half reads them without the Host module's Context merge.
 * @module @deepseek-ai/dsh-client-ui-agent-preset/seat-policy
 */

/** New-session seat presentation. */
export type SeatPresentation = 'menu' | 'segmented'

/** Picker policy fields the browser reads. */
export interface SeatPolicy {
  seatPresentation?: SeatPresentation
  seatHiddenPresets?: readonly string[]
}
