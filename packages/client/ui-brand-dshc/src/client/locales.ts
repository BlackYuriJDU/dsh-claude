/** The DSHC hero greeting copy, one key per part of the day. */

/** The brand namespace key union. */
export type BrandDshcKey = keyof typeof en

/** The English copy for the same key set. */
export const en = {
  'greeting.morning': 'Good morning',
  'greeting.afternoon': 'Good afternoon',
  'greeting.evening': 'Good evening',
} satisfies Record<string, string>

/** The Chinese dictionary. */
export const zh = {
  'greeting.morning': '早上好',
  'greeting.afternoon': '下午好',
  'greeting.evening': '晚上好',
} satisfies Record<BrandDshcKey, string>

/** The Japanese dictionary. */
export const ja = {
  'greeting.morning': 'おはようございます',
  'greeting.afternoon': 'こんにちは',
  'greeting.evening': 'こんばんは',
} satisfies Record<BrandDshcKey, string>

/** The Spanish dictionary. */
export const es = {
  'greeting.morning': 'Buenos días',
  'greeting.afternoon': 'Buenas tardes',
  'greeting.evening': 'Buenas noches',
} satisfies Record<BrandDshcKey, string>

/** The French dictionary. */
export const fr = {
  'greeting.morning': 'Bonjour',
  'greeting.afternoon': 'Bon après-midi',
  'greeting.evening': 'Bonsoir',
} satisfies Record<BrandDshcKey, string>

/** The German dictionary. */
export const de = {
  'greeting.morning': 'Guten Morgen',
  'greeting.afternoon': 'Guten Tag',
  'greeting.evening': 'Guten Abend',
} satisfies Record<BrandDshcKey, string>

/** The Russian dictionary. */
export const ru = {
  'greeting.morning': 'Доброе утро',
  'greeting.afternoon': 'Добрый день',
  'greeting.evening': 'Добрый вечер',
} satisfies Record<BrandDshcKey, string>

/** The pt-BR dictionary. */
export const pt = {
  'greeting.morning': 'Bom dia',
  'greeting.afternoon': 'Boa tarde',
  'greeting.evening': 'Boa noite',
} satisfies Record<BrandDshcKey, string>
