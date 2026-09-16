/** `settings.locale` namespace dictionary (the Language row's copy). */

/** The settings.locale namespace dictionary (the key-set source of truth). */
export const en = {
  'language.title': 'Language',
} satisfies Record<string, string>

/** The settings.locale namespace key union. */
export type SettingsLocaleKey = keyof typeof en
