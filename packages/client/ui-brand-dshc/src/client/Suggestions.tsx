/**
 * The DSHC starting suggestions below the New Session composer: category
 * pills that open example prompts, and one pill that fills a prompt picked
 * at random. Choosing a prompt replaces the draft; nothing is sent.
 */
import { useState } from 'react'
import type { InjectFace, PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { BrandDshcKey } from './locales.ts'
import css from './Suggestions.module.css'

/** Suggestion categories in display order. */
export const SUGGESTION_CATEGORIES = ['write', 'learn', 'code', 'life'] as const
type Category = typeof SUGGESTION_CATEGORIES[number]

const PROMPT_NUMBERS = [1, 2, 3] as const

/** Every prompt key, in category order. */
export const SUGGESTION_PROMPTS: readonly BrandDshcKey[] = SUGGESTION_CATEGORIES.flatMap(category =>
  PROMPT_NUMBERS.map((number): BrandDshcKey => `suggest.${category}.${number}`))

/** Registration-side face: draft access for the current Session. */
export interface DshcSuggestionsInjected {
  /**
   * Replace the Session draft with a prompt and focus the composer.
   * @param text - prompt text.
   */
  fill: (text: string) => void
  /**
   * Pick an index for the random suggestion.
   * @param count - number of prompts.
   * @returns an index in `[0, count)`.
   */
  pickIndex: (count: number) => number
}

/** Component props: the injected face and the locale seat. */
export type DshcSuggestionsProps = InjectFace<DshcSuggestionsInjected> & PropsLocale<'brand.dshc'>

/**
 * Render the suggestion pills and the open category's prompts.
 * @param props - injected face and locale seat.
 * @returns the suggestions block.
 */
export function DshcSuggestions({ fill, pickIndex, t }: DshcSuggestionsProps) {
  const [open, setOpen] = useState<Category | null>(null)
  const choose = (key: BrandDshcKey): void => {
    setOpen(null)
    fill(t(key))
  }
  return (
    <div className={css.root}>
      <div className={css.pills} role="group" aria-label={t('suggest.group')}>
        {SUGGESTION_CATEGORIES.map(category => (
          <button
            key={category}
            type="button"
            className={css.pill}
            aria-expanded={open === category}
            onClick={() => { setOpen(current => current === category ? null : category) }}
          >
            {t(`suggest.${category}`)}
          </button>
        ))}
        <button
          type="button"
          className={css.pill}
          onClick={() => { choose(SUGGESTION_PROMPTS[pickIndex(SUGGESTION_PROMPTS.length)] ?? 'suggest.write.1') }}
        >
          {t('suggest.choice')}
        </button>
      </div>
      {open !== null && (
        <ul className={css.prompts} aria-label={t(`suggest.${open}`)}>
          {PROMPT_NUMBERS.map(number => (
            <li key={number}>
              <button type="button" className={css.prompt} onClick={() => { choose(`suggest.${open}.${number}`) }}>
                {t(`suggest.${open}.${number}`)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
