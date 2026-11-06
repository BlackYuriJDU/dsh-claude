/**
 * The "Your {product}" section: what the person wants to be called and their
 * instructions for every conversation. Each field writes the `ui-memory`
 * Config through its config form when it loses focus with a changed value;
 * the Host half renders both into every session's runtime context.
 */
import { useState, useSyncExternalStore } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { MemoryFormValue } from '../memory.ts'
import type { MemorySectionInjected } from './MemorySection.tsx'
import css from './MemorySection.module.css'

/** The props this section reads: the locale seat and the memory form it shares with the Memory section. */
export type ProfileSectionComponentProps = PropsLocale<'memory'> & MemorySectionInjected

type ProfileField = 'profileName' | 'instructions'

/**
 * Render the profile section content column.
 * @param props - the locale seat and the memory form.
 * @returns the section element tree.
 */
export function ProfileSection({ memory, t }: ProfileSectionComponentProps) {
  const snapshot = useSyncExternalStore(memory.subscribe.bind(memory), memory.getSnapshot.bind(memory))
  const stored = (field: ProfileField): string => snapshot.value?.[field] ?? ''
  const [drafts, setDrafts] = useState<Partial<Record<ProfileField, string>>>({})
  const [saved, setSaved] = useState<ProfileField | null>(null)
  const value = (field: ProfileField): string => drafts[field] ?? stored(field)
  const change = (field: ProfileField, text: string): void => {
    setDrafts(current => ({ ...current, [field]: text }))
    setSaved(null)
  }
  const commit = (field: ProfileField): void => {
    const text = value(field).trim()
    setDrafts(current => ({ ...current, [field]: undefined }))
    if (text === stored(field)) return
    void memory.set(field, text satisfies MemoryFormValue[ProfileField])
    setSaved(field)
  }
  return (
    <div className={css.section}>
      <div className={css.groupTitle}>{t('profile.title')}</div>
      <p className={css.hint}>{t('profile.hint')}</p>
      <label className={css.fieldLabel} htmlFor="dshc-profile-name">{t('profile.name')}</label>
      <input id="dshc-profile-name" className={css.editField} value={value('profileName')} placeholder={t('profile.name.placeholder')}
        onChange={(event) => { change('profileName', event.target.value) }} onBlur={() => { commit('profileName') }} />
      <label className={css.fieldLabel} htmlFor="dshc-profile-instructions">{t('profile.instructions')}</label>
      <textarea id="dshc-profile-instructions" className={css.editField} rows={6} value={value('instructions')}
        placeholder={t('profile.instructions.placeholder')}
        onChange={(event) => { change('instructions', event.target.value) }} onBlur={() => { commit('instructions') }} />
      {saved !== null && <p className={css.hint} role="status">{t('profile.saved')}</p>}
    </div>
  )
}
