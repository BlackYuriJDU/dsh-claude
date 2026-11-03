/** The Memory section copy; the shell owns the nav row label. */

/** The memory namespace key union. */
export type MemoryKey = keyof typeof en

/** The English copy for the same key set. */
export const en = {
  'title': 'Memory',
  'hint': 'DSHC honors these memories in this and every session. Add facts, preferences, or corrections you want it to always remember.',
  'empty': 'No memories yet. Add one below and DSHC will remember it across every session.',
  'add.placeholder': 'Something for DSHC to always remember…',
  'add': 'Add memory',
  'delete': 'Delete memory',
  'edit': 'Edit',
  'edit.save': 'Save',
  'edit.cancel': 'Cancel',
} satisfies Record<string, string>

/** The pt-BR dictionary. */
export const pt = {
  'title': 'Memória',
  'hint': 'O DSHC honra estas memórias nesta e em todas as sessões. Adicione fatos, preferências ou correções que você quer que ele sempre lembre.',
  'empty': 'Nenhuma memória ainda. Adicione uma abaixo e o DSHC vai lembrar dela em todas as sessões.',
  'add.placeholder': 'Algo para o DSHC sempre lembrar…',
  'add': 'Adicionar memória',
  'delete': 'Apagar memória',
  'edit': 'Editar',
  'edit.save': 'Salvar',
  'edit.cancel': 'Cancelar',
} satisfies Record<MemoryKey, string>

/** The Chinese dictionary. */
export const zh = {
  'title': '记忆',
  'hint': 'DSHC 会在本次及之后的每个会话中遵循这些记忆。添加你希望它始终记住的事实、偏好或更正。',
  'empty': '还没有记忆。在下方添加一条，DSHC 会在每个会话中记住它。',
  'add.placeholder': '希望 DSHC 始终记住的内容…',
  'add': '添加记忆',
  'delete': '删除记忆',
  'edit': '编辑',
  'edit.save': '保存',
  'edit.cancel': '取消',
} satisfies Record<MemoryKey, string>
