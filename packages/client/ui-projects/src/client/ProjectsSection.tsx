/**
 * The Projects section: one card per workspace with its instructions and
 * knowledge-file paths. Every edit writes the `ui-projects` Config through its
 * config form; the Host half reads the same Config into the runtime context of
 * sessions that run in that workspace.
 */
import { useState, useSyncExternalStore } from 'react'
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

interface ProjectCardProps {
  workspace: Pick<WorkspaceView, 'path' | 'title'>
  entry: ProjectEntry | undefined
  onSave: (entry: ProjectEntry) => void
  t: PropsLocale<'projects'>['t']
}

/**
 * One workspace's card: the instructions field, saved on blur, and the
 * knowledge-file list with a path field to add one.
 * @param props - the workspace, its stored entry, the write callback, and the copy.
 * @returns the card element tree.
 */
function ProjectCard({ workspace, entry, onSave, t }: ProjectCardProps) {
  const [instructions, setInstructions] = useState(entry?.instructions ?? '')
  const [path, setPath] = useState('')
  const [saved, setSaved] = useState(false)
  const files = entry?.files ?? []

  const commitInstructions = (): void => {
    const next = instructions.trim()
    if (next === (entry?.instructions ?? '')) return
    onSave({ ...entry, instructions: next })
    setSaved(true)
  }

  // The add button is disabled while the trimmed path is empty.
  const addFile = (): void => {
    onSave({ ...entry, files: [...files, { id: randomUUID(), path: path.trim() }] })
    setPath('')
  }

  const removeFile = (id: string): void => {
    onSave({ ...entry, files: files.filter(file => file.id !== id) })
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
        value={instructions}
        rows={3}
        aria-label={t('instructions')}
        placeholder={t('instructions.placeholder')}
        onChange={(e) => { setInstructions(e.target.value); setSaved(false) }}
        onBlur={commitInstructions}
      />
      {saved && <span className={css.savedFlag}>{t('saved')}</span>}
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
export function ProjectsSection({ projects, useWorkspaces, t }: ProjectsSectionComponentProps) {
  const snapshot = useSyncExternalStore(projects.subscribe.bind(projects), projects.getSnapshot.bind(projects))
  const workspaces = useWorkspaces(state => state.items)
  const map = snapshot.value?.projects ?? {}

  return (
    <div className={css.section}>
      <div className={css.groupTitle}>{t('title')}</div>
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
                onSave={(entry) => { void projects.set('projects', { ...map, [workspace.workspaceId]: entry }) }}
                t={t}
              />
            ))}
          </ul>
        )}
    </div>
  )
}
