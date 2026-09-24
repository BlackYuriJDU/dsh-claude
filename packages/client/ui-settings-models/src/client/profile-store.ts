/**
 * Profile-onboarding state derived from the durable `ui-onboarding` settings
 * scope. The scope is the transport: a loopback browser follows the durable
 * Host section, while a remote browser's memory-mode scope stays process-local
 * here. Both `userName` and `userEmail` mirror to localStorage
 * (`dshc:user-name` / `dshc:user-email`) — the synchronous source the hero
 * greeting and the sidebar profile foot read.
 */

import type { SettingsScope, SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'

/** Durable settings namespace for product-wide GUI onboarding facts. */
export const ONBOARDING_SETTINGS_NAMESPACE = 'ui-onboarding'

/** localStorage mirror keys (read synchronously by hero and sidebar). */
export const USER_NAME_STORE_KEY = 'dshc:user-name'
export const USER_EMAIL_STORE_KEY = 'dshc:user-email'

/** The onboarding section fields this store owns. */
export interface OnboardingProfileSection {
  /** Displayed owner name (hero greeting, profile foot). */
  userName?: string
  /** Displayed owner email (profile popover heading). */
  userEmail?: string
  /** Legacy welcome-notice acknowledgement field (ignored; kept on write). */
  welcomeNoticeVersion?: string
}

/** State rendered by the profile step. */
export interface ProfileOnboardingState {
  status: 'idle' | 'loading' | 'ready' | 'saving' | 'error'
  /** True when the durable section already carries a non-empty userName. */
  profiled: boolean
  error: string | null
}

/**
 * Accept any object section verbatim; a malformed durable value reads as an
 * empty section, so the step treats it as un-profiled instead of leaving the
 * scope stuck on its previous value.
 * @param section - the wire section value.
 * @returns the section object, or an empty one for non-object values.
 */
export function decodeOnboardingSection(section: unknown): OnboardingProfileSection {
  return typeof section === 'object' && section !== null && !Array.isArray(section)
    ? section as OnboardingProfileSection
    : {}
}

/* v8 ignore next 3 -- closed-union default only defends future source widening */
function assertNever(_value: never): never {
  throw new Error('unexpected onboarding settings status')
}

/** Mirrors one field to localStorage, tolerating denied storage. */
function mirrorToLocalStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage denied: the durable scope still holds the profile.
  }
}

/** Coordinates durable Host persistence plus the localStorage mirror. */
export class ProfileOnboardingStore {
  /** uSES-safe state source shared by the registered profile step. */
  readonly store: SnapshotStore<ProfileOnboardingState> = createSnapshotStore<ProfileOnboardingState>({
    status: 'idle', profiled: false, error: null,
  })

  private localProfiled = false
  private following: (() => void) | undefined

  /**
   * @param scope - the onboarding settings namespace scope; its memory mode is
   *   what keeps a remote browser process-local.
   */
  constructor(private readonly scope: SettingsScope<OnboardingProfileSection>) {}

  /**
   * Begin following the bound scope (idempotent) and publish its current answer.
   * @returns settlement after the current answer is published.
   */
  load(): Promise<void> {
    this.following ??= this.scope.subscribe(() => { this.derive() })
    this.derive()
    return Promise.resolve()
  }

  /**
   * Persist name and email to the durable scope (or advance only this process
   * for a remote browser) and mirror both to localStorage.
   * @param name - non-blank owner name.
   * @param email - owner email; optional.
   * @returns true when the selected persistence mode holds the profile.
   */
  async save(name: string, email: string): Promise<boolean> {
    const trimmedName = name.trim()
    if (trimmedName === '') return false
    const trimmedEmail = email.trim()
    if (this.scope.getSnapshot().mode === 'memory') {
      this.localProfiled = true
      this.derive()
    } else {
      this.store.update((state) => { state.status = 'saving'; state.error = null })
      try {
        await this.scope.set('userName', trimmedName)
        if (trimmedEmail !== '') await this.scope.set('userEmail', trimmedEmail)
      } catch {
        this.derive()
        this.store.update((state) => {
          state.status = 'error'
          state.error = 'the profile did not persist'
        })
        return false
      }
      this.derive()
      if (!this.store.getSnapshot().profiled) {
        this.store.update((state) => {
          state.status = 'error'
          state.error = 'the profile did not persist'
        })
        return false
      }
    }
    mirrorToLocalStorage(USER_NAME_STORE_KEY, trimmedName)
    if (trimmedEmail !== '') mirrorToLocalStorage(USER_EMAIL_STORE_KEY, trimmedEmail)
    return true
  }

  /** Stop following the scope. */
  dispose(): void {
    this.following?.()
    this.following = undefined
  }

  private derive(): void {
    const scope = this.scope.getSnapshot()
    if (scope.mode === 'memory') {
      this.store.update((state) => {
        state.status = 'ready'
        state.profiled = this.localProfiled
        state.error = null
      })
      return
    }
    switch (scope.status) {
      case 'loading':
        this.store.update((state) => { state.status = 'loading'; state.error = null })
        return
      case 'unavailable':
        // An unavailable durable section must not wedge the first run: the
        // step still asks (memory-mode rules apply at save time).
        this.store.update((state) => {
          state.status = 'ready'
          state.profiled = false
          state.error = null
        })
        return
      case 'ready': {
        const profiled = typeof scope.value?.userName === 'string' && scope.value.userName.trim() !== ''
        this.store.update((state) => {
          state.status = 'ready'
          state.profiled = profiled
          state.error = null
        })
        return
      }
      /* v8 ignore next -- every current settings scope status is handled above */
      default: return assertNever(scope.status)
    }
  }
}
