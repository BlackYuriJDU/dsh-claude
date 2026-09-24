/** Shell chrome + General/Account sections + nav groups; feature rows own their copy. */

/** The settings namespace key union. */
export type SettingsKey = keyof typeof en

/** The English copy for the same key set. */
export const en = {
  'trigger': 'Settings',
  'title': 'Settings',
  'close': 'Close',
  'openDocument': 'Open configuration file',
  'openDocument.error': 'Could not open configuration file',
  'general.nav': 'General',
  'account.nav': 'Account',
  'skills.nav': 'Skills',
  'connectors.nav': 'Connectors',
  'plugins.nav': 'Plugins',
  'memory.nav': 'Memory',
  'projects.nav': 'Projects',
  'group.config': 'Settings',
  'group.personalize': 'Personalize',
  'soon': 'Coming soon',
  'account.email': 'Current email',
  'profile.title': 'Profile',
  'profile.avatar': 'Avatar',
  'profile.avatar.change': 'Change avatar',
  'profile.avatar.remove': 'Remove avatar',
  'profile.fullName': 'Full name',
  'profile.displayName': 'What should DSHC call you?',
  'profile.instructions': 'Instructions for DSHC',
  'profile.instructions.hint': 'DSHC will consider this here and in every session of yours.',
  'prefs.title': 'Preferences',
} satisfies Record<string, string>

/**
 * The pt-BR dictionary. The fork mirrors the reference chrome in Portuguese:
 * the shell, groups, and the shell-owned General/Account copy localize.
 */
export const pt = {
  'trigger': 'Configurações',
  'title': 'Configurações',
  'close': 'Fechar',
  'openDocument': 'Abrir arquivo de configuração',
  'openDocument.error': 'Não foi possível abrir o arquivo de configuração',
  'general.nav': 'Geral',
  'account.nav': 'Conta',
  'skills.nav': 'Habilidades',
  'connectors.nav': 'Conectores',
  'plugins.nav': 'Plugins',
  'memory.nav': 'Memória',
  'projects.nav': 'Projetos',
  'group.config': 'Configurações',
  'group.personalize': 'Personalizar',
  'soon': 'Em breve',
  'account.email': 'Email atual',
  'profile.title': 'Perfil',
  'profile.avatar': 'Avatar',
  'profile.avatar.change': 'Trocar avatar',
  'profile.avatar.remove': 'Remover avatar',
  'profile.fullName': 'Nome completo',
  'profile.displayName': 'Como o DSHC deve te chamar?',
  'profile.instructions': 'Instruções pro DSHC',
  'profile.instructions.hint': 'O DSHC vai considerar isto nesta e em qualquer uma das suas sessões.',
  'prefs.title': 'Preferências',
} satisfies Record<SettingsKey, string>
