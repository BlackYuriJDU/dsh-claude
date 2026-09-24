/**
 * Profile rows: the reference Perfil block — avatar, full name, display
 * name, and the DSHC instructions textarea. Shell-owned (no feature owns
 * the owner's profile): all four persist through the durable `ui-onboarding`
 * scope; the display name mirrors to localStorage (`dshc:user-name`) so the
 * hero greeting and the sidebar foot read it synchronously, and the avatar
 * lives in localStorage alone (`dshc:avatar` — a data URL never rides the
 * settings document).
 */
import { useRef, useState, useSyncExternalStore } from 'react'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import css from './ProfileRows.module.css'

/** Namespace of the shell dictionary the profile copy rides. */
export const PROFILE_NS = 'settings'

/** The durable section fields this block owns. */
export interface ProfileSection {
  /** Displayed owner name (hero greeting, sidebar foot). */
  userName?: string
  /** Legal full name (settings display). */
  userFullName?: string
  /** Displayed owner email (Account section). */
  userEmail?: string
  /** Free-form standing instructions the agent should honor. */
  instructions?: string
  /** Legacy welcome-notice acknowledgement field (kept on write). */
  welcomeNoticeVersion?: string
}

/** localStorage key holding the owner avatar (data URL). */
export const USER_AVATAR_STORE_KEY = 'dshc:avatar'
/** Window event the sidebar listens to: profile facts changed. */
export const PROFILE_UPDATED_EVENT = 'dshc:profile-updated'

/** Read the stored avatar data URL, tolerating denied storage. */
export function ownerAvatarOf(): string {
  try {
    return window.localStorage.getItem(USER_AVATAR_STORE_KEY) ?? ''
  } catch {
    return ''
  }
}

/** Persist one avatar value (empty string removes), tolerating denied storage. */
export function ownerAvatarSet(dataUrl: string): void {
  try {
    if (dataUrl === '') window.localStorage.removeItem(USER_AVATAR_STORE_KEY)
    else window.localStorage.setItem(USER_AVATAR_STORE_KEY, dataUrl)
  } catch {
    // Storage denied: the avatar simply does not persist.
  }
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT))
}

/** Downscale one image file to a square ~128px data URL, or '' on failure. */
export function avatarDataUrlOf(file: File, edge = 128): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onerror = () => resolve('')
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => resolve('')
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = edge
        canvas.height = edge
        const ctx = canvas.getContext('2d')
        if (ctx === null) return resolve('')
        // Cover the square: center-crop the longer side.
        const scale = Math.max(edge / image.width, edge / image.height)
        const width = image.width * scale
        const height = image.height * scale
        ctx.drawImage(image, (edge - width) / 2, (edge - height) / 2, width, height)
        resolve(canvas.toDataURL('image/png'))
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

/** The current text fields (empty strings for unset), tolerating absent sections. */
function fieldsOf(profile: SettingsScope<ProfileSection>): { fullName: string; displayName: string; instructions: string } {
  const value = profile.getSnapshot().value
  return {
    fullName: value?.userFullName ?? '',
    displayName: value?.userName ?? '',
    instructions: value?.instructions ?? '',
  }
}

/**
 * Render the Perfil block: avatar row plus the three text rows.
 * @param props - the durable profile scope and the dictionary seat.
 * @returns the row element tree.
 */
export function ProfileRows({ profile, t }: {
  profile: SettingsScope<ProfileSection>
  t: TranslateNS<'settings'>
}) {
  const snapshot = useSyncExternalStore(profile.subscribe.bind(profile), profile.getSnapshot.bind(profile))
  const initial = fieldsOf(profile)
  const [fullName, setFullName] = useState(initial.fullName)
  const [displayName, setDisplayName] = useState(initial.displayName)
  const [instructions, setInstructions] = useState(initial.instructions)
  const avatar = ownerAvatarOf()
  const fileRef = useRef<HTMLInputElement | null>(null)
  // The committed values re-read when the scope publishes (another surface
  // wrote the same field); local edits keep their own draft state until commit.
  const committed = snapshot.value
  const committedFullName = committed?.userFullName ?? ''
  const committedDisplayName = committed?.userName ?? ''
  const committedInstructions = committed?.instructions ?? ''

  const commitFullName = (): void => {
    const trimmed = fullName.trim()
    if (trimmed === committedFullName) { setFullName(committedFullName); return }
    void profile.set('userFullName', trimmed)
  }
  const commitDisplayName = (): void => {
    const trimmed = displayName.trim()
    if (trimmed === committedDisplayName) { setDisplayName(committedDisplayName); return }
    try {
      if (trimmed === '') window.localStorage.removeItem('dshc:user-name')
      else window.localStorage.setItem('dshc:user-name', trimmed)
    } catch {
      // Storage denied: the durable scope still holds the profile.
    }
    window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT))
    void profile.set('userName', trimmed)
  }
  const commitInstructions = (): void => {
    if (instructions === committedInstructions) return
    void profile.set('instructions', instructions)
  }

  return (
    <div className={css.rows}>
      <div className={css.row}>
        <span className={css.label}>{t('profile.avatar')}</span>
        <span className={css.avatarStack}>
          <span className={css.avatarPreview} aria-hidden="true">
            {avatar === ''
              ? <span className={css.avatarFallback}>{(committedDisplayName || 'A').charAt(0).toUpperCase()}</span>
              : <img className={css.avatarImage} src={avatar} alt="" />}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file === undefined) return
              void avatarDataUrlOf(file).then(dataUrl => {
                if (dataUrl !== '') ownerAvatarSet(dataUrl)
              })
            }}
          />
          <button type="button" className={css.linkButton} onClick={() => { fileRef.current?.click() }}>
            {t('profile.avatar.change')}
          </button>
          {avatar !== '' && (
            <button type="button" className={css.linkButton} onClick={() => { ownerAvatarSet('') }}>
              {t('profile.avatar.remove')}
            </button>
          )}
        </span>
      </div>
      <div className={css.row}>
        <span className={css.label}>{t('profile.fullName')}</span>
        <input
          className={css.textField}
          value={fullName}
          onChange={e => { setFullName(e.target.value) }}
          onBlur={commitFullName}
          onKeyDown={e => { if (e.key === 'Enter') commitFullName() }}
        />
      </div>
      <div className={css.row}>
        <span className={css.label}>{t('profile.displayName')}</span>
        <input
          className={css.textField}
          value={displayName}
          onChange={e => { setDisplayName(e.target.value) }}
          onBlur={commitDisplayName}
          onKeyDown={e => { if (e.key === 'Enter') commitDisplayName() }}
        />
      </div>
      <div className={css.row}>
        <span className={css.label}>{t('profile.instructions')}</span>
        <textarea
          className={css.instructionsField}
          value={instructions}
          rows={4}
          onChange={e => { setInstructions(e.target.value) }}
          onBlur={commitInstructions}
        />
        <span className={css.hint}>{t('profile.instructions.hint')}</span>
      </div>
    </div>
  )
}
