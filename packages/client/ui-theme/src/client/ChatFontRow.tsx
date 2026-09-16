/**
 * Chat-font row registered into the General section item slot: title + a
 * select opening the shipped font stacks. Registered by this package — the
 * theme feature owns its own settings surface. Selection follows the
 * persisted chat font.
 */
import { useState } from 'react'
import { IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type { ChatFont } from '../theme-settings.ts'
import type { ThemeKey } from './locales.ts'
import type { createChatFontRowStore } from './chat-font-store.ts'
import css from './ChatFontRow.module.css'

/** Injected business face: the chat-font write (t rides the standard locale seat). */
export interface ChatFontRowInjected {
  /** Switch the chat font. */
  setChatFont: (id: ChatFont) => void
}

/** Full component props: runtime share + store share + locale seat + injected face. */
export type ChatFontRowComponentProps =
  PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createChatFontRowStore>>
  & PropsLocale<'settings.theme'> & ChatFontRowInjected

/** Option order as the menu lists it (default first). */
const OPTIONS: readonly { id: ChatFont; labelKey: ThemeKey }[] = [
  { id: 'inter', labelKey: 'chatFont.inter' },
  { id: 'system', labelKey: 'chatFont.system' },
  { id: 'serif', labelKey: 'chatFont.serif' },
  { id: 'mono', labelKey: 'chatFont.mono' },
]

/**
 * Render the Chat-font row.
 * @param props - composed slot props.
 * @returns the row element tree.
 */
export function ChatFontRow({ t, setChatFont, useStore }: ChatFontRowComponentProps) {
  const font = useStore(s => s.chatFont)
  const [open, setOpen] = useState(false)
  const activeLabel = OPTIONS.find(option => option.id === font)?.labelKey ?? OPTIONS[0]!.labelKey

  return (
    <div className={css.row}>
      <div className={css.title}>{t('chatFont.label')}</div>
      <Menu
        open={open}
        onClose={() => { setOpen(false) }}
        items={OPTIONS.map(option => ({ id: option.id, label: t(option.labelKey) }))}
        selectedId={font}
        onSelect={(id) => {
          const option = OPTIONS.find(option => option.id === id)
          if (option !== undefined) setChatFont(option.id)
          setOpen(false)
        }}
        align="end"
        portal
        anchor={(
          <button
            type="button"
            className={css.selector}
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => { setOpen(v => !v) }}
          >
            {t(activeLabel)}
            <IconChevronDownOutline14 className={css.chevron} />
          </button>
        )}
      />
    </div>
  )
}
