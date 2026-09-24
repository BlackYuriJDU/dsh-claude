/** Projects section copy (per-project instructions + knowledge files). */

/** The projects namespace key union. */
export type ProjectsKey = keyof typeof en

/** The English copy for the same key set. */
export const en = {
  'nav': 'Projects',
  'title': 'Projects',
  'hint': 'Each project (workspace) can carry its own instructions and knowledge files. DSHC injects them into every session of that project.',
  'empty': 'No projects yet. Create one from the sidebar to attach instructions and knowledge.',
  'instructions': 'Project instructions',
  'instructions.hint': 'Honored in every session of this project.',
  'knowledge': 'Knowledge files',
  'knowledge.hint': 'The content of each file is injected into the project\'s sessions.',
  'knowledge.empty': 'No knowledge files attached.',
  'knowledge.add': 'Attach file',
  'knowledge.remove': 'Remove',
  'save': 'Save',
  'saved': 'Saved',
} satisfies Record<string, string>

/** The pt-BR dictionary. */
export const pt = {
  'nav': 'Projetos',
  'title': 'Projetos',
  'hint': 'Cada projeto (workspace) pode ter suas próprias instruções e arquivos de conhecimento. O DSHC os injeta em toda sessão daquele projeto.',
  'empty': 'Nenhum projeto ainda. Crie um pela barra lateral para anexar instruções e conhecimento.',
  'instructions': 'Instruções do projeto',
  'instructions.hint': 'Consideradas em toda sessão deste projeto.',
  'knowledge': 'Arquivos de conhecimento',
  'knowledge.hint': 'O conteúdo de cada arquivo é injetado nas sessões do projeto.',
  'knowledge.empty': 'Nenhum arquivo de conhecimento anexado.',
  'knowledge.add': 'Anexar arquivo',
  'knowledge.remove': 'Remover',
  'save': 'Salvar',
  'saved': 'Salvo',
} satisfies Record<ProjectsKey, string>
