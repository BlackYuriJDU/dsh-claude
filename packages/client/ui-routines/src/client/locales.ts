/** Routines section copy (en + pt). */

/** The routines namespace key union. */
export type RoutinesKey = keyof typeof en

/** The English copy for the same key set. */
export const en = {
  'title': 'Routines',
  'hint': 'Scheduled tasks that run automatically on an interval. Each routine starts a fresh session with its prompt.',
  'empty': 'No routines yet. Add one below.',
  'col.name': 'Name',
  'col.schedule': 'Schedule',
  'col.prompt': 'Prompt',
  'every.minutes': 'Every {n} min',
  'every.hours': 'Every {n} h',
  'every.days': 'Every {n} d',
  'enabled': 'Enabled',
  'paused': 'Paused',
  'delete': 'Delete',
  'add.name.placeholder': 'Routine name',
  'add.prompt.placeholder': 'What should the agent do on each run?',
  'add.every': 'Every',
  'add.unit.minutes': 'minutes',
  'add.unit.hours': 'hours',
  'add.unit.days': 'days',
  'add.cwd.placeholder': 'Workspace path (optional)',
  'add': 'Add routine',
  'lastRun': 'Last run {when}',
  'neverRan': 'Never ran',
} satisfies Record<string, string>

/** The pt-BR dictionary. */
export const pt = {
  'title': 'Rotinas',
  'hint': 'Tarefas agendadas que rodam automaticamente em um intervalo. Cada rotina inicia uma nova sessão com seu prompt.',
  'empty': 'Nenhuma rotina ainda. Adicione uma abaixo.',
  'col.name': 'Nome',
  'col.schedule': 'Agenda',
  'col.prompt': 'Prompt',
  'every.minutes': 'A cada {n} min',
  'every.hours': 'A cada {n} h',
  'every.days': 'A cada {n} d',
  'enabled': 'Ativa',
  'paused': 'Pausada',
  'delete': 'Apagar',
  'add.name.placeholder': 'Nome da rotina',
  'add.prompt.placeholder': 'O que o agente deve fazer a cada execução?',
  'add.every': 'A cada',
  'add.unit.minutes': 'minutos',
  'add.unit.hours': 'horas',
  'add.unit.days': 'dias',
  'add.cwd.placeholder': 'Caminho do workspace (opcional)',
  'add': 'Adicionar rotina',
  'lastRun': 'Última execução {when}',
  'neverRan': 'Nunca executada',
} satisfies Record<RoutinesKey, string>
