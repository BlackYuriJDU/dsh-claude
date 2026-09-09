/** `sidebar` namespace dictionaries: shell controls (brand row, New Session, fold toggle, nav modals, profile foot). */

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
  'nav.soon': '即将上线',
  'close': '关闭',
  'profile.settings': '设置',
  'profile.language': '语言',
  'profile.help': '获取帮助',
  'profile.search': '搜索对话',
  'projects.modal.title': '项目',
  'projects.empty': '暂无项目',
  'projects.new': '新建项目',
  'projects.creating': '创建中…',
  'projects.openFolder': '打开文件夹',
  'projects.error': '无法创建项目',
  'projects.footer': '项目文件夹中的文件对 agent 可见；根目录的 AGENTS.md 会自动注入为上下文。',
  'artifacts.modal.title': '工件',
  'artifacts.empty': 'Design 生成的文件将显示在这里。',
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
  'nav.soon': 'Em breve',
  'close': 'Fechar',
  'profile.settings': 'Configurações',
  'profile.language': 'Idioma',
  'profile.help': 'Receber ajuda',
  'profile.search': 'Buscar conversas',
  'projects.modal.title': 'Projetos',
  'projects.empty': 'Nenhum projeto ainda',
  'projects.new': 'Novo projeto',
  'projects.creating': 'Criando…',
  'projects.openFolder': 'Abrir pasta',
  'projects.error': 'Não foi possível criar o projeto',
  'projects.footer': 'Os arquivos da pasta do projeto ficam visíveis ao agente; um AGENTS.md na raiz é injetado automaticamente.',
  'artifacts.modal.title': 'Artefatos',
  'artifacts.empty': 'Os arquivos gerados pelo Design aparecerão aqui.',
} satisfies Record<SidebarKey, string>
