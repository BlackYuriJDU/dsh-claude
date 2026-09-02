// The dshc brand wordmark: coral burst + "DSH Claude" in the display serif.
// Text-based on purpose — the product name is live text, not letterform art.

import { CoralBurst } from './CoralBurst.tsx'
import type { IconProps } from './icons/props.ts'

/** Wordmark display options. */
export interface BrandWordmarkProps extends IconProps {
  /** Whether to include the leading burst mark; defaults to true. */
  includeMark?: boolean | undefined
}

/**
 * Render the brand wordmark.
 * @param props.size - height in px (default 24).
 * @param props.className - extra class for layout placement.
 * @param props.includeMark - whether to include the leading burst mark.
 * @returns the inline wordmark.
 */
export function BrandWordmark({ size = 24, className, includeMark = true }: BrandWordmarkProps) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.34,
        lineHeight: 1,
      }}
    >
      {includeMark && <CoralBurst size={size} />}
      <span
        style={{
          fontFamily: "var(--dsc-font-display, Georgia, 'Times New Roman', serif)",
          fontWeight: 500,
          fontSize: size,
          letterSpacing: '-0.02em',
          color: 'inherit',
        }}
      >
        DSH Claude
      </span>
    </span>
  )
}
