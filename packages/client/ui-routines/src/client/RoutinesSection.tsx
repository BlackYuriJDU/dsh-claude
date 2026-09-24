/**
 * The Routines section: the user's scheduled routines as editable cards plus
 * an add form. Every change persists the whole `routines` array through the
 * durable `ui-routines` scope; the Host scheduler re-derives its timers from
 * the same section on every namespace update.
 */
import { useState, useSyncExternalStore } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { Routine, RoutineIntervalUnit, RoutinesSettings } from '../index.ts'
import css from './RoutinesSection.module.css'

/** Injected business face: the durable routines scope this section edits. */
export interface RoutinesSectionInjected {
  routines: SettingsScope<RoutinesSettings>
}

/** Full component props: section runtime share + locale seat + injected scope. */
export type RoutinesSectionComponentProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'routines'>
  & RoutinesSectionInjected

type Translate = RoutinesSectionComponentProps['t']

/** The "Every N <unit>" schedule label for one routine. */
function scheduleLabel(routine: Routine, t: Translate): string {
  return t(`every.${routine.unit}`).replace('{n}', String(routine.every))
}

/** A short relative/absolute label for the last-run timestamp. */
function lastRunLabel(routine: Routine, t: Translate): string {
  if (routine.lastRunAt === undefined) return t('neverRan')
  return t('lastRun').replace('{when}', new Date(routine.lastRunAt).toLocaleString())
}

/**
 * Render the Routines section content column.
 * @param props - composed slot props (runtime + locale seat + routines scope).
 * @returns the section element tree.
 */
export function RoutinesSection({ routines, t }: RoutinesSectionComponentProps) {
  const snapshot = useSyncExternalStore(routines.subscribe.bind(routines), routines.getSnapshot.bind(routines))
  const items = snapshot.value?.routines ?? []
  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [every, setEvery] = useState('1')
  const [unit, setUnit] = useState<RoutineIntervalUnit>('hours')
  const [cwd, setCwd] = useState('')

  const write = (next: readonly Routine[]): void => {
    void routines.set('routines', [...next])
  }

  const toggle = (id: string): void => {
    write(items.map(item => (item.id === id ? { ...item, enabled: !item.enabled } : item)))
  }

  const remove = (id: string): void => {
    write(items.filter(item => item.id !== id))
  }

  const add = (): void => {
    const trimmedName = name.trim()
    const trimmedPrompt = prompt.trim()
    const magnitude = Math.max(1, Math.floor(Number(every) || 1))
    if (trimmedName === '' || trimmedPrompt === '') return
    const entry: Routine = {
      id: crypto.randomUUID(),
      name: trimmedName,
      prompt: trimmedPrompt,
      every: magnitude,
      unit,
      ...(cwd.trim() === '' ? {} : { cwd: cwd.trim() }),
      enabled: true,
    }
    write([...items, entry])
    setName('')
    setPrompt('')
    setEvery('1')
    setCwd('')
  }

  return (
    <div className={css.section}>
      <div className={css.groupTitle}>{t('title')}</div>
      <p className={css.hint}>{t('hint')}</p>
      {items.length === 0
        ? <p className={css.empty}>{t('empty')}</p>
        : (
          <ul className={css.list}>
            {items.map(item => (
              <li key={item.id} className={css.card}>
                <div className={css.cardHead}>
                  <span className={css.cardName}>{item.name}</span>
                  <span className={css.cardActions}>
                    <label className={css.statusToggle}>
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={() => { toggle(item.id) }}
                      />
                      {item.enabled ? t('enabled') : t('paused')}
                    </label>
                    <button
                      type="button"
                      className={css.linkButton}
                      aria-label={t('delete')}
                      onClick={() => { remove(item.id) }}
                    >
                      {t('delete')}
                    </button>
                  </span>
                </div>
                <div className={css.cardSchedule}>{scheduleLabel(item, t)}</div>
                <div className={css.cardPrompt}>{item.prompt}</div>
                <div className={css.cardMeta}>{lastRunLabel(item, t)}</div>
              </li>
            ))}
          </ul>
        )}
      <div className={css.addForm}>
        <div className={css.addRow}>
          <input
            className={css.textField}
            value={name}
            placeholder={t('add.name.placeholder')}
            onChange={e => { setName(e.target.value) }}
          />
        </div>
        <textarea
          className={css.promptField}
          value={prompt}
          rows={3}
          placeholder={t('add.prompt.placeholder')}
          onChange={e => { setPrompt(e.target.value) }}
        />
        <div className={css.addRow}>
          <span className={css.cardSchedule}>{t('add.every')}</span>
          <input
            className={css.numberField}
            type="number"
            min={1}
            value={every}
            onChange={e => { setEvery(e.target.value) }}
          />
          <select
            className={css.selectField}
            value={unit}
            onChange={e => { setUnit(e.target.value as RoutineIntervalUnit) }}
          >
            <option value="minutes">{t('add.unit.minutes')}</option>
            <option value="hours">{t('add.unit.hours')}</option>
            <option value="days">{t('add.unit.days')}</option>
          </select>
        </div>
        <div className={css.addRow}>
          <input
            className={css.textField}
            value={cwd}
            placeholder={t('add.cwd.placeholder')}
            onChange={e => { setCwd(e.target.value) }}
          />
        </div>
        <button
          type="button"
          className={css.primaryButton}
          disabled={name.trim() === '' || prompt.trim() === ''}
          onClick={add}
        >
          {t('add')}
        </button>
      </div>
    </div>
  )
}
