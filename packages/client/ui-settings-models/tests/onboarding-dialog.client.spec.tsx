// @vitest-environment jsdom
/** First-run profile + provider onboarding behavior. */
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RpcResponse, SettingsNamespaceView } from '@deepseek-ai/dsh-api-remotes/client'
import { bindSnapshotSelector } from '@deepseek-ai/dsh-client-test-runtime'
import type { SettingsScope, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
import { ProfileOnboarding } from '../src/client/ProfileOnboarding.tsx'
import type { ProfileOnboardingProps } from '../src/client/ProfileOnboarding.tsx'
import { ProfileOnboardingStore, type OnboardingProfileSection } from '../src/client/profile-store.ts'
import { ProviderOnboarding } from '../src/client/ProviderOnboarding.tsx'
import type { ProviderOnboardingProps } from '../src/client/ProviderOnboarding.tsx'
import { SettingsDescribeMirror } from '@deepseek-ai/dsh-client-ui-settings/src/client/settings-mirror.ts'
import { ModelsSettingsStore } from '../src/client/store.ts'
import { en } from '../src/client/locales.ts'
import { settingsSchema } from './settings-schema.client.ts'

afterEach(() => {
  cleanup()
  document.getElementById('root')?.remove()
  window.localStorage.clear()
})

let nextRpc = 0
function ok<T>(value: T): RpcResponse<T> {
  return { rpcId: `onboarding-${nextRpc++}` as never, result: { ok: true, value } }
}
function fail<T>(message: string): RpcResponse<T> {
  return {
    rpcId: `onboarding-${nextRpc++}` as never,
    result: { ok: false, error: { code: 'internal', message, details: {} } },
  }
}

/** SettingsScope double over an in-memory section (host or memory mode). */
function scopeDouble(options: {
  value?: OnboardingProfileSection
  mode?: 'host' | 'memory'
  status?: 'ready' | 'loading' | 'unavailable'
  setReject?: string
} = {}) {
  let snapshot: SettingsScopeSnapshot<OnboardingProfileSection> = {
    status: options.status ?? 'ready',
    value: options.value ?? {},
    base: undefined,
    user: undefined,
    revision: 0,
    writable: true,
    mode: options.mode ?? 'host',
  }
  const listeners = new Set<() => void>()
  const set = vi.fn((field: string, value: unknown) => {
    if (options.setReject !== undefined) return Promise.reject(new Error(options.setReject))
    snapshot = { ...snapshot, value: { ...snapshot.value, [field]: value } }
    for (const listener of listeners) listener()
    return Promise.resolve()
  })
  const scope: SettingsScope<OnboardingProfileSection> = {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    set: (field, value) => set(field, value),
    unset: () => Promise.resolve(),
  }
  return { scope, set }
}

/** Shared owner/inject props scaffold for both steps. */
function ownerProps() {
  const openSection = vi.fn()
  const complete = vi.fn()
  const unusedHook = (() => { throw new Error('unused standard hook') }) as never
  return { openSection, complete, unusedHook }
}

/** Profile harness: a real ProfileOnboardingStore over the scope double. */
function profileHarness(options: Parameters<typeof scopeDouble>[0] = {}) {
  if (document.getElementById('root') === null) {
    const appRoot = document.createElement('div')
    appRoot.id = 'root'
    document.body.append(appRoot)
  }
  const { scope, set } = scopeDouble(options)
  const controller = new ProfileOnboardingStore(scope)
  const { openSection, complete, unusedHook } = ownerProps()
  const props: ProfileOnboardingProps = {
    stepId: 'profile',
    complete,
    openSection,
    useSessions: unusedHook,
    useWorkspaces: unusedHook,
    controller,
    useProfile: bindSnapshotSelector(controller.store),
    t: key => en[key],
  }
  return { controller, complete, openSection, props, set }
}

const DeepSeekConfigShape = {
  ns: 'llm-deepseek',
  schema: {},
  value: { apiKeyEnv: 'DEEPSEEK_API_KEY' },
  base: { apiKeyEnv: 'DEEPSEEK_API_KEY' },
  user: {},
  applies: 'live',
  secrets: [],
  revision: 0,
} as unknown as SettingsNamespaceView

/** Provider harness: the shared Models join over a scripted wire face. */
function providerHarness(options: {
  provider?: boolean
  providerActive?: boolean
  settingsNamespace?: boolean
  apiKeyEnv?: string | null
  configured?: () => boolean
  describeFailure?: string
  providersReject?: boolean
} = {}) {
  if (document.getElementById('root') === null) {
    const appRoot = document.createElement('div')
    appRoot.id = 'root'
    document.body.append(appRoot)
  }
  const configured = options.configured ?? (() => false)
  const apiKeyEnv = options.apiKeyEnv === undefined ? 'DEEPSEEK_API_KEY' : options.apiKeyEnv
  const face = {
    llm: {
      providers: () => {
        if (options.providersReject === true) return Promise.reject(new Error('provider transport unavailable'))
        return Promise.resolve(ok({
          providers: options.provider === false
            ? []
            : [{
              provider: 'deepseek-official',
              displayName: 'DeepSeek',
              settingsNs: 'llm-deepseek',
              settingsPath: [],
              active: options.providerActive ?? true,
            }],
        }))
      },
    },
    settings: {
      describe: () => Promise.resolve(ok({
        writable: true,
        hasDocument: false,
        namespaces: options.settingsNamespace === false
          ? []
          : [{ ...DeepSeekConfigShape, value: { apiKeyEnv } }],
      })),
      mutate: () => Promise.resolve(ok(DeepSeekConfigShape)),
    },
    credentials: {
      describe: () => options.describeFailure === undefined
        ? Promise.resolve(ok({
          credentials: {
            DEEPSEEK_API_KEY: { configured: configured(), writable: true },
          },
        }))
        : Promise.resolve(fail(options.describeFailure)),
      set: () => Promise.resolve(ok({})),
    },
  }
  const controller = new ModelsSettingsStore(face as never, settingsSchema, new SettingsDescribeMirror(face as never))
  const { openSection, complete, unusedHook } = ownerProps()
  const props: ProviderOnboardingProps = {
    stepId: 'provider',
    complete,
    openSection,
    useSessions: unusedHook,
    useWorkspaces: unusedHook,
    controller,
    useModels: bindSnapshotSelector(controller.store),
    t: key => en[key],
  }
  return { controller, complete, openSection, props }
}

describe('ProfileOnboarding', () => {
  it('skips a durable section that already carries a non-empty userName', async () => {
    const h = profileHarness({ value: { userName: 'Arthur' } })
    const view = render(<ProfileOnboarding {...h.props} />)
    await act(async () => { await h.controller.load() })
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => { expect(h.complete).toHaveBeenCalledOnce() })
    view.unmount()
  })

  it('asks a fresh DSHC again even when localStorage already has the old profile', async () => {
    window.localStorage.setItem('dshc:user-name', 'Arthur')
    const h = profileHarness({ value: {} })
    const view = render(<ProfileOnboarding {...h.props} />)
    await act(async () => { await h.controller.load() })
    expect(await screen.findByRole('dialog', { name: en.profileTitle })).toBeTruthy()
    expect(h.complete).not.toHaveBeenCalled()
    view.unmount()
  })

  it('renders both fields, inerts the product, and focuses the name', async () => {
    const h = profileHarness()
    render(<ProfileOnboarding {...h.props} />)
    expect(await screen.findByRole('dialog', { name: en.profileTitle })).toBeTruthy()
    expect(document.getElementById('root')?.inert).toBe(true)
    expect(screen.getByLabelText(en.profileName)).toBeTruthy()
    expect(screen.getByLabelText(en.profileEmail)).toBeTruthy()
    await waitFor(() => { expect(document.activeElement).toBe(screen.getByLabelText(en.profileName)) })
  })

  it('requires a non-blank name and a well-formed email', async () => {
    const h = profileHarness()
    render(<ProfileOnboarding {...h.props} />)
    await screen.findByRole('dialog')
    const submit = screen.getByRole<HTMLButtonElement>('button', { name: en.profileContinue })
    expect(submit.disabled).toBe(true)
    fireEvent.change(screen.getByLabelText(en.profileName), { target: { value: '   ' } })
    expect(submit.disabled).toBe(true)
    fireEvent.change(screen.getByLabelText(en.profileName), { target: { value: 'Arthur' } })
    // A valid name alone is enough: the email stays optional.
    expect(submit.disabled).toBe(false)
    fireEvent.change(screen.getByLabelText(en.profileEmail), { target: { value: 'not-an-email' } })
    expect(submit.disabled).toBe(true)
    expect(screen.getByText(en.profileEmailHint)).toBeTruthy()
    fireEvent.change(screen.getByLabelText(en.profileEmail), { target: { value: 'arthur@example.com' } })
    expect(submit.disabled).toBe(false)
  })

  it('persists to the durable scope and mirrors both fields to localStorage', async () => {
    const h = profileHarness()
    render(<ProfileOnboarding {...h.props} />)
    await screen.findByRole('dialog')
    fireEvent.change(screen.getByLabelText(en.profileName), { target: { value: 'Arthur' } })
    fireEvent.change(screen.getByLabelText(en.profileEmail), { target: { value: 'arthur@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: en.profileContinue }))
    await waitFor(() => { expect(h.complete).toHaveBeenCalledOnce() })
    expect(h.set).toHaveBeenCalledWith('userName', 'Arthur')
    expect(h.set).toHaveBeenCalledWith('userEmail', 'arthur@example.com')
    expect(window.localStorage.getItem('dshc:user-name')).toBe('Arthur')
    expect(window.localStorage.getItem('dshc:user-email')).toBe('arthur@example.com')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('keeps the modal open and reports a refused write', async () => {
    const h = profileHarness({ setReject: 'connection lost' })
    render(<ProfileOnboarding {...h.props} />)
    await screen.findByRole('dialog')
    fireEvent.change(screen.getByLabelText(en.profileName), { target: { value: 'Arthur' } })
    fireEvent.click(screen.getByRole('button', { name: en.profileContinue }))
    expect(await screen.findByText(en.profileError)).toBeTruthy()
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(h.complete).not.toHaveBeenCalled()
  })

  it('saves memory-mode profiles without touching the scope (remote browser)', async () => {
    const h = profileHarness({ mode: 'memory' })
    render(<ProfileOnboarding {...h.props} />)
    await screen.findByRole('dialog')
    fireEvent.change(screen.getByLabelText(en.profileName), { target: { value: 'Arthur' } })
    fireEvent.click(screen.getByRole('button', { name: en.profileContinue }))
    await waitFor(() => { expect(h.complete).toHaveBeenCalledOnce() })
    expect(h.set).not.toHaveBeenCalled()
    expect(window.localStorage.getItem('dshc:user-name')).toBe('Arthur')
  })
})

describe('ProviderOnboarding', () => {
  it('renders when no provider is usable and routes the primary to the Models page', async () => {
    const h = providerHarness()
    render(<ProviderOnboarding {...h.props} />)
    expect(await screen.findByRole('dialog', { name: en.providerTitle })).toBeTruthy()
    expect(screen.getByText(en.providerDescription)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: en.providerAdd }))
    expect(h.complete).toHaveBeenCalledOnce()
    expect(h.openSection).toHaveBeenCalledWith('models')
  })

  it('allows now-not-now dismissal without opening settings', async () => {
    const h = providerHarness()
    render(<ProviderOnboarding {...h.props} />)
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: en.providerLater }))
    expect(h.complete).toHaveBeenCalledOnce()
    expect(h.openSection).not.toHaveBeenCalled()
  })

  it('does not block the product when the join cannot decide', async () => {
    for (const options of [
      { describeFailure: 'credentials service is absent' },
      { providersReject: true },
      { providerActive: false },
      { settingsNamespace: false },
      { apiKeyEnv: null },
    ]) {
      const h = providerHarness(options)
      const view = render(<ProviderOnboarding {...h.props} />)
      await act(async () => { await h.controller.load() })
      expect(screen.queryByRole('dialog')).toBeNull()
      await waitFor(() => { expect(h.complete).toHaveBeenCalledOnce() })
      view.unmount()
    }
  })

  it('closes when an external credential refresh makes the provider usable', async () => {
    let configured = false
    const h = providerHarness({ configured: () => configured })
    render(<ProviderOnboarding {...h.props} />)
    await screen.findByRole('dialog')
    configured = true
    await act(async () => { await h.controller.load() })
    await waitFor(() => { expect(screen.queryByRole('dialog')).toBeNull() })
    expect(h.complete).toHaveBeenCalledOnce()
  })
})
