/**
 * The Memory section: the owner's across-session memories as an editable
 * list. Every row persists through the durable `ui-memory` scope; the node
 * half projects the same list into the system prompt of every session.
 */
import { useState, useSyncExternalStore } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { MemoryItem } from '../index.ts'
import css from './MemorySection.module.css'

/** The durable memory section fields this block owns. */
export interface MemoryScopeSection {
  memories?: MemoryItem[]
}

/** Injected business face: the durable memory scope this section edits. */
export interface MemorySectionInjected {
  memory: SettingsScope<MemoryScopeSection>
}

/** Full component props: section runtime share + locale seat + injected scope. */
export type MemorySectionComponentProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'memory'>
  & MemorySectionInjected

/**
 * Render the Memory section content column.
 * @param props - composed slot props (runtime + locale seat + memory scope).
 * @returns the section element tree.
 */
export function MemorySection({ memory, t }: MemorySectionComponentProps) {
  const snapshot = useSyncExternalStore(memory.subscribe.bind(memory), memory.getSnapshot.bind(memory))
  const memories = snapshot.value?.memories ?? []
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const write = (next: readonly MemoryItem[]): void => {
    void memory.set('memories', [...next])
  }

  const add = (): void => {
    const text = draft.trim()
    if (text === '') return
    write([...memories, { id: crypto.randomUUID(), text }])
    setDraft('')
  }

  const remove = (id: string): void => {
    write(memories.filter(item => item.id !== id))
    if (editingId === id) setEditingId(null)
  }

  const startEdit = (item: MemoryItem): void => {
    setEditingId(item.id)
    setEditText(item.text)
  }

  const commitEdit = (): void => {
    if (editingId === null) return
    const text = editText.trim()
    if (text === '') {
      remove(editingId)
      return
    }
    write(memories.map(item => (item.id === editingId ? { ...item, text } : item)))
    setEditingId(null)
  }

  return (
    <div className={css.section}>
      <div className={css.groupTitle}>{t('title')}</div>
      <p className={css.hint}>{t('hint')}</p>
      {memories.length === 0
        ? <p className={css.empty}>{t('empty')}</p>
        : (
          <ul className={css.list}>
            {memories.map(item => (
              <li key={item.id} className={css.item}>
                {editingId === item.id
                  ? (
                    <>
                      <textarea
                        className={css.editField}
                        value={editText}
                        rows={3}
                        onChange={e => { setEditText(e.target.value) }}
                      />
                      <span className={css.itemActions}>
                        <button type="button" className={css.linkButton} onClick={commitEdit}>
                          {t('edit.save')}
                        </button>
                        <button type="button" className={css.linkButton} onClick={() => { setEditingId(null) }}>
                          {t('edit.cancel')}
                        </button>
                      </span>
                    </>
                  )
                  : (
                    <>
                      <span className={css.text} onDoubleClick={() => { startEdit(item) }}>{item.text}</span>
                      <span className={css.itemActions}>
                        <button type="button" className={css.linkButton} onClick={() => { startEdit(item) }}>
                          {t('edit')}
                        </button>
                        <button
                          type="button"
                          className={css.linkButton}
                          aria-label={t('delete')}
                          onClick={() => { remove(item.id) }}
                        >
                          {t('delete')}
                        </button>
                      </span>
                    </>
                  )}
              </li>
            ))}
          </ul>
        )}
      <div className={css.addRow}>
        <textarea
          className={css.addField}
          value={draft}
          rows={2}
          placeholder={t('add.placeholder')}
          onChange={e => { setDraft(e.target.value) }}
        />
        <div className={css.addActions}>
          <button
            type="button"
            className={css.primaryButton}
            disabled={draft.trim() === ''}
            onClick={add}
          >
            {t('add')}
          </button>
        </div>
      </div>
    </div>
  )
}

