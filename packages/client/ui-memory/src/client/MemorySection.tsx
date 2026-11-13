/**
 * The Memory section: the saved memories as an editable list. Every edit
 * writes the `ui-memory` Config through its config form; the Host half
 * renders the same list into every session's runtime context.
 */
import { useRef, useState } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { MemoryFormValue, MemoryItem } from '../memory.ts'
import { randomUUID } from '@deepseek-ai/dsh-util-crypto'
import { useFormSnapshot } from './form-snapshot.ts'
import css from './MemorySection.module.css'

/** Injected business face: the memory Config form this section edits. */
export interface MemorySectionInjected {
  memory: ConfigForm<MemoryFormValue>
}

/** The props this section reads: the locale seat and the injected form; the slot passes its runtime share besides. */
export type MemorySectionComponentProps = PropsLocale<'memory'> & MemorySectionInjected

/**
 * Render the Memory section content column.
 * @param props - the locale seat and the memory form.
 * @returns the section element tree.
 */
export function MemorySection({ memory, t }: MemorySectionComponentProps) {
  const memories = useFormSnapshot(memory, snapshot => snapshot.value?.memories) ?? []
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [failed, setFailed] = useState(false)
  // While writes are in flight, each edit applies to the last queued list: the
  // snapshot only changes once the Host answers, and every write replaces the list.
  const queued = useRef<readonly MemoryItem[]>(undefined)
  const inFlight = useRef(0)

  const write = (update: (items: readonly MemoryItem[]) => MemoryItem[]): void => {
    const items = update(queued.current ?? memories)
    queued.current = items
    inFlight.current++
    setFailed(false)
    const settle = (accepted: boolean): void => {
      if (--inFlight.current === 0) queued.current = undefined
      if (!accepted) setFailed(true)
    }
    memory.set('memories', items).then(settle, () => { settle(false) })
  }

  // The add button is disabled while the trimmed draft is empty.
  const add = (): void => {
    const text = draft.trim()
    write(items => [...items, { id: randomUUID(), text }])
    setDraft('')
  }

  const remove = (id: string): void => {
    write(items => items.filter(item => item.id !== id))
    if (editingId === id) setEditingId(null)
  }

  const startEdit = (item: MemoryItem): void => {
    setEditingId(item.id)
    setEditText(item.text)
  }

  const commitEdit = (id: string): void => {
    const text = editText.trim()
    if (text === '') {
      remove(id)
      return
    }
    write(items => items.map(item => (item.id === id ? { ...item, text } : item)))
    setEditingId(null)
  }

  return (
    <div className={css.section}>
      <div className={css.groupTitle}>{t('title')}</div>
      <p className={css.hint}>{t('hint')}</p>
      {failed && <p className={css.hint} role="alert">{t('save.failed')}</p>}
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
                        onChange={(e) => { setEditText(e.target.value) }}
                      />
                      <span className={css.itemActions}>
                        <button type="button" className={css.linkButton} onClick={() => { commitEdit(item.id) }}>
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
          onChange={(e) => { setDraft(e.target.value) }}
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
