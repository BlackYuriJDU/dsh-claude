/** Builtin HTML metadata and keyed body registration; assembly belongs to the package entry. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '../index.ts'
import type { DocumentPreviewDefinition } from '../document/registry.ts'
import { hostFileOf } from '../rpc.ts'
import { parseFileAddress } from '@deepseek-ai/dsh-util-workspace-path'
// Type-only: the ctx.sessions Context merge.
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
// Type-only: the ctx.conversation input registry on Session scopes.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { formatHtmlComment } from './comments.ts'
import { HtmlBody } from './HtmlBody.tsx'
import type { HtmlBodyInjected } from './HtmlBody.tsx'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { en, ja, es, fr, de, ru, pt, zh } from './locales.ts'

/** HTML implementation identity, shared by metadata and the keyed slot. */
export const HTML_BODY_ID = '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/html'

/**
 * Describe the builtin HTML renderer's file types and loading mode.
 * @param title - locale-owned implementation name.
 * @returns metadata for complete HTML documents.
 */
export function htmlBodyDefinition(title: () => string): DocumentPreviewDefinition {
  return { id: HTML_BODY_ID, extensions: ['html', 'htm'], priority: 'builtin', title, loading: 'bytes-complete', wrap: false }
}

/**
 * Register the HTML dictionary, metadata and body with reversible effects.
 * @param ctx - owning plugin context.
 */
export function apply(ctx: Context): void {
  const t = ctx.locale.bind('documentHtml')
  ctx.effect(() => ctx.locale.register('documentHtml', { zh, en, ja, es, fr, de, ru, pt }))
  ctx.effect(() => ctx.documentPreviews.register(htmlBodyDefinition(() => t('title'))))
  ctx.effect(() => ctx.slots.inject('sidebar.right.tab.document', () => ctx.slots.register(
    {
      name: 'sidebar.right.tab.document', key: HTML_BODY_ID, locale: 'documentHtml',
      inject: (): HtmlBodyInjected => ({
        hooks: { interactivePreview: ctx.configForms.developerTools.enabled },
        readRelated: (address, relativePath, signal) => {
          const file = hostFileOf(address)
          return ctx.remote.workspaceFiles.readBytes(file.sessionId, relativePath, { baseFile: file.path }, signal)
        },
        comment: (address, report) => {
          const file = parseFileAddress(address)
          if (file?.scope !== 'session') return false
          // The address is a string boundary: its id segment is the Session id it names.
          const scope = ctx.get('sessions')?.scope(file.sessionId as SessionId)
          const input = scope?.get('conversation')?.input.for(scope)
          if (input === undefined || !input.insertQuote(formatHtmlComment(report, file.path))) return false
          input.focus()
          return true
        },
      }),
    }, HtmlBody,
  )))
}
