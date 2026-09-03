// The dshc brand mark: an eight-spoke coral radial burst. currentColor is
// deliberately ignored here — the coral IS the brand voltage, so the mark
// pins to the brand token and stays coral on every surface.

import type { IconProps } from './icons/props.ts'

/** Presentation options for the radial burst mark. */
export interface CoralBurstProps extends IconProps {
  /** Pin the mark to the brand coral instead of currentColor. Defaults to true. */
  brandColor?: boolean | undefined
}

/**
 * Render the coral radial burst.
 * @param props.size - square edge in px (default 24).
 * @param props.className - extra class for layout placement.
 * @param props.brandColor - coral pin (default) or currentColor inheritance.
 * @returns the mark svg (aria-hidden decorative brand art).
 */
export function CoralBurst({ size = 24, className, brandColor = true }: CoralBurstProps) {
  const center = size / 2
  const color = brandColor ? 'var(--dsc-coral-500, #cc785c)' : 'currentColor'
  const spokes = Array.from({ length: 8 }, (_, index) => {
    const angle = (Math.PI / 4) * index + Math.PI / 8
    const inner = center * 0.28
    const outer = center * 0.92
    const x1 = (center + Math.cos(angle) * inner).toFixed(2)
    const y1 = (center + Math.sin(angle) * inner).toFixed(2)
    const x2 = (center + Math.cos(angle) * outer).toFixed(2)
    const y2 = (center + Math.sin(angle) * outer).toFixed(2)
    return `M ${x1} ${y1} L ${x2} ${y2}`
  })
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {spokes.map(d => (
        <path key={d} d={d} stroke={color} strokeWidth={size * 0.1} strokeLinecap="round" />
      ))}
    </svg>
  )
}
