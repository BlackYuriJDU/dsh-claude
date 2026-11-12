/** Strict per-session header/body content inserted into the resident conversation layout. */

import { useEffect, useSyncExternalStore } from 'react'
import clsx from 'clsx'
import type {
  ConversationSessionHeaderSlotProps, ConversationSessionSlotProps,
} from '../contract/slots.ts'
import type { ViewTab } from '../contract/views.ts'
import css from './ConversationRoot.module.css'

/** Full props composed from the strict session body contract. */
export type ConversationSessionProps = ConversationSessionSlotProps

/** Full props composed from the strict session header contract. */
export type ConversationSessionHeaderProps = ConversationSessionHeaderSlotProps

const DEFAULT_VIEW_ID = 'chat'

/** Resolve by id and keep stale persisted selections on the stable Chat fallback. */
function resolveActiveView(tabs: readonly ViewTab[], selectedId: string | null): ViewTab | undefined {
  const requestedId = selectedId ?? DEFAULT_VIEW_ID
  return tabs.find(view => view.id === requestedId)
    ?? tabs.find(view => view.id === DEFAULT_VIEW_ID)
}

/** Header action entry id of the ui-jobs background-jobs list (the one action kept on Chat). */
const BACKGROUND_JOBS_ACTION = 'job-list'

/**
 * Renders the session header chrome above the resident conversation scrollport.
 * dshc hides the chrome while the Chat view is active (the conversation starts
 * straight at the transcript); any other active view, such as the Trajectory
 * view a tool row's inspect control opens, shows the view tabs so the user can
 * return to Chat.
 * @returns on Chat, the hidden header plus the floating background-jobs action;
 * otherwise the view tabs.
 */
export function ConversationSessionHeader({
  sessionId, useSession, useSessions, useStore, actions,
  renderSlot, views, open, t,
}: ConversationSessionHeaderProps) {
  // dshc: session log, PTC chip, and breadcrumbs stay removed. On Chat the
  // header collapses to the background-jobs action, which renders only while
  // the session has background work (Claude Code lists its background tasks
  // the same way); the view tabs return outside the Chat view.
  void sessionId; void useSession; void useSessions; void open; void t
  useSyncExternalStore(views.subscribe, views.version)
  const tabs = views.list()
  const active = resolveActiveView(tabs, useStore(s => s.view))
  if (active === undefined || active.id === DEFAULT_VIEW_ID || tabs.length < 2) {
    return (
      <>
        <header className={clsx(css.header, css.headerHidden)} aria-hidden />
        <div className={css.chatActions}>
          <div className={css.chatActionsInner}>
            {renderSlot('conversation.session.header.actions', {}, { only: BACKGROUND_JOBS_ACTION })}
          </div>
        </div>
      </>
    )
  }
  return (
    <header className={css.header}>
      <div className={css.tabs} role="tablist">
        {tabs.map(viewTab => (
          <button
            key={viewTab.id}
            type="button"
            role="tab"
            aria-selected={viewTab.id === active.id}
            className={clsx(css.tab, viewTab.id === active.id && css.tabActive)}
            onClick={() => { actions.setView(viewTab.id) }}
          >
            {viewTab.label}
          </button>
        ))}
      </div>
    </header>
  )
}

/**
 * Renders the active Session view inside the resident scrollport and keeps
 * the input draft mirrored while blank Hero chrome is visible.
 * @param props - Strict Session input/store, view ledger, and render shares.
 * @returns the active view area, or null while the Session remains blank.
 */
export function ConversationSession({
  sessionId, useSession, useInput, inputActions, useStore, actions,
  renderSlot, views, bindDraftMirror, releaseSessionImages,
}: ConversationSessionProps) {
  useSyncExternalStore(views.subscribe, views.version)
  const tabs = views.list()
  const selectedId = useStore(s => s.view)
  const active = resolveActiveView(tabs, selectedId)
  const composerPhase = useSession(s => s.composerPhase)
  const blank = useSession(s => s.blank)
  const inputState = useInput(s => s)
  const storedDraft = useStore(s => s.draft)
  // `?? null`: persisted snapshots from before the inspect field rehydrate without it.
  const inspect = useStore(s => s.inspect ?? null)

  useEffect(() => {
    if (inputState.draft === '' && storedDraft !== '') inputActions.setDraft(storedDraft)
    const unmirror = bindDraftMirror(actions.setDraft)
    return () => { unmirror() }
    // Mount-only (deps pinned to inputActions): later store writes come from
    // the machine mirror, not this seed effect.
  }, [inputActions])

  useEffect(() => () => {
    releaseSessionImages(sessionId)
  }, [releaseSessionImages, sessionId])

  if (blank && composerPhase === 'blank') return null
  return (
    <div className={css.viewArea}>
      {active !== undefined && renderSlot('conversation.view', {
        inspect,
        onInspectDone: () => { actions.setInspect(null) },
      }, { only: active.id })}
    </div>
  )
}
