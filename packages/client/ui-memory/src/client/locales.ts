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
  'profile.title': 'Your {product}',
  'profile.hint': '{product} follows these in this and every session.',
  'profile.name': 'What should {product} call you?',
  'profile.name.placeholder': 'Your name',
  'profile.instructions': 'Instructions for every conversation',
  'profile.instructions.placeholder': 'For example: reply in Portuguese, keep answers short, explain code step by step.',
  'profile.saved': 'Saved',
  'save.failed': 'Could not save the change. Try again.',
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
  'profile.title': 'Seu {product}',
  'profile.hint': 'O {product} segue isto nesta e em todas as sessões.',
  'profile.name': 'Como o {product} deve chamar você?',
  'profile.name.placeholder': 'Seu nome',
  'profile.instructions': 'Instruções para todas as conversas',
  'profile.instructions.placeholder': 'Por exemplo: responda em português, seja breve, explique código passo a passo.',
  'profile.saved': 'Salvo',
  'save.failed': 'Não foi possível salvar a alteração. Tente de novo.',
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
  'profile.title': '你的 {product}',
  'profile.hint': '{product} 会在本次及每个会话中遵循这些设置。',
  'profile.name': '{product} 应该怎么称呼你？',
  'profile.name.placeholder': '你的名字',
  'profile.instructions': '每次对话的指令',
  'profile.instructions.placeholder': '例如：用中文回复，回答简短，逐步解释代码。',
  'profile.saved': '已保存',
  'save.failed': '无法保存此更改，请重试。',
} satisfies Record<MemoryKey, string>

/** The Japanese dictionary. */
export const ja = {
  'title': 'メモリー',
  'hint': 'DSHC はこのセッションと今後のすべてのセッションで、これらのメモリーに従います。常に覚えておいてほしい事実、好み、訂正を追加してください。',
  'empty': 'まだメモリーはありません。下で追加すると、DSHC はすべてのセッションでそれを覚えています。',
  'add.placeholder': 'DSHC に常に覚えておいてほしいこと…',
  'add': 'メモリーを追加',
  'delete': 'メモリーを削除',
  'edit': '編集',
  'edit.save': '保存',
  'edit.cancel': 'キャンセル',
  'profile.title': 'あなたの {product}',
  'profile.hint': '{product} はこのセッションとすべてのセッションでこれに従います。',
  'profile.name': '{product} はあなたを何と呼べばよいですか？',
  'profile.name.placeholder': 'あなたの名前',
  'profile.instructions': 'すべての会話への指示',
  'profile.instructions.placeholder': '例：日本語で返信、簡潔に答える、コードは手順ごとに説明する。',
  'profile.saved': '保存しました',
  'save.failed': '変更を保存できませんでした。もう一度お試しください。',
} satisfies Record<MemoryKey, string>

/** The Spanish dictionary. */
export const es = {
  'title': 'Memoria',
  'hint': 'DSHC respeta estos recuerdos en esta y en todas las sesiones. Añade hechos, preferencias o correcciones que quieras que recuerde siempre.',
  'empty': 'Aún no hay recuerdos. Añade uno abajo y DSHC lo recordará en todas las sesiones.',
  'add.placeholder': 'Algo que DSHC deba recordar siempre…',
  'add': 'Añadir recuerdo',
  'delete': 'Eliminar recuerdo',
  'edit': 'Editar',
  'edit.save': 'Guardar',
  'edit.cancel': 'Cancelar',
  'profile.title': 'Tu {product}',
  'profile.hint': '{product} sigue esto en esta y en todas las sesiones.',
  'profile.name': '¿Cómo debe llamarte {product}?',
  'profile.name.placeholder': 'Tu nombre',
  'profile.instructions': 'Instrucciones para todas las conversaciones',
  'profile.instructions.placeholder': 'Por ejemplo: responde en español, sé breve, explica el código paso a paso.',
  'profile.saved': 'Guardado',
  'save.failed': 'No se pudo guardar el cambio. Inténtalo de nuevo.',
} satisfies Record<MemoryKey, string>

/** The French dictionary. */
export const fr = {
  'title': 'Mémoire',
  'hint': 'DSHC respecte ces souvenirs dans cette session et dans toutes les autres. Ajoutez les faits, préférences ou corrections qu’il doit toujours retenir.',
  'empty': 'Aucun souvenir pour l’instant. Ajoutez-en un ci-dessous et DSHC s’en souviendra dans toutes les sessions.',
  'add.placeholder': 'Quelque chose que DSHC doit toujours retenir…',
  'add': 'Ajouter un souvenir',
  'delete': 'Supprimer le souvenir',
  'edit': 'Modifier',
  'edit.save': 'Enregistrer',
  'edit.cancel': 'Annuler',
  'profile.title': 'Votre {product}',
  'profile.hint': '{product} suit ces réglages dans cette session et toutes les autres.',
  'profile.name': 'Comment {product} doit-il vous appeler ?',
  'profile.name.placeholder': 'Votre nom',
  'profile.instructions': 'Instructions pour chaque conversation',
  'profile.instructions.placeholder': 'Par exemple : réponds en français, sois bref, explique le code étape par étape.',
  'profile.saved': 'Enregistré',
  'save.failed': 'Impossible d’enregistrer la modification. Réessayez.',
} satisfies Record<MemoryKey, string>

/** The German dictionary. */
export const de = {
  'title': 'Erinnerungen',
  'hint': 'DSHC beachtet diese Erinnerungen in dieser und in jeder weiteren Sitzung. Füge Fakten, Vorlieben oder Korrekturen hinzu, die es sich immer merken soll.',
  'empty': 'Noch keine Erinnerungen. Füge unten eine hinzu, und DSHC merkt sie sich in jeder Sitzung.',
  'add.placeholder': 'Etwas, das DSHC sich immer merken soll…',
  'add': 'Erinnerung hinzufügen',
  'delete': 'Erinnerung löschen',
  'edit': 'Bearbeiten',
  'edit.save': 'Speichern',
  'edit.cancel': 'Abbrechen',
  'profile.title': 'Ihr {product}',
  'profile.hint': '{product} befolgt dies in dieser und jeder Sitzung.',
  'profile.name': 'Wie soll {product} Sie nennen?',
  'profile.name.placeholder': 'Ihr Name',
  'profile.instructions': 'Anweisungen für jedes Gespräch',
  'profile.instructions.placeholder': 'Zum Beispiel: Antworte auf Deutsch, fasse dich kurz, erkläre Code Schritt für Schritt.',
  'profile.saved': 'Gespeichert',
  'save.failed': 'Die Änderung konnte nicht gespeichert werden. Versuchen Sie es erneut.',
} satisfies Record<MemoryKey, string>

/** The Russian dictionary. */
export const ru = {
  'title': 'Память',
  'hint': 'DSHC учитывает эти воспоминания в этой и во всех следующих сессиях. Добавьте факты, предпочтения или исправления, которые он должен помнить всегда.',
  'empty': 'Воспоминаний пока нет. Добавьте одно ниже, и DSHC будет помнить его во всех сессиях.',
  'add.placeholder': 'То, что DSHC должен помнить всегда…',
  'add': 'Добавить воспоминание',
  'delete': 'Удалить воспоминание',
  'edit': 'Изменить',
  'edit.save': 'Сохранить',
  'edit.cancel': 'Отмена',
  'profile.title': 'Ваш {product}',
  'profile.hint': '{product} следует этому в этом и каждом сеансе.',
  'profile.name': 'Как {product} должен к вам обращаться?',
  'profile.name.placeholder': 'Ваше имя',
  'profile.instructions': 'Инструкции для каждого разговора',
  'profile.instructions.placeholder': 'Например: отвечай по-русски, кратко, объясняй код по шагам.',
  'profile.saved': 'Сохранено',
  'save.failed': 'Не удалось сохранить изменение. Попробуйте ещё раз.',
} satisfies Record<MemoryKey, string>
