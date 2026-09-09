/** First-run profile step: ask the owner's name and email, persist both. */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { Button, Input } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ProfileOnboardingState, ProfileOnboardingStore } from './profile-store.ts'
import type { en } from './locales.ts'
import { OnboardingModal } from './OnboardingModal.tsx'
import css from './ProfileOnboarding.module.css'

/** Registration-side dependencies of {@link ProfileOnboarding}. */
export interface ProfileOnboardingInjected {
  hooks: {
    /** Durable or process-local profile state. */
    profile: SnapshotStore<ProfileOnboardingState>
  }
  /** Profile persistence controller. */
  controller: ProfileOnboardingStore
  /** Onboarding copy. */
  t: (key: keyof typeof en) => string
}

/** Coordinator owner props plus this step's injected face. */
export type ProfileOnboardingProps =
  PropsRuntime<'settings.onboarding'> & InjectFace<ProfileOnboardingInjected>

/** Light email shape check: something@something.tld (empty stays allowed). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Ask the owner for a name and email on every fresh DSHC (the durable section,
 * not localStorage, decides), persist both, and hand ownership to the next
 * step. The email stays optional; a malformed non-empty one keeps the button
 * disabled with a hint.
 * @param props - settings-shell owner state and profile dependencies.
 * @returns the profile modal or null while the step decides not to show.
 */
export function ProfileOnboarding(props: ProfileOnboardingProps): ReactNode {
  const { complete, controller, useProfile, t } = props
  const state = useProfile(snapshot => snapshot)
  const finished = useRef(false)
  const finish = useCallback((): void => {
    if (finished.current) return
    finished.current = true
    complete()
  }, [complete])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (state.status === 'idle') void controller.load()
  }, [controller, state.status])

  useEffect(() => {
    if (state.profiled) finish()
  }, [finish, state.profiled])

  if (state.status === 'idle' || state.status === 'loading' || state.profiled) return null

  const nameOk = name.trim() !== ''
  const emailOk = email.trim() === '' || EMAIL_PATTERN.test(email.trim())
  const submit = async (): Promise<void> => {
    if (!nameOk || !emailOk) return
    if (await controller.save(name, email)) finish()
  }

  return (
    <OnboardingModal title={t('profileTitle')}>
      <div className={css.fields}>
        <label className={css.field}>
          <span className={css.fieldLabel}>{t('profileName')}</span>
          <Input
            value={name}
            onChange={event => { setName(event.target.value) }}
            placeholder="Arthur"
            autoFocus
          />
        </label>
        <label className={css.field}>
          <span className={css.fieldLabel}>{t('profileEmail')}</span>
          <Input
            type="email"
            value={email}
            onChange={event => { setEmail(event.target.value) }}
            placeholder="voce@exemplo.com"
          />
        </label>
        {!emailOk && <p className={css.hint} role="alert">{t('profileEmailHint')}</p>}
        {state.error === null ? null : <p className={css.hint} role="alert">{t('profileError')}</p>}
      </div>
      <div className={css.actions}>
        <Button
          variant="primary"
          className={css.primary}
          disabled={!nameOk || !emailOk || state.status === 'saving'}
          onClick={() => { void submit() }}
        >
          {t('profileContinue')}
        </Button>
      </div>
    </OnboardingModal>
  )
}
