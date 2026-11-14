/**
 * DSHC brand artwork: a clay monogram tile holding the serif initial of
 * `DSHC`, and the serif `DSHC` wordmark. Both are drawn here from the fork's own
 * palette and the system serif stack; no third-party logo or font ships.
 */
import type { HeroBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { SidebarBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { DSHC_CLAY, DSHC_FONT_SERIF } from './tokens.ts'

/** Wordmark text shown beside the sidebar mark. */
export const DSHC_WORDMARK = 'DSHC'

/** The monogram's letter: the wordmark's initial. */
export const DSHC_MONOGRAM = DSHC_WORDMARK.slice(0, 1)

type DshcMarkProps = SidebarBrandMarkOwnerProps & Partial<Pick<HeroBrandMarkOwnerProps, 'className'>>

/**
 * Render the monogram tile at the size its host surface requests: a rounded
 * clay square with the white serif initial centered on it.
 * @param props - host-supplied square edge and optional placement class.
 * @returns the decorative mark (hidden from assistive technology).
 */
export function DshcMark({ size, className }: DshcMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="7" fill={DSHC_CLAY} />
      <text x="16" y="23" textAnchor="middle" fontFamily={DSHC_FONT_SERIF} fontSize="21" fontWeight="500" fill="#ffffff">
        {DSHC_MONOGRAM}
      </text>
    </svg>
  )
}

/**
 * Render the serif wordmark for the sidebar name seat.
 * @returns the wordmark text in the brand display face.
 */
export function DshcName() {
  return (
    <span style={{ fontFamily: DSHC_FONT_SERIF, fontSize: 17, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--dsw-alias-label-primary)' }}>
      {DSHC_WORDMARK}
    </span>
  )
}
