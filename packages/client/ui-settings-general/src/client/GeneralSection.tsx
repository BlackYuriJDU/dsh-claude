/** The General section: the shell-owned Perfil block plus feature rows. */
import type { PropsLocale, PropsRenderSlots, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { ProfileRows, type ProfileSection } from './ProfileRows.tsx'
import css from './GeneralSection.module.css'

/** Injected business face: the durable profile scope the Perfil block rides. */
export interface GeneralSectionInjected {
  profile: SettingsScope<ProfileSection>
}

/** Full component props: section owner share + item render share + locale seat + injected scope. */
export type GeneralSectionComponentProps =
  PropsRuntime<'settings.section'> & PropsRenderSlots<'settings.general.item'>
  & PropsLocale<'settings'> & GeneralSectionInjected

/**
 * Render the General section content column.
 * @param props - composed slot props (contract/slots.ts).
 * @returns the section element tree.
 */
export function GeneralSection({ profile, t, renderSlot }: GeneralSectionComponentProps) {
  return (
    <div className={css.section}>
      <div className={css.groupTitle}>{t('profile.title')}</div>
      <ProfileRows profile={profile} t={t} />
      <div className={css.groupTitle}>{t('prefs.title')}</div>
      {renderSlot('settings.general.item', {})}
    </div>
  )
}
