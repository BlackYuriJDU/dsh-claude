/**
 * The Artifacts modal: the files each turn of the current session produced
 * (the deliverables the mutation tools reported), grouped by turn, newest
 * first. Clicking a file opens it on the Host through the same opener the
 * chat's produced-file chips use. This is the Hand off surface: the artifacts
 * a delegated turn hands back.
 */
import { useMemo, useSyncExternalStore } from 'react'
import { Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { resolveWorkspacePath } from '@deepseek-ai/dsh-client-runtime/client'
import type { ISessions } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls ui-layout's SlotMap merge (the 'shell.overlay' seat).
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type { NS } from './locales.ts'
import css from './ArtifactsModal.module.css'

/** One turn's produced group. */
interface ProducedGroup {
  readonly turn: number
  readonly paths: readonly string[]
}

/** Trailing path segment (the chip label). */
function basename(path: string): string {
  const at = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
  return at === -1 ? path : path.slice(at + 1)
}

/** Injected business face: the sessions service (current-session resolution) and the Host file opener. */
export interface ArtifactsModalInjected {
  /** The sessions service (reads the current session's conversation snapshot). */
  sessions: ISessions
  /** Open a workspace-relative or absolute path on the Host. */
  openPath: (path: string) => void
}

/** Full component props: shell.overlay runtime share + locale seat + injected face. */
export type ArtifactsModalComponentProps =
  PropsRuntime<'shell.overlay'>
  & PropsLocale<typeof NS>
  & ArtifactsModalInjected

/**
 * Aggregate a conversation snapshot's produced files by turn, newest first.
 * @param turns - the chat timeline turns (TurnLocation map).
 * @returns produced groups (empty when nothing was produced).
 */
function aggregateProduced(
  turns: ReadonlyMap<number, { data: { get(key: string): unknown } }>,
): readonly ProducedGroup[] {
  const groups: ProducedGroup[] = []
  for (const [turn, location] of turns) {
    const data = location.data.get('deliverables') as { produced?: readonly { path: string }[] } | undefined
    const produced = data?.produced ?? []
    if (produced.length === 0) continue
    const paths: string[] = []
    const seen = new Set<string>()
    for (const item of produced) {
      if (seen.has(item.path)) continue
      seen.add(item.path)
      paths.push(item.path)
    }
    if (paths.length > 0) groups.push({ turn, paths })
  }
  return groups.sort((a, b) => b.turn - a.turn)
}

/**
 * Render the Artifacts modal body.
 * @param props - composed slot props (runtime + locale + injected sessions/opener).
 * @returns the modal element tree.
 */
export function ArtifactsModal({ sessions, openPath, t }: ArtifactsModalComponentProps) {
  // The current session's conversation snapshot, resolved live through the
  // sessions service (shell.overlay is root-scope, so there is no useSession
  // standard hook — the binding's getSnapshot is the read path).
  const current = useSyncExternalStore(
    (listener) => sessions.list.subscribe(listener),
    () => sessions.list.getSnapshot().current,
  )
  const binding = current === undefined ? undefined : sessions.binding(current)
  const snapshot = useSyncExternalStore(
    (listener) => binding === undefined ? () => {} : binding.session.subscribe(listener),
    () => binding?.session.getSnapshot(),
  )
  const groups = useMemo(
    () => (snapshot === undefined ? [] : aggregateProduced(snapshot.chat.timeline.turns)),
    [snapshot],
  )
  const cwd = snapshot === undefined ? undefined : sessions.list.getSnapshot().byId[snapshot.sessionId]?.cwd
  const open = (path: string): void => {
    openPath(resolveWorkspacePath(cwd, path))
  }
  return (
    <div className={css.body}>
      {groups.length === 0
        ? <p className={css.empty}>{t('artifacts.empty')}</p>
        : groups.map(group => (
          <div key={group.turn} className={css.group}>
            <div className={css.groupTitle}>{t('artifacts.turn', { turn: String(group.turn) })}</div>
            <ul className={css.fileList}>
              {group.paths.map(path => (
                <li key={path}>
                  <button
                    type="button"
                    className={css.file}
                    title={path}
                    aria-label={t('artifacts.open', { name: path })}
                    onClick={() => { open(path) }}
                  >
                    <span className={css.fileName}>{basename(path)}</span>
                    <span className={css.filePath}>{path}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  )
}

/**
 * The controlled modal wrapper: owns its open state and renders the
 * primitives Modal with the Artifacts body. Mounted by the shell.overlay
 * entry; opens on the sidebar's design event.
 */
export function ArtifactsModalHost(props: ArtifactsModalComponentProps & { open: boolean; onClose: () => void }) {
  const { open, onClose, t } = props
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeLabel={t('artifacts.close')}
      title={t('artifacts.title')}
    >
      <ArtifactsModal {...props} />
    </Modal>
  )
}
