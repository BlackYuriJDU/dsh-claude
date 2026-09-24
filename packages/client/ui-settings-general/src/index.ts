/** Host loader entry for the browser implementation exported from `./client`. */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
// Type-only: the Context merge for ctx.systemPrompt (this node face
// contributes a prompt context; no executable import crosses here).
import type {} from '@deepseek-ai/dsh-system-prompt'

/** Durable settings namespace for product-wide GUI onboarding facts. */
const ONBOARDING_SETTINGS_NAMESPACE = 'ui-onboarding'

interface OnboardingSettings {
  /** Last version acknowledged by the current product welcome step. */
  welcomeNoticeVersion?: string
  /** Displayed owner name (hero greeting, sidebar foot). */
  userName?: string
  /** Legal full name (settings display). */
  userFullName?: string
  /** Displayed owner email (Account section). */
  userEmail?: string
  /** Free-form standing instructions the agent should honor. */
  instructions?: string
}

const OnboardingSettingsSchema: z<OnboardingSettings> = z.object({
  welcomeNoticeVersion: z.string().required(false),
  userName: z.string().required(false),
  userFullName: z.string().required(false),
  userEmail: z.string().required(false),
  instructions: z.string().required(false),
})

/** Prompt-context name carrying the owner's standing instructions. */
export const PROFILE_INSTRUCTIONS_CONTEXT = 'profile:instructions'

/**
 * The model-facing instruction for one stored instructions text: the settings
 * surface promises the agent honors it in every session, so it travels as a
 * standing context rather than a per-message injection. Blank text (unset or
 * whitespace) contributes nothing.
 * @param instructions - the stored free-form text, or undefined when unset.
 * @returns the context text, or '' to contribute nothing.
 */
export function profileInstructionsText(instructions: string | undefined): string {
  const trimmed = instructions?.trim() ?? ''
  if (trimmed === '') return ''
  return `The user's standing instructions, written by them in Settings and`
    + ` applying to this and every session — honor them unless a direct user`
    + ` message supersedes them:\n${trimmed}`
}

/** Register the durable GUI-onboarding section when a settings provider exists. */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(
      settingsNamespace(ONBOARDING_SETTINGS_NAMESPACE),
      OnboardingSettingsSchema,
    )
  })
  ctx.inject(['settings', 'systemPrompt'], (scope) => {
    const settings = scope.settings
    scope.systemPrompt.context({
      name: PROFILE_INSTRUCTIONS_CONTEXT,
      order: 2,
      text: () => {
        const section = settings.get(settingsNamespace(ONBOARDING_SETTINGS_NAMESPACE)) as OnboardingSettings | undefined
        return profileInstructionsText(section?.instructions)
      },
    })
  })
}
