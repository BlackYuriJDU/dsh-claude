/**
 * DSHC brand artwork: an eight-spoke clay burst mark and a serif `DSHC`
 * wordmark. The artwork is original to this fork and carries no third-party
 * logo.
 */
import type { HeroBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { SidebarBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { DSHC_CLAY, DSHC_FONT_SERIF } from './tokens.ts'

/** Wordmark text shown beside the sidebar mark. */
export const DSHC_WORDMARK = 'DSHC'

type DshcMarkProps = SidebarBrandMarkOwnerProps & Partial<Pick<HeroBrandMarkOwnerProps, 'className'>>

/**
 * Spoke path data for a burst of `size` px: eight round-capped strokes rotated
 * a half step so no spoke is axis-aligned.
 * @param size - square edge in px.
 * @returns one SVG path `d` per spoke.
 */
export function burstSpokes(size: number): string[] {
  const center = size / 2
  return Array.from({ length: 8 }, (_, index) => {
    const angle = (Math.PI / 4) * index + Math.PI / 8
    const inner = center * 0.28
    const outer = center * 0.92
    const x1 = (center + Math.cos(angle) * inner).toFixed(2)
    const y1 = (center + Math.sin(angle) * inner).toFixed(2)
    const x2 = (center + Math.cos(angle) * outer).toFixed(2)
    const y2 = (center + Math.sin(angle) * outer).toFixed(2)
    return `M ${x1} ${y1} L ${x2} ${y2}`
  })
}

/**
 * Render the clay burst at the size its host surface requests.
 * @param props - host-supplied square edge and optional placement class.
 * @returns the decorative mark (hidden from assistive technology).
 */
export function DshcMark({ size, className }: DshcMarkProps) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true" className={className}>
      {burstSpokes(size).map(d => (
        <path key={d} d={d} stroke={DSHC_CLAY} strokeWidth={size * 0.1} strokeLinecap="round" />
      ))}
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
