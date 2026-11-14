/**
 * Approval-prompt text for the sensitive-access policy in every Client locale.
 * @module @deepseek-ai/dsh-sensitive-access-policy/locales
 */

/** Client locales the approval prompt is localized into. */
export type PromptLocale = 'en' | 'zh' | 'ja' | 'es' | 'fr' | 'de' | 'ru' | 'pt'

const PROTECTED_PATH: Record<PromptLocale, (path: string) => string> = {
  en: path => `Allow reading ${path}? It matches a protected path, such as keys or environment secrets.`,
  zh: path => `允许读取 ${path} 吗？它匹配受保护路径，例如密钥或环境变量中的机密。`,
  ja: path => `${path} の読み取りを許可しますか？鍵や環境変数の秘密情報など、保護されたパスに一致します。`,
  es: path => `¿Permitir leer ${path}? Coincide con una ruta protegida, como claves o secretos de entorno.`,
  fr: path => `Autoriser la lecture de ${path} ? Ce chemin est protégé, comme les clés ou les secrets d’environnement.`,
  de: path => `Lesen von ${path} erlauben? Der Pfad ist geschützt, etwa für Schlüssel oder Umgebungsgeheimnisse.`,
  ru: path => `Разрешить чтение ${path}? Путь защищён: например, ключи или секреты окружения.`,
  pt: path => `Permitir ler ${path}? O caminho é protegido, como chaves ou segredos de ambiente.`,
}

const FETCH_WITH_DATA: Record<PromptLocale, (host: string) => string> = {
  en: host => `Allow sending this request to ${host}? Its address carries data, and the site is not on the allowed list.`,
  zh: host => `允许向 ${host} 发送此请求吗？其地址携带数据，且该站点不在允许列表中。`,
  ja: host => `${host} へのこのリクエストを許可しますか？アドレスにデータが含まれ、サイトは許可リストにありません。`,
  es: host => `¿Permitir enviar esta solicitud a ${host}? Su dirección lleva datos y el sitio no está en la lista permitida.`,
  fr: host => `Autoriser l’envoi de cette requête à ${host} ? Son adresse contient des données et le site n’est pas dans la liste autorisée.`,
  de: host => `Diese Anfrage an ${host} senden? Ihre Adresse enthält Daten, und die Website steht nicht auf der Liste erlaubter Websites.`,
  ru: host => `Разрешить отправить этот запрос на ${host}? Его адрес содержит данные, а сайт не входит в список разрешённых.`,
  pt: host => `Permitir enviar esta requisição a ${host}? O endereço leva dados e o site não está na lista permitida.`,
}

function localized(texts: Record<PromptLocale, (value: string) => string>, value: string): Record<PromptLocale, string> {
  return {
    en: texts.en(value), zh: texts.zh(value), ja: texts.ja(value), es: texts.es(value),
    fr: texts.fr(value), de: texts.de(value), ru: texts.ru(value), pt: texts.pt(value),
  }
}

/**
 * The approval prompt for reading a protected path.
 * @param path - the resolved path the call reads.
 * @returns the prompt in every Client locale.
 */
export function protectedPathPrompt(path: string): Record<PromptLocale, string> {
  return localized(PROTECTED_PATH, path)
}

/**
 * The approval prompt for a fetch whose address carries data.
 * @param host - the destination host.
 * @returns the prompt in every Client locale.
 */
export function fetchWithDataPrompt(host: string): Record<PromptLocale, string> {
  return localized(FETCH_WITH_DATA, host)
}
