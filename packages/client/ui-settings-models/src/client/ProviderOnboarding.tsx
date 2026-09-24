/**
 * Provider onboarding step: ends itself the moment any provider can serve
 * requests, and otherwise points the user at the Models page — the one place
 * every provider (not just official DeepSeek) is added.
 */

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ModelsSettingsState, ModelsSettingsStore } from './store.ts'
import { onboardingReadiness } from './store.ts'
import type { en } from './locales.ts'
import { OnboardingModal } from './OnboardingModal.tsx'
import css from './ProviderOnboarding.module.css'

/** Registration-side dependencies of {@link ProviderOnboarding}. */
export interface ProviderOnboardingInjected {
  hooks: {
    /** Shared Models-page join state, bound by the slot renderer. */
    models: SnapshotStore<ModelsSettingsState>
  }
  /** Shared Models-page join controller. */
  controller: ModelsSettingsStore
  /** Onboarding copy. */
  t: (key: keyof typeof en) => string
}

/** Slot owner props plus the feature's injected dependencies. */
export type ProviderOnboardingProps =
  PropsRuntime<'settings.onboarding'> & InjectFace<ProviderOnboardingInjected>

/* v8 ignore next 3 -- closed-union defaults only defend future source widening */
function assertNever(_value: never): never {
  throw new Error('unexpected provider onboarding state')
}

/**
 * End immediately when a usable provider exists or the join cannot decide;
 * otherwise offer the route to the Models page, where any provider is added.
 * @param props - settings-shell owner state and Models feature dependencies.
 * @returns the provider modal or null when onboarding needs no intervention.
 */
export function ProviderOnboarding(props: ProviderOnboardingProps): ReactNode {
  const { complete, openSection, controller, useModels, t } = props
  const state = useModels(snapshot => snapshot)
  const readiness = onboardingReadiness(state)

  useEffect(() => {
    if (state.status === 'idle') void controller.load()
  }, [controller, state.status])

  useEffect(() => {
    if (
      readiness.kind === 'adapter-absent'
      || readiness.kind === 'provider-ready'
      || readiness.kind === 'unavailable'
    ) complete()
  }, [complete, readiness.kind])

  switch (readiness.kind) {
    case 'loading':
    case 'adapter-absent':
    case 'provider-ready':
    case 'unavailable':
      return null
    case 'credential-missing':
      break
    /* v8 ignore next -- every current readiness variant is handled above */
    default:
      return assertNever(readiness)
  }

  return (
    <OnboardingModal title={t('providerTitle')}>
      <p className={css.description}>{t('providerDescription')}</p>
      <div className={css.actions}>
        <Button variant="outline" onClick={() => { complete() }}>{t('providerLater')}</Button>
        <Button variant="primary" onClick={() => { complete(); openSection('models') }}>
          {t('providerAdd')}
        </Button>
      </div>
    </OnboardingModal>
  )
}
