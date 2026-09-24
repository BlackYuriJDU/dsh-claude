/**
 * Chat-font row slot store: a mirror of the theme runtime's chat font. The
 * plugin's apply-world change listener is the only writer; the row component
 * reads via props.useStore.
 */
import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-runtime/client'
import type { ChatFont } from '../theme-settings.ts'

/** Store state mirrored from the theme snapshot. */
export interface ChatFontRowState {
  /** Persisted chat font (selection state reads this). */
  chatFont: ChatFont
  /** Service revision; -1 until first sync so revision 0 lands as a change. */
  revision: number
}

/** Declared action shape giving the exported factory a stable return type. */
type ChatFontRowActions = {
  sync: (draft: ChatFontRowState, chatFont: ChatFont, revision: number) => void
}

/**
 * Declares the Chat-font row state and write surface.
 * @returns the store handle.
 */
export function createChatFontRowStore(): EngineStoreHandle<ChatFontRowState, ChatFontRowActions> {
  return defineStore({
    init: (): ChatFontRowState => ({ chatFont: 'inter', revision: -1 }),
    actions: {
      sync: (d, chatFont: ChatFont, revision: number) => {
        if (revision <= d.revision) return
        d.chatFont = chatFont
        d.revision = revision
      },
    },
  })
}
