/** Theme preferences stored in the Host user-settings document. */

import z from '@deepseek-ai/schemastery'

/** Built-in preferences accepted at the registry and settings boundaries.
    DSH Claude is dark-only: the light palette never resolves. */
export const THEME_PREFERENCES = ['dark'] as const

/** Settings namespace owned by the theme plugin. */
export const THEME_SETTINGS_NAMESPACE = 'ui-theme'

/** Field carrying the selected built-in theme preference. */
export const THEME_PREFERENCE_FIELD = 'preference'

/** Theme preference persisted by the product Appearance row. */
export type ThemePreference = typeof THEME_PREFERENCES[number]

/** Default preference when the user-settings document has no override. */
export const DEFAULT_PREFERENCE: ThemePreference = 'dark'

/** Built-in chat font ids the settings row offers. */
export const CHAT_FONTS = ['inter', 'system', 'serif', 'mono'] as const

/** Field carrying the selected chat font. */
export const CHAT_FONT_FIELD = 'chatFont'

/** Chat font persisted by the product Chat-font row. */
export type ChatFont = typeof CHAT_FONTS[number]

/** Default chat font when the user-settings document has no override. */
export const DEFAULT_CHAT_FONT: ChatFont = 'inter'

/** Durable theme section shared by the Host schema and the browser scope. */
export interface ThemeSettings {
  /** Selected built-in preference. */
  preference: ThemePreference
  /** Selected chat font stack. */
  chatFont: ChatFont
}

/** Durable theme schema; also the wire envelope the browser scope validates against. */
export const ThemeSettingsSchema: z<ThemeSettings> = z.object({
  [THEME_PREFERENCE_FIELD]: z.union([...THEME_PREFERENCES]).default(DEFAULT_PREFERENCE),
  [CHAT_FONT_FIELD]: z.union([...CHAT_FONTS]).default(DEFAULT_CHAT_FONT),
})

/**
 * Narrow one wire or registry value to a persistable preference.
 * @param value - value crossing the settings or registry boundary.
 * @returns whether the value is a built-in preference.
 */
export function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.some(preference => preference === value)
}

/**
 * Narrow one wire or registry value to a chat font.
 * @param value - value crossing the settings or registry boundary.
 * @returns whether the value is a built-in chat font.
 */
export function isChatFont(value: unknown): value is ChatFont {
  return CHAT_FONTS.some(font => font === value)
}
