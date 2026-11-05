/** Locale bundles for the SearXNG search provider's settings page. */

import type { SettingsFormLabels } from '@deepseek-ai/dsh-client-ui-primitives'

/** Locale keys the page renders. */
export type SearxngSettingsLocaleKey =
  | 'title'
  | 'description'
  | 'baseURL'
  | 'baseURLHint'
  | 'language'
  | 'languageHint'
  | 'categories'
  | 'categoriesHint'
  | 'safeSearch'
  | 'safeSearchHint'
  | 'overridden'
  | 'reset'
  | 'readOnly'
  | 'unavailable'
  | 'save'
  | 'saving'
  | 'saveFailed'
  | 'invalidNumber'

/** English copy. */
export const en: Record<SearxngSettingsLocaleKey, string> = {
  title: 'SearXNG search',
  description: 'Choose the SearXNG instance web search uses and how it filters results.',
  baseURL: 'Instance URL',
  baseURLHint: 'Base URL of a SearXNG instance with JSON output enabled. Leave blank to use $SEARXNG_URL.',
  language: 'Language',
  languageHint: 'Search language sent to the instance, for example pt-BR. Leave blank for the instance default.',
  categories: 'Categories',
  categoriesHint: 'Comma-separated SearXNG categories, for example general,news. Leave blank for the instance default.',
  safeSearch: 'SafeSearch',
  safeSearchHint: '0 off, 1 moderate, 2 strict. Leave blank for the instance default.',
  overridden: 'Overridden',
  reset: 'Reset to default',
  readOnly: 'This deployment stores settings read-only.',
  unavailable: 'This plugin is not loaded, so it cannot be configured right now.',
  save: 'Save',
  saving: 'Saving…',
  saveFailed: 'The deployment did not accept these values; they were left for you to correct.',
  invalidNumber: 'Enter a number, or leave blank to use the default.',
}

/**
 * Map the page's copy onto the shared settings form labels.
 * @param t - the page's translate function.
 * @returns the form labels.
 */
export function formLabels(t: (key: SearxngSettingsLocaleKey) => string): SettingsFormLabels {
  return { unavailable: t('unavailable'), readOnly: t('readOnly'), saveFailed: t('saveFailed'), save: t('save'), saving: t('saving') }
}

/** Simplified Chinese copy. */
export const zh: Record<SearxngSettingsLocaleKey, string> = {
  title: 'SearXNG 搜索',
  description: '选择网页搜索使用的 SearXNG 实例及其结果过滤方式。',
  baseURL: '实例 URL',
  baseURLHint: '启用了 JSON 输出的 SearXNG 实例基址。留空则使用 $SEARXNG_URL。',
  language: '语言',
  languageHint: '发送给实例的搜索语言，例如 pt-BR。留空则使用实例默认值。',
  categories: '分类',
  categoriesHint: '以逗号分隔的 SearXNG 分类，例如 general,news。留空则使用实例默认值。',
  safeSearch: '安全搜索',
  safeSearchHint: '0 关闭，1 中等，2 严格。留空则使用实例默认值。',
  overridden: '已覆盖',
  reset: '恢复默认',
  readOnly: '本部署的设置为只读。',
  unavailable: '该插件当前未加载，暂时无法配置。',
  save: '保存',
  saving: '保存中…',
  saveFailed: '本部署没有接受这些值，已保留供你修改。',
  invalidNumber: '请填数字；留空表示使用默认值。',
}

/** Japanese copy. */
export const ja: Record<SearxngSettingsLocaleKey, string> = {
  title: 'SearXNG 検索',
  description: 'Web 検索で使う SearXNG インスタンスと結果の絞り込み方法を選びます。',
  baseURL: 'インスタンス URL',
  baseURLHint: 'JSON 出力を有効にした SearXNG インスタンスのベース URL。空欄なら $SEARXNG_URL を使います。',
  language: '言語',
  languageHint: 'インスタンスに送る検索言語（例: pt-BR）。空欄ならインスタンスの既定値。',
  categories: 'カテゴリ',
  categoriesHint: 'カンマ区切りの SearXNG カテゴリ（例: general,news）。空欄ならインスタンスの既定値。',
  safeSearch: 'セーフサーチ',
  safeSearchHint: '0 オフ、1 中程度、2 厳格。空欄ならインスタンスの既定値。',
  overridden: '上書き済み',
  reset: 'デフォルトに戻す',
  readOnly: 'このデプロイでは設定が読み取り専用で保存されます。',
  unavailable: 'このプラグインは読み込まれていないため、現在設定できません。',
  save: '保存',
  saving: '保存中…',
  saveFailed: 'デプロイがこれらの値を受け付けませんでした。修正のため残されています。',
  invalidNumber: '数値を入力するか、空欄のままにするとデフォルトが使用されます。',
}

/** Spanish copy. */
export const es: Record<SearxngSettingsLocaleKey, string> = {
  title: 'Búsqueda SearXNG',
  description: 'Elige la instancia de SearXNG que usa la búsqueda web y cómo filtra los resultados.',
  baseURL: 'URL de la instancia',
  baseURLHint: 'URL base de una instancia de SearXNG con la salida JSON activada. Déjala vacía para usar $SEARXNG_URL.',
  language: 'Idioma',
  languageHint: 'Idioma de búsqueda enviado a la instancia, por ejemplo pt-BR. Déjalo vacío para usar el predeterminado de la instancia.',
  categories: 'Categorías',
  categoriesHint: 'Categorías de SearXNG separadas por comas, por ejemplo general,news. Déjalo vacío para usar el predeterminado de la instancia.',
  safeSearch: 'SafeSearch',
  safeSearchHint: '0 desactivado, 1 moderado, 2 estricto. Déjalo vacío para usar el predeterminado de la instancia.',
  overridden: 'Anulado',
  reset: 'Restablecer los valores predeterminados',
  readOnly: 'Esta implementación almacena configuraciones de solo lectura.',
  unavailable: 'Este complemento no está cargado, por lo que no se puede configurar en este momento.',
  save: 'Guardar',
  saving: 'Guardando…',
  saveFailed: 'El despliegue no aceptó estos valores; quedaron para que usted los corrigiera.',
  invalidNumber: 'Ingrese un número o déjelo en blanco para usar el valor predeterminado.',
}

/** French copy. */
export const fr: Record<SearxngSettingsLocaleKey, string> = {
  title: 'Recherche SearXNG',
  description: 'Choisissez l’instance SearXNG utilisée par la recherche web et le filtrage des résultats.',
  baseURL: 'URL de l’instance',
  baseURLHint: 'URL de base d’une instance SearXNG avec la sortie JSON activée. Laissez vide pour utiliser $SEARXNG_URL.',
  language: 'Langue',
  languageHint: 'Langue de recherche envoyée à l’instance, par exemple pt-BR. Laissez vide pour la valeur par défaut de l’instance.',
  categories: 'Catégories',
  categoriesHint: 'Catégories SearXNG séparées par des virgules, par exemple general,news. Laissez vide pour la valeur par défaut de l’instance.',
  safeSearch: 'SafeSearch',
  safeSearchHint: '0 désactivé, 1 modéré, 2 strict. Laissez vide pour la valeur par défaut de l’instance.',
  overridden: 'Remplacé',
  reset: 'Réinitialiser aux valeurs par défaut',
  readOnly: 'Ce déploiement stocke les paramètres en lecture seule.',
  unavailable: 'Ce plugin n\'est pas chargé, il ne peut donc pas être configuré pour le moment.',
  save: 'Enregistrer',
  saving: 'Sauvegarde…',
  saveFailed: 'Le déploiement n\'a pas accepté ces valeurs ; ils vous ont été laissés à corriger.',
  invalidNumber: 'Entrez un numéro ou laissez ce champ vide pour utiliser la valeur par défaut.',
}

/** German copy. */
export const de: Record<SearxngSettingsLocaleKey, string> = {
  title: 'SearXNG-Suche',
  description: 'Wähle die SearXNG-Instanz für die Websuche und wie sie Ergebnisse filtert.',
  baseURL: 'Instanz-URL',
  baseURLHint: 'Basis-URL einer SearXNG-Instanz mit aktivierter JSON-Ausgabe. Leer lassen, um $SEARXNG_URL zu verwenden.',
  language: 'Sprache',
  languageHint: 'An die Instanz gesendete Suchsprache, zum Beispiel pt-BR. Leer lassen für den Standard der Instanz.',
  categories: 'Kategorien',
  categoriesHint: 'Kommagetrennte SearXNG-Kategorien, zum Beispiel general,news. Leer lassen für den Standard der Instanz.',
  safeSearch: 'SafeSearch',
  safeSearchHint: '0 aus, 1 mittel, 2 streng. Leer lassen für den Standard der Instanz.',
  overridden: 'Überschrieben',
  reset: 'Auf Standard zurücksetzen',
  readOnly: 'Diese Bereitstellung speichert Einstellungen schreibgeschützt.',
  unavailable: 'Dieses Plugin ist nicht geladen und kann daher derzeit nicht konfiguriert werden.',
  save: 'Speichern',
  saving: 'Speichern…',
  saveFailed: 'Die Bereitstellung hat diese Werte nicht akzeptiert. Sie mussten sie korrigieren.',
  invalidNumber: 'Geben Sie eine Zahl ein oder lassen Sie das Feld leer, um den Standardwert zu verwenden.',
}

/** Russian copy. */
export const ru: Record<SearxngSettingsLocaleKey, string> = {
  title: 'Поиск SearXNG',
  description: 'Выберите экземпляр SearXNG для веб-поиска и способ фильтрации результатов.',
  baseURL: 'URL экземпляра',
  baseURLHint: 'Базовый URL экземпляра SearXNG с включённым выводом JSON. Оставьте пустым, чтобы использовать $SEARXNG_URL.',
  language: 'Язык',
  languageHint: 'Язык поиска, отправляемый экземпляру, например pt-BR. Оставьте пустым для значения экземпляра по умолчанию.',
  categories: 'Категории',
  categoriesHint: 'Категории SearXNG через запятую, например general,news. Оставьте пустым для значения экземпляра по умолчанию.',
  safeSearch: 'SafeSearch',
  safeSearchHint: '0 выкл., 1 умеренный, 2 строгий. Оставьте пустым для значения экземпляра по умолчанию.',
  overridden: 'Переопределено',
  reset: 'Сбросить настройки по умолчанию',
  readOnly: 'В этом развертывании параметры сохраняются только для чтения.',
  unavailable: 'Этот плагин не загружен, поэтому его невозможно настроить прямо сейчас.',
  save: 'Сохранить',
  saving: 'Сохранение…',
  saveFailed: 'Развертывание не приняло эти значения; их оставили вам на исправление.',
  invalidNumber: 'Введите число или оставьте поле пустым, чтобы использовать значение по умолчанию.',
}

/** pt-BR copy. */
export const pt: Record<SearxngSettingsLocaleKey, string> = {
  title: 'Busca SearXNG',
  description: 'Escolha a instância SearXNG que a busca na web usa e como ela filtra os resultados.',
  baseURL: 'URL da instância',
  baseURLHint: 'URL base de uma instância SearXNG com a saída JSON ativada. Deixe em branco para usar $SEARXNG_URL.',
  language: 'Idioma',
  languageHint: 'Idioma de busca enviado à instância, por exemplo pt-BR. Deixe em branco para o padrão da instância.',
  categories: 'Categorias',
  categoriesHint: 'Categorias do SearXNG separadas por vírgula, por exemplo general,news. Deixe em branco para o padrão da instância.',
  safeSearch: 'SafeSearch',
  safeSearchHint: '0 desligado, 1 moderado, 2 estrito. Deixe em branco para o padrão da instância.',
  overridden: 'Substituído',
  reset: 'Redefinir para o padrão',
  readOnly: 'Esta implantação armazena configurações somente leitura.',
  unavailable: 'Este plugin não está carregado, portanto não pode ser configurado agora.',
  save: 'Salvar',
  saving: 'Salvando…',
  saveFailed: 'A implantação não aceitou esses valores; eles foram deixados para você corrigir.',
  invalidNumber: 'Insira um número ou deixe em branco para usar o padrão.',
}
