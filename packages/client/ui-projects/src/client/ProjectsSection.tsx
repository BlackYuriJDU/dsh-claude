/**
 * The Projects section: one card per project (workspace) carrying its own
 * instructions textarea and knowledge-file list. Every edit persists through
 * the durable `ui-projects` scope; the node half projects the same content
 * into the system prompt of every session in that project.
 */
import { useState, useSyncExternalStore } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsScope, WorkspaceId } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { ProjectEntry, ProjectKnowledgeFile } from '../index.ts'
import css from './ProjectsSection.module.css'

/** The durable projects section fields this block owns. */
export interface ProjectsScopeSection {
  projects?: Record<string, ProjectEntry>
}

/** Injected business face: the durable projects scope plus the workspace write actions. */
export interface ProjectsSectionInjected {
  projects: SettingsScope<ProjectsScopeSection>
  /** Open the Host's native directory picker; null = cancelled. */
  pickFile: () => Promise<string | null>
}

/** Full component props: section runtime share + locale seat + injected scope. */
export type ProjectsSectionComponentProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'projects'>
  & ProjectsSectionInjected

/** Basename of a host path (both separators accepted). */
function basenameOf(path: string): string {
  return path.replace(/[/\\]+$/, '').split(/[/\\]/).pop() ?? path
}

/**
 * One project's card: instructions textarea plus its knowledge files.
 * @param props - the workspace id/title/path, its durable entry, and the write callbacks.
 * @returns the project card element tree.
 */
function ProjectCard(props: {
  title: string
  path: string
  entry: ProjectEntry | undefined
  onSave: (entry: ProjectEntry) => void
  onAttach: () => Promise<{ name: string; path: string } | null>
  t: PropsLocale<'projects'>['t']
}) {
  const { title, path, entry, onSave, onAttach, t } = props
  const [instructions, setInstructions] = useState(entry?.instructions ?? '')
  const [saved, setSaved] = useState(false)
  const files = entry?.files ?? []

  const commitInstructions = (): void => {
    const trimmed = instructions.trim()
    if (trimmed === (entry?.instructions ?? '')) return
    onSave({ ...entry, instructions: trimmed })
    setSaved(true)
    window.setTimeout(() => { setSaved(false) }, 1500)
  }

  const attach = (): void => {
    void onAttach().then((file) => {
      if (file === null) return
      const next: ProjectKnowledgeFile = { id: crypto.randomUUID(), name: file.name, path: file.path }
      onSave({ ...entry, files: [...files, next] })
    })
  }

  const removeFile = (id: string): void => {
    onSave({ ...entry, files: files.filter(file => file.id !== id) })
  }

  return (
    <li className={css.project}>
      <div className={css.projectHeader}>
        <span className={css.projectTitle}>{title}</span>
        <span className={css.projectPath}>{path}</span>
      </div>
      <span className={css.fieldLabel}>{t('instructions')}</span>
      <textarea
        className={css.textarea}
        value={instructions}
        rows={3}
        placeholder={t('instructions.hint')}
        onChange={e => { setInstructions(e.target.value) }}
        onBlur={commitInstructions}
      />
      <span className={css.fieldLabel}>{t('knowledge')}</span>
      {files.length === 0
        ? <p className={css.empty}>{t('knowledge.empty')}</p>
        : (
          <ul className={css.fileList}>
            {files.map(file => (
              <li key={file.id} className={css.fileRow}>
                <span className={css.fileName}>{file.name}</span>
                <span className={css.rowActions}>
                  <button
                    type="button"
                    className={css.linkButton}
                    aria-label={t('knowledge.remove')}
                    onClick={() => { removeFile(file.id) }}
                  >
                    {t('knowledge.remove')}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      <div className={css.rowActions}>
        <button type="button" className={css.primaryButton} onClick={attach}>
          {t('knowledge.add')}
        </button>
        {saved && <span className={css.savedFlag}>{t('saved')}</span>}
      </div>
    </li>
  )
}

/**
 * Render the Projects section content column.
 * @param props - composed slot props (runtime + locale seat + projects scope).
 * @returns the section element tree.
 */
export function ProjectsSection({ projects, pickFile, useWorkspaces, t }: ProjectsSectionComponentProps) {
  const snapshot = useSyncExternalStore(projects.subscribe.bind(projects), projects.getSnapshot.bind(projects))
  const workspaces = useWorkspaces(state => state.items)
  const map = snapshot.value?.projects ?? {}

  const write = (workspaceId: WorkspaceId, entry: ProjectEntry): void => {
    void projects.set('projects', { ...map, [workspaceId]: entry })
  }

  const attach = async (): Promise<{ name: string; path: string } | null> => {
    const path = await pickFile()
    return path === null ? null : { name: basenameOf(path), path }
  }

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
                title={workspace.title}
                path={workspace.path}
                entry={map[workspace.workspaceId]}
                onSave={(entry) => { write(workspace.workspaceId, entry) }}
                onAttach={attach}
                t={t}
              />
            ))}
          </ul>
        )}
    </div>
  )
}
