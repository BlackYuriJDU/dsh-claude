/** Locale namespace owned by Session export browser feedback. */
export const NS = 'session-log-download'

/** English Session export strings — the source-of-truth key set. */
export const en = {
  'dialog.preparingTitle': 'Exporting Session',
  'dialog.preparingDescription': 'Preparing a ZIP containing this Session, its sub-Sessions, and attachments.',
  'dialog.successTitle': 'Session download started',
  'dialog.successDescription': 'The browser is downloading the Session ZIP.',
  'dialog.errorTitle': 'Session export failed',
  'dialog.close': 'Close',
  'dialog.commandFailed': 'Could not start the Session export.',
} as const

/** Portuguese (pt-BR) Session export strings. */
export const pt: Partial<Record<keyof typeof en, string>> = {
  'dialog.preparingTitle': 'Exportando a Session',
  'dialog.preparingDescription': 'Preparando um ZIP com esta Session, suas sub-Sessions e os anexos.',
  'dialog.successTitle': 'O download da Session começou',
  'dialog.successDescription': 'O navegador está baixando o ZIP da Session.',
  'dialog.errorTitle': 'Falha na exportação da Session',
  'dialog.close': 'Fechar',
  'dialog.commandFailed': 'Não foi possível iniciar a exportação da Session.',
}

/** Stable locale keys consumed by the shared modal. */
export type SessionLogDownloadKey = keyof typeof en
