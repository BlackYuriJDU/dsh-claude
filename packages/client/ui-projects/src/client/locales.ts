/** The Projects section copy; the shell owns the nav row label. */

/** The projects namespace key union. */
export type ProjectsKey = keyof typeof en

/** The English copy for the same key set. */
export const en = {
  'title': 'Projects',
  'hint': 'Each workspace can carry its own instructions and knowledge files. DSHC follows them in every session that runs in that workspace.',
  'empty': 'No workspaces yet. Add one from the sidebar to give it instructions and knowledge.',
  'instructions': 'Instructions',
  'instructions.placeholder': 'How DSHC should work in this project…',
  'knowledge': 'Knowledge files',
  'knowledge.hint': 'DSHC reads each file when a session starts a turn. Paths are absolute or relative to the workspace folder.',
  'knowledge.empty': 'No knowledge files yet.',
  'knowledge.placeholder': 'notes/brief.md',
  'knowledge.add': 'Add file',
  'knowledge.remove': 'Remove',
  'saved': 'Saved',
} satisfies Record<string, string>

/** The pt-BR dictionary. */
export const pt = {
  'title': 'Projetos',
  'hint': 'Cada workspace pode ter suas próprias instruções e arquivos de conhecimento. O DSHC os segue em toda sessão que roda naquele workspace.',
  'empty': 'Nenhum workspace ainda. Adicione um pela barra lateral para dar a ele instruções e conhecimento.',
  'instructions': 'Instruções',
  'instructions.placeholder': 'Como o DSHC deve trabalhar neste projeto…',
  'knowledge': 'Arquivos de conhecimento',
  'knowledge.hint': 'O DSHC lê cada arquivo quando uma sessão começa um turno. Os caminhos são absolutos ou relativos à pasta do workspace.',
  'knowledge.empty': 'Nenhum arquivo de conhecimento ainda.',
  'knowledge.placeholder': 'notes/brief.md',
  'knowledge.add': 'Adicionar arquivo',
  'knowledge.remove': 'Remover',
  'saved': 'Salvo',
} satisfies Record<ProjectsKey, string>

/** The Chinese dictionary. */
export const zh = {
  'title': '项目',
  'hint': '每个工作区都可以有自己的指令和知识文件。DSHC 会在该工作区中运行的每个会话里遵循它们。',
  'empty': '还没有工作区。从侧栏添加一个，为它设置指令和知识。',
  'instructions': '指令',
  'instructions.placeholder': 'DSHC 在这个项目中应如何工作…',
  'knowledge': '知识文件',
  'knowledge.hint': '会话开始每一轮时，DSHC 会读取每个文件。路径可以是绝对路径，或相对于工作区文件夹的路径。',
  'knowledge.empty': '还没有知识文件。',
  'knowledge.placeholder': 'notes/brief.md',
  'knowledge.add': '添加文件',
  'knowledge.remove': '移除',
  'saved': '已保存',
} satisfies Record<ProjectsKey, string>
