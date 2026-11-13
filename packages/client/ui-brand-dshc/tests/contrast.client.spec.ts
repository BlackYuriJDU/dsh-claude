/**
 * WCAG contrast of the DSHC token layer: every text token reaches 4.5:1 and
 * every UI indicator and the focus ring reach 3:1 on each opaque surface the
 * layer defines, in both schemes. The checker is proven against a pair that
 * fails, so a regression in the layer cannot pass silently.
 */
import { describe, expect, it } from 'vitest'
import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client'
import { DSHC_TOKENS } from '../src/client/tokens.ts'

type Scheme = 'light' | 'dark'

/** Opaque surfaces text and controls sit on. */
const SURFACES = [
  '--dsw-alias-bg-base', '--dsw-alias-bg-layer-1', '--dsw-alias-bg-layer-2', '--dsw-alias-bg-layer-3',
  '--dsw-alias-bg-overlay', '--dsw-alias-bg-document-preview', '--dsw-alias-bg-module-platform',
  '--dsw-alias-bg-multi-select', '--dsw-specific-sidebar-fill', '--dsw-specific-sidebar-nav-item-active',
  '--dsw-specific-sidebar-nav-item-active-accent', '--dsw-specific-input-major', '--dsw-specific-selector',
  '--dsw-specific-tip', '--dsw-specific-bubble', '--dsw-specific-bubble-highlight',
] as const

/** Tokens that color text, held to 4.5:1. */
const TEXT = [
  '--dsw-alias-label-primary', '--dsw-alias-label-primary-dimmed', '--dsw-alias-label-secondary',
  '--dsw-alias-label-tertiary', '--dsw-alias-label-caption', '--dsw-alias-label-document-preview',
  '--dsw-alias-link', '--dsw-alias-label-deep-diving', '--dsw-alias-state-error-primary',
  '--dsw-alias-state-success-primary', '--dsw-alias-state-warn-primary', '--dsw-alias-state-warn-label',
  '--dsw-alias-state-business-primary',
] as const

/** Tokens that color icons and the focus ring, held to 3:1 (WCAG 1.4.11). */
const INDICATORS = ['--dsw-alias-menu-icon', '--dsw-alias-state-business-primary'] as const

/** Code highlighting, held to 4.5:1 on the code block. */
const CODE = [
  '--shiki-token-constant', '--shiki-token-string', '--shiki-token-comment', '--shiki-token-keyword',
  '--shiki-token-parameter', '--shiki-token-function', '--shiki-token-string-expression',
  '--shiki-token-punctuation', '--shiki-token-link',
] as const

function luminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex)
  if (match === null) throw new Error(`expected an opaque #rrggbb color, got ${hex}`)
  const channel = (offset: number): number => {
    const value = Number.parseInt(match[1]!.slice(offset, offset + 2), 16) / 255
    return value <= 0.039_28 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4)
}

/**
 * WCAG 2.x contrast ratio of two opaque colors.
 * @param a - one color.
 * @param b - the other color.
 * @returns the ratio, from 1 to 21.
 */
function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (high + 0.05) / (low + 0.05)
}

/**
 * Every foreground/background pair below the minimum, in both schemes.
 * @param tokens - the layer under test.
 * @param foregrounds - foreground token names.
 * @param backgrounds - background token names.
 * @param minimum - the required ratio.
 * @returns one line per failing pair.
 */
function failures(
  tokens: ThemeTokenOverrides,
  foregrounds: readonly string[],
  backgrounds: readonly string[],
  minimum: number,
): string[] {
  const lines: string[] = []
  for (const scheme of ['light', 'dark'] as const satisfies readonly Scheme[]) {
    for (const foreground of foregrounds) {
      for (const background of backgrounds) {
        const fg = tokens[foreground]?.[scheme]
        const bg = tokens[background]?.[scheme]
        if (fg === undefined || bg === undefined) throw new Error(`${foreground} or ${background} is missing from the layer`)
        const ratio = contrast(fg, bg)
        if (ratio < minimum) lines.push(`${scheme} ${foreground} on ${background}: ${ratio.toFixed(2)} < ${String(minimum)}`)
      }
    }
  }
  return lines
}

describe('DSHC token contrast', () => {
  it('keeps every text token at 4.5:1 on every surface', () => {
    expect(failures(DSHC_TOKENS, TEXT, SURFACES, 4.5)).toEqual([])
  })

  it('keeps icons and the focus ring at 3:1 on every surface', () => {
    expect(failures(DSHC_TOKENS, INDICATORS, SURFACES, 3)).toEqual([])
  })

  it('keeps every code-highlighting token at 4.5:1 on the code block', () => {
    expect(failures(DSHC_TOKENS, CODE, ['--dsw-alias-markdown-code-block'], 4.5)).toEqual([])
  })

  it('reports a text token that falls below the minimum', () => {
    const regressed = { ...DSHC_TOKENS, '--dsw-alias-label-tertiary': { light: '#73726c', dark: '#a5a39b' } }
    expect(failures(regressed, ['--dsw-alias-label-tertiary'], ['--dsw-specific-sidebar-nav-item-active'], 4.5))
      .toEqual(['light --dsw-alias-label-tertiary on --dsw-specific-sidebar-nav-item-active: 3.86 < 4.5'])
  })

  it('refuses a missing token or a color it cannot measure', () => {
    expect(() => failures(DSHC_TOKENS, ['--dsw-alias-missing'], ['--dsw-alias-bg-base'], 4.5)).toThrow('missing from the layer')
    expect(() => failures(DSHC_TOKENS, ['--dsw-alias-label-dimmed'], ['--dsw-alias-bg-base'], 4.5)).toThrow('opaque #rrggbb')
  })
})
