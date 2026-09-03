/** `sidebar` namespace dictionaries: shell controls (brand row, New Session, fold toggle). */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'session.new': '新对话',
  'session.new.label': '新对话',
  'toggle.open': '打开侧边栏',
  'toggle.collapse': '收起侧边栏',
  'nav.label': '导航',
  'nav.projects': '项目',
  'nav.artifacts': '工件',
  'nav.code': '代码',
  'nav.customize': '个性化',
  'nav.design': '设计',
  'profile.settings': '设置',
  'profile.language': '语言',
  'profile.help': '获取帮助',
} satisfies Record<string, string>

/** The sidebar namespace key union. */
export type SidebarKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'session.new': 'Novo',
  'session.new.label': 'Nova sessão',
  'toggle.open': 'Abrir barra lateral',
  'toggle.collapse': 'Recolher barra lateral',
  'nav.label': 'Navegação',
  'nav.projects': 'Projetos',
  'nav.artifacts': 'Artefatos',
  'nav.code': 'Código',
  'nav.customize': 'Personalizar',
  'nav.design': 'Design',
  'profile.settings': 'Configurações',
  'profile.language': 'Idioma',
  'profile.help': 'Receber ajuda',
} satisfies Record<SidebarKey, string>
