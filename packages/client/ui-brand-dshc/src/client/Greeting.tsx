/**
 * The DSHC hero headline: a part-of-day greeting in the brand serif, read
 * from the browser's local clock when the hero renders.
 */
import type { HeroHeadlineOwnerProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { BrandDshcKey } from './locales.ts'
import { DSHC_FONT_SERIF } from './tokens.ts'

/** Props the greeting reads: the host class and the locale seat. */
export type DshcGreetingProps = HeroHeadlineOwnerProps & PropsLocale<'brand.dshc'>

/**
 * Pick the greeting key for a local hour: morning before 12, afternoon before 18, evening after.
 * @param hour - local hour, 0–23.
 * @returns the dictionary key.
 */
export function greetingKey(hour: number): BrandDshcKey {
  if (hour < 12) return 'greeting.morning'
  if (hour < 18) return 'greeting.afternoon'
  return 'greeting.evening'
}

/**
 * Render the greeting in the host's headline geometry.
 * @param props - host class and locale seat.
 * @returns the greeting element.
 */
export function DshcGreeting({ className, t }: DshcGreetingProps) {
  return (
    <span className={className} style={{ fontFamily: DSHC_FONT_SERIF, fontWeight: 400 }}>
      {t(greetingKey(new Date().getHours()))}
    </span>
  )
}
