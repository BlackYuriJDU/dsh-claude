/**
 * The "Your {product}" section: what the person wants to be called and their
 * instructions for every conversation. Each field writes the `ui-memory`
 * Config through its config form when it loses focus with a changed value;
 * the Host half renders both into every session's runtime context.
 */
import { useState } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { MemoryFormValue } from '../memory.ts'
import type { MemorySectionInjected } from './MemorySection.tsx'
import { useFormSnapshot } from './form-snapshot.ts'
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
  const value = useFormSnapshot(memory, snapshot => snapshot.value)
  const stored = (field: ProfileField): string => value?.[field] ?? ''
  const [drafts, setDrafts] = useState<Partial<Record<ProfileField, string>>>({})
  const [notice, setNotice] = useState<'saved' | 'failed' | null>(null)
  const shown = (field: ProfileField): string => drafts[field] ?? stored(field)
  const change = (field: ProfileField, text: string): void => {
    setDrafts(current => ({ ...current, [field]: text }))
    setNotice(null)
  }
  // A draft that has not changed since this commit leaves once the Host accepts
  // it; a refused or failed write keeps it in the field.
  const clearDraft = (field: ProfileField, committed: string | undefined): void => {
    setDrafts(current => (current[field] === committed ? { ...current, [field]: undefined } : current))
  }
  const commit = (field: ProfileField): void => {
    const committed = drafts[field]
    const text = shown(field).trim()
    if (text === stored(field)) {
      clearDraft(field, committed)
      return
    }
    const settle = (accepted: boolean): void => {
      if (accepted) clearDraft(field, committed)
      setNotice(accepted ? 'saved' : 'failed')
    }
    memory.set(field, text satisfies MemoryFormValue[ProfileField]).then(settle, () => { settle(false) })
  }
  return (
    <div className={css.section}>
      <div className={css.groupTitle}>{t('profile.title')}</div>
      <p className={css.hint}>{t('profile.hint')}</p>
      <label className={css.fieldLabel} htmlFor="dshc-profile-name">{t('profile.name')}</label>
      <input id="dshc-profile-name" className={css.editField} value={shown('profileName')} placeholder={t('profile.name.placeholder')}
        onChange={(event) => { change('profileName', event.target.value) }} onBlur={() => { commit('profileName') }} />
      <label className={css.fieldLabel} htmlFor="dshc-profile-instructions">{t('profile.instructions')}</label>
      <textarea id="dshc-profile-instructions" className={css.editField} rows={6} value={shown('instructions')}
        placeholder={t('profile.instructions.placeholder')}
        onChange={(event) => { change('instructions', event.target.value) }} onBlur={() => { commit('instructions') }} />
      {notice === 'saved' && <p className={css.hint} role="status">{t('profile.saved')}</p>}
      {notice === 'failed' && <p className={css.hint} role="alert">{t('save.failed')}</p>}
    </div>
  )
}
