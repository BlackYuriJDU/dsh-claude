/**
 * The Projects section: one card per workspace with its instructions and
 * knowledge-file paths. Every edit writes the `ui-projects` Config through its
 * config form; the Host half reads the same Config into the runtime context of
 * sessions that run in that workspace.
 */
import { useCallback, useRef, useState, useSyncExternalStore } from 'react'
import type { GlobalStandardProps, PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { WorkspaceView } from '@deepseek-ai/dsh-api-workspace-controller/client'
import { randomUUID } from '@deepseek-ai/dsh-util-crypto'
import type { ProjectEntry, ProjectsFormValue } from '../projects.ts'
import css from './ProjectsSection.module.css'

/** Injected business face: the projects Config form this section edits. */
export interface ProjectsSectionInjected {
  projects: ConfigForm<ProjectsFormValue>
}

/**
 * The props this section reads: the workspace hook, the locale seat, and the
 * injected form; the slot passes the rest of its runtime share besides.
 */
export type ProjectsSectionComponentProps =
  Pick<GlobalStandardProps, 'useWorkspaces'>
  & PropsLocale<'projects'>
  & ProjectsSectionInjected
  & {
    /** Hide the section title when the surrounding page already shows it. */
    hideTitle?: boolean
  }

/** A project entry's knowledge files; an entry without any has none. */
const filesOf = (entry: ProjectEntry | undefined): NonNullable<ProjectEntry['files']> => entry?.files ?? []

interface ProjectCardProps {
  workspace: Pick<WorkspaceView, 'path' | 'title'>
  entry: ProjectEntry | undefined
  /**
   * Queue one change to this workspace's entry.
   * @param update - derives the next entry from the latest queued one.
   * @returns whether the Host accepted the write.
   */
  onSave: (update: (entry: ProjectEntry | undefined) => ProjectEntry) => Promise<boolean>
  t: PropsLocale<'projects'>['t']
}

/**
 * One workspace's card: the instructions field, saved on blur, and the
 * knowledge-file list with a path field to add one.
 * @param props - the workspace, its stored entry, the write callback, and the copy.
 * @returns the card element tree.
 */
function ProjectCard({ workspace, entry, onSave, t }: ProjectCardProps) {
  // Only an edit in progress lives here; otherwise the field shows the stored value.
  const [draft, setDraft] = useState<string | undefined>()
  const [path, setPath] = useState('')
  const [notice, setNotice] = useState<'saved' | 'failed' | null>(null)
  const files = filesOf(entry)
  const stored = entry?.instructions ?? ''

  const save = (update: (current: ProjectEntry | undefined) => ProjectEntry): Promise<boolean> => {
    setNotice(null)
    return onSave(update).then((accepted) => {
      if (!accepted) setNotice('failed')
      return accepted
    })
  }

  // A refused write keeps the draft in the field; an accepted one hands the
  // field back to the stored value unless the person typed again meanwhile.
  const commitInstructions = (): void => {
    if (draft === undefined) return
    const next = draft.trim()
    if (next === stored) {
      setDraft(undefined)
      return
    }
    void save(current => ({ ...current, instructions: next })).then((accepted) => {
      if (!accepted) return
      setDraft(current => (current === draft ? undefined : current))
      setNotice('saved')
    })
  }

  // The add button is disabled while the trimmed path is empty.
  const addFile = (): void => {
    const added = { id: randomUUID(), path: path.trim() }
    void save(current => ({ ...current, files: [...filesOf(current), added] }))
    setPath('')
  }

  const removeFile = (id: string): void => {
    void save(current => ({ ...current, files: filesOf(current).filter(file => file.id !== id) }))
  }

  return (
    <li className={css.project}>
      <div className={css.projectHeader}>
        <span className={css.projectTitle}>{workspace.title}</span>
        <span className={css.projectPath}>{workspace.path}</span>
      </div>
      <span className={css.fieldLabel}>{t('instructions')}</span>
      <textarea
        className={css.textarea}
        value={draft ?? stored}
        rows={3}
        aria-label={t('instructions')}
        placeholder={t('instructions.placeholder')}
        onChange={(e) => { setDraft(e.target.value); setNotice(null) }}
        onBlur={commitInstructions}
      />
      {notice === 'saved' && <span className={css.savedFlag}>{t('saved')}</span>}
      {notice === 'failed' && <span className={css.savedFlag} role="alert">{t('save.failed')}</span>}
      <span className={css.fieldLabel}>{t('knowledge')}</span>
      <p className={css.hint}>{t('knowledge.hint')}</p>
      {files.length === 0
        ? <p className={css.empty}>{t('knowledge.empty')}</p>
        : (
          <ul className={css.fileList}>
            {files.map(file => (
              <li key={file.id} className={css.fileRow}>
                <span className={css.fileName}>{file.path}</span>
                <span className={css.rowActions}>
                  <button type="button" className={css.linkButton} onClick={() => { removeFile(file.id) }}>
                    {t('knowledge.remove')}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      <div className={css.addFileRow}>
        <input
          className={css.pathInput}
          value={path}
          aria-label={t('knowledge')}
          placeholder={t('knowledge.placeholder')}
          onChange={(e) => { setPath(e.target.value) }}
        />
        <button type="button" className={css.primaryButton} disabled={path.trim() === ''} onClick={addFile}>
          {t('knowledge.add')}
        </button>
      </div>
    </li>
  )
}

/**
 * Render the Projects section content column.
 * @param props - the workspace hook, the locale seat, and the projects form.
 * @returns the section element tree.
 */
export function ProjectsSection({ projects, useWorkspaces, t, hideTitle = false }: ProjectsSectionComponentProps) {
  const subscribe = useCallback((listener: () => void) => projects.subscribe(listener), [projects])
  const map = useSyncExternalStore(subscribe, () => projects.getSnapshot().value?.projects) ?? {}
  const workspaces = useWorkspaces(state => state.items)
  // Every write replaces the whole map, and the snapshot changes only once the
  // Host answers, so edits made meanwhile build on the last queued map.
  const pending = useRef<{ map: ProjectsFormValue['projects']; writes: number }>({ map: {}, writes: 0 })
  const save = (workspaceId: string, update: (entry: ProjectEntry | undefined) => ProjectEntry): Promise<boolean> => {
    const base = pending.current.writes > 0 ? pending.current.map : map
    const next = { ...base, [workspaceId]: update(base[workspaceId]) }
    pending.current = { map: next, writes: pending.current.writes + 1 }
    const settle = (accepted: boolean): boolean => {
      pending.current.writes--
      return accepted
    }
    return projects.set('projects', next).then(settle, () => settle(false))
  }

  return (
    <div className={css.section}>
      {!hideTitle && <div className={css.groupTitle}>{t('title')}</div>}
      <p className={css.hint}>{t('hint')}</p>
      {workspaces.length === 0
        ? <p className={css.empty}>{t('empty')}</p>
        : (
          <ul className={css.projectList}>
            {workspaces.map(workspace => (
              <ProjectCard
                key={workspace.workspaceId}
                workspace={workspace}
                entry={map[workspace.workspaceId]}
                onSave={update => save(workspace.workspaceId, update)}
                t={t}
              />
            ))}
          </ul>
        )}
    </div>
  )
}
