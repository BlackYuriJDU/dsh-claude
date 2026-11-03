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

/** The Japanese dictionary. */
export const ja = {
  'title': 'プロジェクト',
  'hint': '各ワークスペースに独自の指示とナレッジファイルを持たせられます。DSHC はそのワークスペースで実行されるすべてのセッションでそれに従います。',
  'empty': 'まだワークスペースがありません。サイドバーから追加して、指示とナレッジを設定してください。',
  'instructions': '指示',
  'instructions.placeholder': 'このプロジェクトで DSHC がどのように作業すべきか…',
  'knowledge': 'ナレッジファイル',
  'knowledge.hint': 'セッションがターンを始めるたびに、DSHC は各ファイルを読み込みます。パスは絶対パス、またはワークスペースフォルダーからの相対パスです。',
  'knowledge.empty': 'まだナレッジファイルはありません。',
  'knowledge.placeholder': 'notes/brief.md',
  'knowledge.add': 'ファイルを追加',
  'knowledge.remove': '削除',
  'saved': '保存しました',
} satisfies Record<ProjectsKey, string>

/** The Spanish dictionary. */
export const es = {
  'title': 'Proyectos',
  'hint': 'Cada espacio de trabajo puede tener sus propias instrucciones y archivos de conocimiento. DSHC los sigue en todas las sesiones que se ejecutan en ese espacio de trabajo.',
  'empty': 'Aún no hay espacios de trabajo. Añade uno desde la barra lateral para darle instrucciones y conocimiento.',
  'instructions': 'Instrucciones',
  'instructions.placeholder': 'Cómo debe trabajar DSHC en este proyecto…',
  'knowledge': 'Archivos de conocimiento',
  'knowledge.hint': 'DSHC lee cada archivo cuando una sesión empieza un turno. Las rutas son absolutas o relativas a la carpeta del espacio de trabajo.',
  'knowledge.empty': 'Aún no hay archivos de conocimiento.',
  'knowledge.placeholder': 'notes/brief.md',
  'knowledge.add': 'Añadir archivo',
  'knowledge.remove': 'Quitar',
  'saved': 'Guardado',
} satisfies Record<ProjectsKey, string>

/** The French dictionary. */
export const fr = {
  'title': 'Projets',
  'hint': 'Chaque espace de travail peut avoir ses propres instructions et fichiers de connaissance. DSHC les suit dans toutes les sessions qui s’exécutent dans cet espace de travail.',
  'empty': 'Aucun espace de travail pour l’instant. Ajoutez-en un depuis la barre latérale pour lui donner des instructions et des connaissances.',
  'instructions': 'Instructions',
  'instructions.placeholder': 'Comment DSHC doit travailler dans ce projet…',
  'knowledge': 'Fichiers de connaissance',
  'knowledge.hint': 'DSHC lit chaque fichier lorsqu’une session commence un tour. Les chemins sont absolus ou relatifs au dossier de l’espace de travail.',
  'knowledge.empty': 'Aucun fichier de connaissance pour l’instant.',
  'knowledge.placeholder': 'notes/brief.md',
  'knowledge.add': 'Ajouter un fichier',
  'knowledge.remove': 'Retirer',
  'saved': 'Enregistré',
} satisfies Record<ProjectsKey, string>

/** The German dictionary. */
export const de = {
  'title': 'Projekte',
  'hint': 'Jeder Arbeitsbereich kann eigene Anweisungen und Wissensdateien haben. DSHC befolgt sie in jeder Sitzung, die in diesem Arbeitsbereich läuft.',
  'empty': 'Noch keine Arbeitsbereiche. Füge in der Seitenleiste einen hinzu, um ihm Anweisungen und Wissen zu geben.',
  'instructions': 'Anweisungen',
  'instructions.placeholder': 'Wie DSHC in diesem Projekt arbeiten soll…',
  'knowledge': 'Wissensdateien',
  'knowledge.hint': 'DSHC liest jede Datei, wenn eine Sitzung einen Turn beginnt. Pfade sind absolut oder relativ zum Ordner des Arbeitsbereichs.',
  'knowledge.empty': 'Noch keine Wissensdateien.',
  'knowledge.placeholder': 'notes/brief.md',
  'knowledge.add': 'Datei hinzufügen',
  'knowledge.remove': 'Entfernen',
  'saved': 'Gespeichert',
} satisfies Record<ProjectsKey, string>

/** The Russian dictionary. */
export const ru = {
  'title': 'Проекты',
  'hint': 'У каждого рабочего пространства могут быть свои инструкции и файлы знаний. DSHC следует им во всех сессиях, которые выполняются в этом рабочем пространстве.',
  'empty': 'Рабочих пространств пока нет. Добавьте одно на боковой панели, чтобы задать ему инструкции и знания.',
  'instructions': 'Инструкции',
  'instructions.placeholder': 'Как DSHC должен работать в этом проекте…',
  'knowledge': 'Файлы знаний',
  'knowledge.hint': 'DSHC читает каждый файл, когда сессия начинает ход. Пути абсолютные или относительно папки рабочего пространства.',
  'knowledge.empty': 'Файлов знаний пока нет.',
  'knowledge.placeholder': 'notes/brief.md',
  'knowledge.add': 'Добавить файл',
  'knowledge.remove': 'Удалить',
  'saved': 'Сохранено',
} satisfies Record<ProjectsKey, string>
