/**
 * Two-column shell frame, registered into the built-in 'root' slot (the web
 * shell renders only 'root'). Owns the grid tracks (sidebar | center), the
 * drag handle (pointer capture + rAF throttle), the column solve
 * (columns.ts), and the child-slot render decisions: the sidebar slot
 * renders HERE with live parameters from the column solve, and the
 * session-aware occupant renders in a fixed column position; session-maybe
 * entries retain identity. Pure component: everything arrives
 * through the three framework shares — zero cordis or framework imports,
 * zero self-made hooks.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { PropsRenderSlots, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import { computeColumns, SIDEBAR_AUTO_COLLAPSE, SIDEBAR_DEFAULT } from './columns.ts'
import type { createLayoutStore } from './stores.ts'
import css from './AppFrame.module.css'

/** Full composed props: runtime share + child-slot render share + store share. */
export type AppFrameProps =
  & PropsRuntime<'root'>
  & PropsRenderSlots<'sidebar' | 'conversation' | 'shell.overlay'>
  & PropsStore<ReturnType<typeof createLayoutStore>>

/** Center column grid item (session-body building block). */
function CenterColumn(props: { children?: ReactNode }) {
  return <div className={css.centerCol}>{props.children}</div>
}

/**
 * One drag handle: pointer capture, rAF-throttled dx reports against the drag-start origin.
 * `side` keys the hover-reveal CSS to the owning column.
 */
function DragHandle(props: { side: 'sidebar'; left: number; onStart: () => void; onDrag: (dx: number) => void; onEnd: () => void }) {
  const [dragging, setDragging] = useState(false)
  const origin = useRef(0)
  const latest = useRef(0)
  const frame = useRef<number | null>(null)
  const callbacks = useRef({ onStart: props.onStart, onDrag: props.onDrag, onEnd: props.onEnd })
  callbacks.current = { onStart: props.onStart, onDrag: props.onDrag, onEnd: props.onEnd }

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    origin.current = e.clientX
    latest.current = e.clientX
    callbacks.current.onStart()
    setDragging(true)
  }, [])
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    latest.current = e.clientX
    frame.current ??= requestAnimationFrame(() => {
      frame.current = null
      callbacks.current.onDrag(latest.current - origin.current)
    })
  }, [])
  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (frame.current !== null) { cancelAnimationFrame(frame.current); frame.current = null }
    callbacks.current.onDrag(latest.current - origin.current)
    setDragging(false)
    callbacks.current.onEnd()
  }, [])

  return (
    <div
      className={css.handle}
      style={{ left: props.left }}
      data-side={props.side}
      data-dragging={dragging || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  )
}

/** The two-column frame (see module doc). */
export function AppFrame({
  useStore,
  actions,
  renderSlot,
}: AppFrameProps) {
  const panels = useStore(s => s)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const [viewport, setViewport] = useState(() => window.innerWidth)

  // Track the frame's own box (not the window): rAF-throttled ResizeObserver.
  useEffect(() => {
    const el = frameRef.current
    /* v8 ignore next -- the ref is always attached by effect time: the frame div renders unconditionally. */
    if (el === null) return
    let raf: number | null = null
    const observer = new ResizeObserver(() => {
      raf ??= requestAnimationFrame(() => {
        raf = null
        const width = el.getBoundingClientRect().width
        if (width > 0) setViewport(width)
      })
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [])

  // Narrow navigation overlays the conversation without changing its grid
  // width. The desktop preference survives the temporary drawer.
  const narrow = viewport < SIDEBAR_AUTO_COLLAPSE
  useEffect(() => { actions.setNarrow(narrow) }, [actions, narrow])
  // A zero sidebar preference is the solver's closed-rail sentinel.
  const sidebarCollapsed = narrow ? !panels.narrowExpanded : panels.sidebar === 0
  const drawerOpen = narrow && !sidebarCollapsed
  const sidebarRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!drawerOpen) return
    const panel = sidebarRef.current!
    panel.focus()
    return () => {
      // The expanded control can disappear when the rail returns. Keep focus
      // on the same navigation region rather than losing it to document.body.
      if (document.activeElement === document.body || panel.contains(document.activeElement)) panel.focus()
    }
  }, [drawerOpen])
  const cols = computeColumns(viewport, narrow ? 0 : panels.sidebar)
  const colsRef = useRef(cols)
  colsRef.current = cols

  // The drag base is the rendered width captured at drag start (grabbing a
  // clamped panel must not jump back to the stored preference);
  // it stays frozen for the whole gesture so dx deltas do not compound.
  const sidebarBase = useRef(0)
  // Track-level transitions pause for the whole gesture: eased tracks would
  // detach the column edge from the pointer (AppFrame.module.css).
  const [dragging, setDragging] = useState(false)
  const onDragEnd = useCallback(() => { setDragging(false) }, [])
  const onSidebarStart = useCallback(() => { sidebarBase.current = colsRef.current.sidebar; setDragging(true) }, [])
  const onSidebarDrag = useCallback((dx: number) => {
    actions.setSidebar(sidebarBase.current + dx)
  }, [actions])

  return (
    <div
      ref={frameRef}
      className={css.frame}
      style={{ gridTemplateColumns: `${cols.sidebar}px minmax(0, 1fr)` }}
      data-sidebar-collapsed={sidebarCollapsed || undefined}
      data-dragging={dragging || undefined}
    >
      <div
        ref={sidebarRef}
        className={css.sidebarCol}
        data-drawer-open={drawerOpen || undefined}
        style={drawerOpen ? { width: SIDEBAR_DEFAULT } : undefined}
        role="complementary"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (drawerOpen && event.key === 'Escape' && !event.defaultPrevented
            && event.target instanceof Element && !event.target.closest('[role="dialog"]')) {
            event.stopPropagation()
            actions.toggleSidebar()
          }
        }}
      >
        {/* One stable slot position preserves workspace drafts and listeners
            when navigation switches between desktop, rail, and drawer. */}
        {renderSlot('sidebar', {
          collapsed: sidebarCollapsed,
          width: drawerOpen ? SIDEBAR_DEFAULT : cols.sidebar,
        })}
      </div>
      {/* The column occupant stays at a fixed tree position from first
          paint — no loading gate: a bare status line reads worse than
          the shell's own pending rendering. The conversation
          is session-maybe and owns both the no-session and live states. */}
      <CenterColumn>{renderSlot('conversation', {})}</CenterColumn>
      {/* Navigation is non-modal: keyboard users may still reach the
          conversation. Dialogs contributed by plugins sit above the drawer. */}
      {drawerOpen && <div className={css.drawerScrim} aria-hidden="true" onClick={() => { actions.toggleSidebar() }} />}
      <div className={css.overlayLayer} data-shell-overlay>
        {renderSlot('shell.overlay', {})}
      </div>
      {/* The collapsed rail is fixed-width: no resize handle while closed;
          narrow viewports render the drawer instead of a sidebar track. */}
      {!sidebarCollapsed && !narrow && <DragHandle side="sidebar" left={cols.sidebar} onStart={onSidebarStart} onDrag={onSidebarDrag} onEnd={onDragEnd} />}
    </div>
  )
}
