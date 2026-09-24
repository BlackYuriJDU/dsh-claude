/**
 * Account section: the reference Conta page reduced to what the deployment
 * ships today — the current email, read-only, from the durable
 * `ui-onboarding` scope. Everything else on that reference page (plan,
 * billing, privacy) is intentionally absent.
 */
import { useSyncExternalStore } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { PROFILE_NS } from './ProfileRows.tsx'
import css from './AccountSection.module.css'

/** Injected business face: the durable profile scope this section reads. */
export interface AccountSectionInjected {
  profile: SettingsScope<ProfileScopeSection>
}

/** The fields this section reads (structural twin of ProfileRows' section). */
export interface ProfileScopeSection {
  userName?: string
  userFullName?: string
  userEmail?: string
  instructions?: string
  welcomeNoticeVersion?: string
}

/** Full component props: section runtime share + locale seat + injected scope. */
export type AccountSectionComponentProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'settings'>
  & AccountSectionInjected

/**
 * Render the Account section: the current email row.
 * @param props - composed slot props (runtime + locale seat + profile scope).
 * @returns the section element tree.
 */
export function AccountSection({ profile, t }: AccountSectionComponentProps) {
  const snapshot = useSyncExternalStore(profile.subscribe.bind(profile), profile.getSnapshot.bind(profile))
  const email = snapshot.value?.userEmail ?? ''
  return (
    <div className={css.section}>
      <div className={css.row}>
        <span className={css.label}>{t('account.email')}</span>
        <span className={css.value}>{email === '' ? '—' : email}</span>
      </div>
    </div>
  )
}

/** The section's dictionary namespace (the shell's own). */
export const ACCOUNT_NS = PROFILE_NS
