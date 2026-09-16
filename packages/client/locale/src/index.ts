/** Host registration for the browser locale preference. */

import type { Context } from '@deepseek-ai/cordis'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
// Type-only: the Context merge for ctx.systemPrompt (this node face
// contributes a prompt context; no executable import crosses here).
import type {} from '@deepseek-ai/dsh-system-prompt'
import {
  LOCALE_PREFERENCE_FIELD, LOCALE_SETTINGS_NAMESPACE,
  type LocaleId, LocaleSettingsSchema,
} from './locale-settings.ts'

export {
  LOCALE_IDS, LOCALE_PREFERENCE_FIELD, LOCALE_SETTINGS_NAMESPACE,
  type LocaleId, type LocaleSettings,
} from './locale-settings.ts'

/**
 * The model-facing language names the stored preference maps to (the answer
 * language, not the dictionary id).
 */
const LANGUAGE_NAMES: Record<LocaleId, string> = { en: 'English', pt: 'Brazilian Portuguese' }

/** Prompt-context name carrying the response-language instruction. */
export const RESPONSE_LANGUAGE_CONTEXT = 'locale:response-language'

/**
 * The response-language instruction for one stored preference: the user's
 * explicit interface choice outranks message language. English returns a
 * sentence too — the deployment persona's line names Portuguese as the
 * default, and an explicit stored choice must be readable as an override.
 * @param preference - the stored locale id, or undefined when none was stored.
 * @returns the context text, or '' to contribute nothing.
 */
export function responseLanguageText(preference: string | undefined): string {
  if (preference === undefined || !(LANGUAGE_NAMES as Record<string, string>)[preference]) return ''
  const language = LANGUAGE_NAMES[preference as LocaleId]
  return `The user's interface language is ${language}. Answer in ${language} even when their messages are written in another language.`
}

/**
 * Register the durable locale section when a settings provider exists, and
 * contribute the response-language instruction to every system-prompt
 * assembly that stored preference drives (read at assembly time, so a
 * language switch reaches the next turn without a restart).
 * @param ctx - Host context whose optional settings service owns the section.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(
      settingsNamespace(LOCALE_SETTINGS_NAMESPACE),
      LocaleSettingsSchema,
    )
  })
  ctx.inject(['settings', 'systemPrompt'], (scope) => {
    const settings = scope.settings
    scope.systemPrompt.context({
      name: RESPONSE_LANGUAGE_CONTEXT,
      order: 1,
      text: () => {
        const section = settings.get(settingsNamespace(LOCALE_SETTINGS_NAMESPACE)) as { [LOCALE_PREFERENCE_FIELD]?: string } | undefined
        return responseLanguageText(section?.[LOCALE_PREFERENCE_FIELD])
      },
    })
  })
}
