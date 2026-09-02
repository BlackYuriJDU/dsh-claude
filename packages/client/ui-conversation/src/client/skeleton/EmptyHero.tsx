// Hero chrome for the blank-draft phase of ConversationRoot: the Claude-style
// greeting headline. Pure presentation — the resident composer is NOT rendered
// here (it keeps its own stable tree position in ConversationRoot so the
// textarea survives the hero → composer flip); CSS positions it over this
// shell during the hero phase.

import type { ReactNode } from 'react'
import { CoralBurst } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ConversationSlotProps } from '../contract/slots.ts'
import css from './HeroShell.module.css'

/** The owner's locale seat type, passed to hero chrome as a plain prop. */
type HeroTranslate = ConversationSlotProps['t']

/** localStorage key holding the displayed owner name (set: localStorage.setItem('dshc:user-name', 'Nome')). */
const USER_NAME_STORE_KEY = 'dshc:user-name'

/** Fallback displayed name when no override is stored. */
const DEFAULT_USER_NAME = 'Arthur'

/**
 * The displayed owner name: the localStorage override when present, else the
 * built-in default.
 * @returns the name rendered after the greeting period.
 */
function ownerNameOf(): string {
  try {
    const stored = window.localStorage.getItem(USER_NAME_STORE_KEY)?.trim()
    return stored !== undefined && stored !== '' ? stored : DEFAULT_USER_NAME
  } catch {
    return DEFAULT_USER_NAME
  }
}

/** Hero chrome props. */
export interface HeroShellProps {
  /** The owner's locale seat, passed down as a plain prop. */
  t: HeroTranslate
  /** Authorized renderer for the hero brand-mark slot. */
  renderSlot: ConversationSlotProps['renderSlot']
  /** Overlay content after the stack (modals). */
  children?: ReactNode
}

/**
 * Resolve the greeting period key for the current hour.
 * @returns the locale key suffix: morning, afternoon, or evening.
 */
function greetingKeyOf(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  return 'evening'
}

/**
 * Render the hero chrome: the coral mark and the serif greeting headline.
 * @param props - see {@link HeroShellProps}.
 * @returns the centered hero element tree.
 */
export function HeroShell({ t, renderSlot, children }: HeroShellProps) {
  const greeting = t(`hero.greeting.${greetingKeyOf()}`)
  const headline: ReactNode = `${greeting}, ${ownerNameOf()}`
  return (
    <div className={css.root}>
      <div className={css.stack}>
        <div className={css.headline}>
          <span className={css.markHitbox}>
            {renderSlot('conversation.hero.brand.mark', { size: 34, className: css.mark }, {
              fallback: <CoralBurst size={34} className={css.mark} />,
            })}
          </span>
          <span className={css.headlineText}>{headline}</span>
        </div>
        <div className={css.body}>
          {/* The resident composer (ConversationRoot's root-owned scrollport)
              is CSS-centered in that scroll body during hero — see
              ConversationRoot.module.css [data-phase='hero']. */}
        </div>
      </div>
      {children}
    </div>
  )
}
