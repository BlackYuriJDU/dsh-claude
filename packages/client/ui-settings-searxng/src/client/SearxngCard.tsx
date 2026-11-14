/** The SearXNG search provider's settings page: where to search and how to filter results. */

import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import { SettingsForm, SettingsValueField } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { formLabels } from './locales.ts'
import type { SearxngCardFace } from './searxng-card-controller.ts'

/** Props the renderer binds for the SearXNG page. */
export type SearxngCardProps =
  PropsRuntime<'plugins.item'>
  & PropsLocale<'settings.searxng'>
  & InjectFace<SearxngCardFace>

const STRING_FIELD_IDS = ['baseURL', 'language', 'categories'] as const

/**
 * Render the provider's one-liner or its settings form, as the Plugins page asks.
 * @param props - the view asked for, locale copy, the form snapshot, and its actions.
 * @returns the one-liner, or the form.
 */
export function SearxngCard(props: SearxngCardProps) {
  const { t } = props
  const state = props.useSearxngCard(snapshot => snapshot)
  if (props.view === 'summary') return t('description')
  const disabled = !state.writable
  const common = { overriddenLabel: t('overridden'), resetLabel: t('reset'), invalidLabel: t('invalidNumber'), disabled }
  return (
    <SettingsForm labels={formLabels(t)} state={state} onSave={props.save} onDiscard={props.discard}>
      {STRING_FIELD_IDS.map(field => (
        <SettingsValueField
          key={field}
          id={`plugin-config-searxng-${field}`}
          label={t(field)}
          hint={t(`${field}Hint`)}
          {...common}
          {...state[field]}
          onEdit={(text) => { props.edit(field, text) }}
          onReset={() => { props.resetField(field) }}
        />
      ))}
      <SettingsValueField
        id="plugin-config-searxng-safeSearch"
        label={t('safeSearch')}
        hint={t('safeSearchHint')}
        numeric
        {...common}
        {...state.safeSearch}
        onEdit={(text) => { props.edit('safeSearch', text) }}
        onReset={() => { props.resetField('safeSearch') }}
      />
    </SettingsForm>
  )
}
