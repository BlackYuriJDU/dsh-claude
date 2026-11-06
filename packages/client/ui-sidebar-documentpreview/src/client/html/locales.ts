/** Locale-owned HTML implementation name and iframe status text. */
export const zh = {
  title: 'HTML',
  frame: 'HTML 文档预览',
  loading: '文档渲染中...',
  failed: '无法预览这份 HTML 文档',
  comment: '评论',
  commentHint: '点击元素，把它引用到消息中',
} satisfies Record<string, string>

/** HTML renderer dictionary keys. */
export type HtmlPreviewKey = keyof typeof zh

/** English dictionary with the same keys as the Chinese dictionary. */
export const en = {
  title: 'HTML',
  frame: 'HTML document preview',
  loading: 'Rendering document...',
  failed: 'This HTML document could not be previewed.',
  comment: 'Comment',
  commentHint: 'Click an element to quote it in your message',
} satisfies Record<HtmlPreviewKey, string>

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** HTML preview selection and status text. */
    documentHtml: HtmlPreviewKey
  }
}

/** Japanese copy, checked against the English keys. */
export const ja = {
  'title': 'HTML',
  'frame': 'HTMLドキュメントのプレビュー',
  'loading': 'ドキュメントをレンダリング中...',
  'failed': 'このHTMLドキュメントをプレビューできませんでした。',
  'comment': 'コメント',
  'commentHint': '要素をクリックしてメッセージに引用します',
} satisfies Record<keyof typeof en, string>

/** Spanish dictionary, checked against the English keys. */
export const es = {
  title: 'HTML',
  frame: 'Vista previa del documento HTML',
  loading: 'Representando documento...',
  failed: 'No se pudo obtener una vista previa de este documento HTML.',
  comment: 'Comentar',
  commentHint: 'Haz clic en un elemento para citarlo en tu mensaje',
} satisfies Record<keyof typeof en, string>

/** French dictionary, checked against the English keys. */
export const fr = {
  title: 'HTML',
  frame: 'Aperçu du document HTML',
  loading: 'Rendu du document...',
  failed: "Ce document HTML n'a pas pu être prévisualisé.",
  comment: 'Commenter',
  commentHint: 'Cliquez sur un élément pour le citer dans votre message',
} satisfies Record<keyof typeof en, string>

/** German dictionary, checked against the English keys. */
export const de = {
  title: 'HTML',
  frame: 'Vorschau des HTML-Dokuments',
  loading: 'Dokument wird gerendert...',
  failed: 'Dieses HTML-Dokument konnte nicht in der Vorschau angezeigt werden.',
  comment: 'Kommentieren',
  commentHint: 'Klicken Sie auf ein Element, um es in Ihrer Nachricht zu zitieren',
} satisfies Record<keyof typeof en, string>

/** Russian dictionary, checked against the English keys. */
export const ru = {
  title: 'HTML',
  frame: 'Предварительный просмотр HTML-документа',
  loading: 'Оформление документа...',
  failed: 'Этот HTML-документ не удалось просмотреть.',
  comment: 'Комментировать',
  commentHint: 'Нажмите на элемент, чтобы процитировать его в сообщении',
} satisfies Record<keyof typeof en, string>

/** Portuguese dictionary, checked against the English keys. */
export const pt = {
  title: 'HTML',
  frame: 'Pré-visualização do documento HTML',
  loading: 'Renderizando documento...',
  failed: 'Este documento HTML não pôde ser visualizado.',
  comment: 'Comentar',
  commentHint: 'Clique em um elemento para citá-lo na sua mensagem',
} satisfies Record<keyof typeof en, string>
