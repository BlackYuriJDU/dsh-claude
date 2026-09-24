/** `handoff` namespace dictionaries (Artifacts modal). */

/** Dictionary namespace owned by this plugin. */
export const NS = 'handoff'

/** The `handoff` namespace dictionary (the key-set source of truth). */
export const en = {
  'artifacts.title': 'Artifacts',
  'artifacts.empty': 'Nothing produced yet. Files a delegated turn creates or edits appear here.',
  'artifacts.close': 'Close',
  'artifacts.turn': 'Turn {turn}',
  'artifacts.open': 'Open {name}',
  'artifacts.showInFolder': 'Show in folder',
} satisfies Record<string, string>

/** The pt-BR dictionary. */
export const pt = {
  'artifacts.title': 'Artefatos',
  'artifacts.empty': 'Nada produzido ainda. Arquivos que uma tarefa delegada criar ou editar aparecem aqui.',
  'artifacts.close': 'Fechar',
  'artifacts.turn': 'Turno {turn}',
  'artifacts.open': 'Abrir {name}',
  'artifacts.showInFolder': 'Mostrar na pasta',
} satisfies Record<HandoffKey, string>

/** Union of this namespace's dictionary keys. */
export type HandoffKey = keyof typeof en
