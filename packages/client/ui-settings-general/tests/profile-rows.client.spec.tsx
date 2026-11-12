// @vitest-environment jsdom
// Profile rows and the Account section: avatar storage and downscaling, the
// commit rules of each text field, the display-name mirror the sidebar reads,
// and the read-only email row.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { SettingsScope, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
import { AccountSection } from '../src/client/AccountSection.tsx'
import {
  avatarDataUrlOf, ownerAvatarOf, ownerAvatarSet, PROFILE_UPDATED_EVENT, ProfileRows, USER_AVATAR_STORE_KEY,
  type ProfileSection,
} from '../src/client/ProfileRows.tsx'
import { SoonSection } from '../src/client/SoonSection.tsx'
import { en } from '../src/client/locales.ts'

const t = ((key: string) => (en as Record<string, string>)[key] ?? key) as never

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

/** A host-mode scope whose writes publish back to subscribers. */
function scopeOf(value: ProfileSection | undefined = {}) {
  let revision = 0
  let snapshot: SettingsScopeSnapshot<ProfileSection> = {
    status: 'ready', value, base: undefined, user: undefined, revision, writable: true, mode: 'host',
  }
  const listeners = new Set<() => void>()
  const set = vi.fn((field: string, next: unknown) => {
    revision += 1
    snapshot = { ...snapshot, value: { ...snapshot.value, [field]: next }, revision }
    for (const listener of listeners) listener()
    return Promise.resolve()
  })
  const scope: SettingsScope<ProfileSection> = {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    set: (field, next) => set(field, next),
    unset: () => Promise.resolve(),
  }
  return { scope, set }
}

/** Deny every localStorage access for the rest of the test. */
function denyStorage(): void {
  for (const method of ['getItem', 'setItem', 'removeItem'] as const) {
    vi.spyOn(Storage.prototype, method).mockImplementation(() => { throw new Error('denied') })
  }
}

/** Replace FileReader with one that settles as the test asks. */
function stubReader(outcome: { result: unknown } | 'error'): void {
  vi.stubGlobal('FileReader', class {
    result: unknown = null
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    readAsDataURL(): void {
      if (outcome === 'error') { this.onerror?.(); return }
      this.result = outcome.result
      this.onload?.()
    }
  })
}

/** Replace Image with one that loads (as width x height) or fails once its src is set. */
function stubImage(outcome: { width: number; height: number } | 'error'): void {
  vi.stubGlobal('Image', class {
    width = outcome === 'error' ? 0 : outcome.width
    height = outcome === 'error' ? 0 : outcome.height
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    set src(_value: string) {
      if (outcome === 'error') this.onerror?.()
      else this.onload?.()
    }
  })
}

const file = new File(['png'], 'me.png', { type: 'image/png' })

describe('avatar storage', () => {
  it('reads, writes, and removes the stored avatar and announces each change', () => {
    const announced = vi.fn()
    window.addEventListener(PROFILE_UPDATED_EVENT, announced)
    expect(ownerAvatarOf()).toBe('')
    ownerAvatarSet('data:image/png;base64,AAAA')
    expect(window.localStorage.getItem(USER_AVATAR_STORE_KEY)).toBe('data:image/png;base64,AAAA')
    expect(ownerAvatarOf()).toBe('data:image/png;base64,AAAA')
    ownerAvatarSet('')
    expect(window.localStorage.getItem(USER_AVATAR_STORE_KEY)).toBeNull()
    expect(announced).toHaveBeenCalledTimes(2)
    window.removeEventListener(PROFILE_UPDATED_EVENT, announced)
  })

  it('tolerates denied storage on read and write', () => {
    denyStorage()
    expect(ownerAvatarOf()).toBe('')
    expect(() => { ownerAvatarSet('data:image/png;base64,AAAA') }).not.toThrow()
  })
})

describe('avatarDataUrlOf', () => {
  it('center-crops the image onto a square canvas', async () => {
    stubReader({ result: 'data:image/png;base64,SRC' })
    stubImage({ width: 256, height: 128 })
    const drawImage = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as never)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,OUT')
    expect(await avatarDataUrlOf(file, 64)).toBe('data:image/png;base64,OUT')
    // 256x128 scaled by 0.5 covers 64 tall and overflows 128 wide, centered.
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), -32, 0, 128, 64)
  })

  it('resolves empty when the file, the image, or the canvas cannot be used', async () => {
    stubReader('error')
    expect(await avatarDataUrlOf(file)).toBe('')

    stubReader({ result: new ArrayBuffer(1) })
    expect(await avatarDataUrlOf(file)).toBe('')

    stubReader({ result: 'data:image/png;base64,SRC' })
    stubImage('error')
    expect(await avatarDataUrlOf(file)).toBe('')

    stubImage({ width: 10, height: 10 })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    expect(await avatarDataUrlOf(file)).toBe('')
  })
})

describe('ProfileRows', () => {
  const field = (label: string) => screen.getByText(label).parentElement!.querySelector('input, textarea') as HTMLInputElement

  it('commits a changed full name on blur and Enter, and reverts an unchanged trim', () => {
    const { scope, set } = scopeOf({ userFullName: 'Arthur Dent' })
    render(<ProfileRows profile={scope} t={t} />)
    const input = field(en['profile.fullName'])

    fireEvent.change(input, { target: { value: '  Arthur Dent  ' } })
    fireEvent.blur(input)
    expect(set).not.toHaveBeenCalled()
    expect(input.value).toBe('Arthur Dent')

    fireEvent.change(input, { target: { value: 'Arthur P. Dent' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(set).toHaveBeenCalledWith('userFullName', 'Arthur P. Dent')
    fireEvent.keyDown(input, { key: 'a' })
    expect(set).toHaveBeenCalledOnce()
  })

  it('mirrors a changed display name to the sidebar and clears it when emptied', () => {
    const { scope, set } = scopeOf({ userName: 'Arthur' })
    const announced = vi.fn()
    window.addEventListener(PROFILE_UPDATED_EVENT, announced)
    render(<ProfileRows profile={scope} t={t} />)
    const input = field(en['profile.displayName'])

    fireEvent.change(input, { target: { value: ' Arthur ' } })
    fireEvent.keyDown(input, { key: 'Tab' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(set).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: 'Ford' } })
    fireEvent.blur(input)
    expect(window.localStorage.getItem('dshc:user-name')).toBe('Ford')
    expect(set).toHaveBeenLastCalledWith('userName', 'Ford')

    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.blur(input)
    expect(window.localStorage.getItem('dshc:user-name')).toBeNull()
    expect(set).toHaveBeenLastCalledWith('userName', '')
    expect(announced).toHaveBeenCalledTimes(2)
    window.removeEventListener(PROFILE_UPDATED_EVENT, announced)
  })

  it('still writes the display name when browser storage is denied', () => {
    const { scope, set } = scopeOf()
    render(<ProfileRows profile={scope} t={t} />)
    denyStorage()
    const input = field(en['profile.displayName'])
    fireEvent.change(input, { target: { value: 'Ford' } })
    fireEvent.blur(input)
    expect(set).toHaveBeenCalledWith('userName', 'Ford')
  })

  it('commits instructions only when they changed', () => {
    const { scope, set } = scopeOf({ instructions: 'Be brief.' })
    render(<ProfileRows profile={scope} t={t} />)
    const textarea = field(en['profile.instructions'])
    fireEvent.blur(textarea)
    expect(set).not.toHaveBeenCalled()
    fireEvent.change(textarea, { target: { value: 'Be thorough.' } })
    fireEvent.blur(textarea)
    expect(set).toHaveBeenCalledWith('instructions', 'Be thorough.')
  })

  it('shows the initial fallback until an avatar is picked, then offers removal', async () => {
    stubReader({ result: 'data:image/png;base64,SRC' })
    stubImage({ width: 10, height: 10 })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as never)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,OUT')
    const { scope } = scopeOf(undefined)
    const view = render(<ProfileRows profile={scope} t={t} />)
    expect(screen.getByText('A')).toBeTruthy()

    const input = view.container.querySelector('input[type="file"]') as HTMLInputElement
    const click = vi.spyOn(input, 'click')
    fireEvent.click(screen.getByRole('button', { name: en['profile.avatar.change'] }))
    expect(click).toHaveBeenCalledOnce()

    fireEvent.change(input, { target: { files: [] } })
    expect(ownerAvatarOf()).toBe('')
    await act(async () => { fireEvent.change(input, { target: { files: [file] } }) })
    expect(ownerAvatarOf()).toBe('data:image/png;base64,OUT')

    view.rerender(<ProfileRows profile={scope} t={t} />)
    expect(view.container.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,OUT')
    fireEvent.click(screen.getByRole('button', { name: en['profile.avatar.remove'] }))
    expect(ownerAvatarOf()).toBe('')
  })

  it('keeps the stored avatar when the picked file cannot be decoded', async () => {
    stubReader('error')
    const { scope } = scopeOf({ userName: 'ford' })
    const view = render(<ProfileRows profile={scope} t={t} />)
    expect(screen.getByText('F')).toBeTruthy()
    const input = view.container.querySelector('input[type="file"]') as HTMLInputElement
    await act(async () => { fireEvent.change(input, { target: { files: [file] } }) })
    expect(ownerAvatarOf()).toBe('')
  })
})

describe('AccountSection', () => {
  const kit = {
    useSessions: (() => { throw new Error('unused') }) as never,
    useWorkspaces: (() => { throw new Error('unused') }) as never,
    close: vi.fn(),
  }

  it('shows the stored email, or a dash when none was given', () => {
    const view = render(<AccountSection {...kit} profile={scopeOf({ userEmail: 'arthur@example.com' }).scope} t={t} />)
    expect(screen.getByText('arthur@example.com')).toBeTruthy()
    view.rerender(<AccountSection {...kit} profile={scopeOf(undefined).scope} t={t} />)
    expect(screen.getByText('—')).toBeTruthy()
  })
})

describe('SoonSection', () => {
  it('renders nothing for a disabled placeholder row', () => {
    expect(SoonSection()).toBeNull()
  })
})
