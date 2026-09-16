/** `settings.theme` namespace dictionaries (the Appearance and Chat-font rows' copy). */

/** The settings.theme namespace key union. */
export type ThemeKey = keyof typeof en

/** The English copy for the same key set. */
export const en = {
  'appearance.title': 'Appearance',
  'appearance.light': 'Light',
  'appearance.dark': 'Dark',
  'appearance.system': 'System',
  'chatFont.label': 'Chat font',
  'chatFont.inter': 'Inter (default)',
  'chatFont.system': 'System',
  'chatFont.serif': 'Serif',
  'chatFont.mono': 'Mono',
} satisfies Record<string, string>

/** The pt-BR copy: the fork's shell is Portuguese-first. */
export const pt = {
  'appearance.title': 'Aparência',
  'appearance.light': 'Claro',
  'appearance.dark': 'Escuro',
  'appearance.system': 'Sistema',
  'chatFont.label': 'Fonte do chat',
  'chatFont.inter': 'Inter (padrão)',
  'chatFont.system': 'Sistema',
  'chatFont.serif': 'Serifada',
  'chatFont.mono': 'Mono',
} satisfies Record<ThemeKey, string>
