// @vitest-environment jsdom
/**
 * AppFrame interaction spec under the four-share props form: real layout
 * store instance (createLayoutStore().create() — the test-sanctioned engine
 * path), a recording renderSlot stub, and a render-prop SessionProvider stub
 * (the real one is framework-wired to the renderer host; its own behavior is
 * ui-renderer's spec territory). Drag sequences (pointer capture + rAF flush)
 * and the narrow-viewport drawer are the preserved behavior assertions.
 * jsdom has no layout engine, so the frame width comes from a mocked
 * getBoundingClientRect and resizes are driven through the ResizeObserver
 * stub.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { useSyncExternalStore } from 'react'
import { AppFrame } from '@deepseek-ai/dsh-client-ui-layout/src/client/AppFrame.tsx'
import type { AppFrameProps } from '@deepseek-ai/dsh-client-ui-layout/src/client/AppFrame.tsx'
import { SIDEBAR_COLLAPSED, SIDEBAR_DEFAULT } from '@deepseek-ai/dsh-client-ui-layout/src/client/columns.ts'
import { createLayoutStore } from '@deepseek-ai/dsh-client-ui-layout/src/client/stores.ts'
import type {
  SessionId, SessionListState, WorkspaceListState,
} from '@deepseek-ai/dsh-client-runtime/client'

// Session selection controls for the SessionProvider and useSessions stubs.
const selectedSession = { current: 's-test' as SessionId | undefined }
const selectedSessionBlank = { current: false }
const baselinesReady = { current: true }

// Render-prop contract stub fed through the standard seat prop (the renderer
// injects the real one in production): session mode runs children(id), empty
// mode runs the empty branch — the frame must work against exactly this
// shape. Typed as the seat's own component type so the branded sessionId
// parameter stays contract-checked.
const SessionProviderStub: AppFrameProps['SessionProvider'] = ({ children, empty }) =>
  selectedSession.current === undefined ? <>{empty?.() ?? null}</> : <>{children(selectedSession.current)}</>


/** Observer stub: captures the callback so tests can fire resizes manually. */
let fireResize: (() => void) | null = null
class ResizeObserverStub {
  #cb: ResizeObserverCallback
  constructor(cb: ResizeObserverCallback) { this.#cb = cb }
  observe(): void { fireResize = () => { this.#cb([], this) } }
  unobserve(): void {}
  disconnect(): void { fireResize = null }
}

let frameWidth = 1920

/** Test-local selector hook over a framework-neutral store instance. */
function hookOf<T>(inst: { subscribe: (fn: () => void) => () => void; getSnapshot: () => T }) {
  return function useSelector<S>(sel: (s: T) => S): S { return sel(useSyncExternalStore(inst.subscribe, inst.getSnapshot)) }
}

function mountFrame() {
  window.innerWidth = frameWidth // first-render viewport source before the observer fires
  const instance = createLayoutStore().create()
  const slotCalls: { key: string; props: unknown }[] = []
  const renderSlot = ((key: string, owner: object) => {
    slotCalls.push({ key, props: owner })
    if (key === 'sidebar') return <div data-testid="sidebar-content" />
    if (key === 'conversation') return <div data-testid="center-content" />
    if (key === 'conversation.empty') return <div data-testid="empty-content" />
    return <div data-testid="other-content" />
  }) as AppFrameProps['renderSlot']
  const useSessions = ((sel: (s: SessionListState) => unknown) => {
    const current = selectedSession.current
    const sessionState = {
      ids: current === undefined ? [] : [current],
      byId: current === undefined
        ? {}
        : { [current]: { id: current, displayTitle: 'Test', running: false, blank: selectedSessionBlank.current, updatedAt: 1 } },
      current,
      phase: 'ready',
    } as SessionListState
    return sel(sessionState)
  }) as never
  const workspaceState: WorkspaceListState = {
    items: [], archivedSessionIds: [], state: 'idle', phase: 'ready', error: null,
    baselinesReady: baselinesReady.current, recentWorkspaceId: undefined,
  }
  const element = () => (
    <AppFrame
      useStore={hookOf(instance)}
      actions={instance.actions}
      renderSlot={renderSlot}
      useSessions={useSessions}
      useWorkspaces={((sel: (s: WorkspaceListState) => unknown) => sel(workspaceState)) as never}
      SessionProvider={SessionProviderStub}
    />
  )
  const utils = render(element())
  const frame = utils.container.firstElementChild as HTMLElement
  return { instance, frame, slotCalls, rerenderFrame: () => { utils.rerender(element()) }, ...utils }
}

function tracks(frame: HTMLElement): number[] {
  const m = /^(\d+)px minmax\(0, 1fr\)$/.exec(frame.style.gridTemplateColumns)
  if (m === null) throw new Error(`unexpected template: ${frame.style.gridTemplateColumns}`)
  return [Number(m[1])]
}

function drag(handle: Element, fromX: number, toX: number): void {
  const down = new PointerEvent('pointerdown', { pointerId: 1, clientX: fromX, bubbles: true })
  const move = new PointerEvent('pointermove', { pointerId: 1, clientX: toX, bubbles: true })
  const up = new PointerEvent('pointerup', { pointerId: 1, clientX: toX, bubbles: true })
  act(() => { handle.dispatchEvent(down) })
  act(() => { handle.dispatchEvent(move); vi.advanceTimersByTime(20) })
  act(() => { handle.dispatchEvent(up) })
}

beforeEach(() => {
  frameWidth = 1920
  selectedSession.current = 's-test' as SessionId
  selectedSessionBlank.current = false
  baselinesReady.current = true
  vi.useFakeTimers()
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => { cb(0) }, 16) as unknown as number)
  vi.stubGlobal('cancelAnimationFrame', (h: number) => { clearTimeout(h) })
  window.innerWidth = frameWidth
  Element.prototype.getBoundingClientRect = function () {
    return { width: frameWidth, height: 1080, top: 0, left: 0, right: frameWidth, bottom: 1080, x: 0, y: 0, toJSON: () => ({}) }
  }
  // jsdom lacks pointer capture: emulate per-element so hasPointerCapture gates pass.
  const captured = new WeakSet<Element>()
  Element.prototype.setPointerCapture = function () { captured.add(this) }
  Element.prototype.releasePointerCapture = function () { captured.delete(this) }
  Element.prototype.hasPointerCapture = function () { return captured.has(this) }
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('AppFrame', () => {
  it('renders two tracks from store state', () => {
    const { frame } = mountFrame()
    expect(tracks(frame)).toEqual([SIDEBAR_DEFAULT])
  })

  it('renders the conversation with an empty owner share (sessionId is framework-standard)', () => {
    const { slotCalls, getByTestId } = mountFrame()
    expect(getByTestId('center-content')).toBeTruthy()
    const keys = slotCalls.map(c => c.key)
    expect(keys).toContain('conversation')
    expect(keys).not.toContain('details')
    expect(keys).not.toContain('conversation.empty')
    expect(slotCalls.find(c => c.key === 'conversation')!.props).toEqual({})
  })

  it('keeps the conversation slot mounted while no session is current', () => {
    // No current session: the session-maybe conversation shell owns the New
    // Session view itself — the center column renders it unconditionally.
    selectedSession.current = undefined
    const { slotCalls, getByTestId } = mountFrame()
    expect(getByTestId('center-content')).toBeTruthy()
    expect(slotCalls.map(c => c.key)).toContain('conversation')
  })

  it('renders the column occupant before baselines settle (no loading gate)', () => {
    // No loading gate: a bare loading status reads worse than the shell's own
    // pending rendering — the occupant mounts from first paint.
    baselinesReady.current = false
    const { slotCalls } = mountFrame()
    expect(slotCalls.map(c => c.key)).toContain('conversation')
  })

  it('sidebar slot receives live solve output as owner props', () => {
    const { slotCalls } = mountFrame()
    expect(slotCalls.find(c => c.key === 'sidebar')!.props).toEqual({ collapsed: false, width: SIDEBAR_DEFAULT })
  })

  it('sidebar drag widens through rAF-batched pointer moves', () => {
    const { frame } = mountFrame()
    const handles = frame.querySelectorAll('[class*="handle"]')
    drag(handles[0]!, SIDEBAR_DEFAULT, 350)
    expect(tracks(frame)[0]).toBe(350)
  })

  it('closed sidebar keeps its compact rail with mounted slot content and collapsed owner props', () => {
    const { frame, instance, slotCalls, getByTestId } = mountFrame()
    act(() => { instance.actions.toggleSidebar() })
    expect(tracks(frame)).toEqual([SIDEBAR_COLLAPSED])
    expect(getByTestId('sidebar-content')).toBeTruthy()
    expect(frame.hasAttribute('data-sidebar-collapsed')).toBe(true)
    const lastSidebarCall = slotCalls.filter(c => c.key === 'sidebar').at(-1)!
    expect(lastSidebarCall.props).toEqual({ collapsed: true, width: SIDEBAR_COLLAPSED })
  })

  it('the drag handle disappears for a collapsed sidebar', () => {
    const { frame, instance } = mountFrame()
    expect(frame.querySelectorAll('[class*="handle"]')).toHaveLength(1)
    act(() => { instance.actions.toggleSidebar() })
    expect(frame.querySelectorAll('[class*="handle"]')).toHaveLength(0)
  })
})

describe('AppFrame — narrow-viewport auto-collapse', () => {
  it('narrow re-expand overlays the conversation: the grid keeps the rail width', () => {
    frameWidth = 900
    const { frame, instance, getByTestId, getAllByTestId, slotCalls, getByRole } = mountFrame()
    const sidebar = getByTestId('sidebar-content')
    expect(tracks(frame)).toEqual([SIDEBAR_COLLAPSED])
    act(() => { instance.actions.toggleSidebar() })
    expect(tracks(frame)).toEqual([SIDEBAR_COLLAPSED])
    expect(getAllByTestId('sidebar-content')).toEqual([sidebar])
    expect(slotCalls.filter(c => c.key === 'sidebar').at(-1)!.props).toEqual({ collapsed: false, width: SIDEBAR_DEFAULT })
    expect(document.activeElement).toBe(getByRole('complementary'))
    expect(frame.querySelectorAll('[class*="handle"]')).toHaveLength(0)
    fireEvent.keyDown(getByRole('complementary'), { key: 'Escape' })
    expect(frame.querySelector('[data-drawer-open]')).toBeNull()
    expect(getByTestId('sidebar-content')).toBe(sidebar)
    expect(document.activeElement).toBe(getByRole('complementary'))
    act(() => { instance.actions.toggleSidebar() })
    fireEvent.click(frame.querySelector('[class*="drawerScrim"]')!)
    expect(frame.querySelector('[data-drawer-open]')).toBeNull()
  })

  it('mounts collapsed below the breakpoint with no sidebar handle', () => {
    frameWidth = 980
    const { frame, slotCalls } = mountFrame()
    expect(tracks(frame)).toEqual([SIDEBAR_COLLAPSED])
    expect(frame.hasAttribute('data-sidebar-collapsed')).toBe(true)
    expect(slotCalls.filter(c => c.key === 'sidebar').at(-1)!.props).toEqual({ collapsed: true, width: SIDEBAR_COLLAPSED })
    expect(frame.querySelectorAll('[class*="handle"]')).toHaveLength(0)
  })

  it('narrow toggle re-expands the drawer without resizing the conversation grid', () => {
    frameWidth = 980
    const { frame, instance } = mountFrame()
    act(() => { instance.actions.toggleSidebar() })
    expect(tracks(frame)).toEqual([SIDEBAR_COLLAPSED])
    expect(frame.hasAttribute('data-sidebar-collapsed')).toBe(false)
    expect(frame.querySelector('[data-drawer-open]')).toBeTruthy()
    expect(frame.querySelectorAll('[class*="handle"]')).toHaveLength(0)
    act(() => { instance.actions.toggleSidebar() })
    expect(tracks(frame)).toEqual([SIDEBAR_COLLAPSED])
  })

  it('a wide-closed preference re-expands the drawer while narrow, preference untouched', () => {
    frameWidth = 1920
    const { frame, instance } = mountFrame()
    act(() => { instance.actions.toggleSidebar() }) // close while wide: preference 0
    frameWidth = 980
    act(() => { fireResize?.(); vi.advanceTimersByTime(20) })
    act(() => { instance.actions.toggleSidebar() })
    expect(tracks(frame)).toEqual([SIDEBAR_COLLAPSED])
    expect(frame.querySelector('[data-drawer-open]')).toBeTruthy()
    expect(instance.getSnapshot().sidebar).toBe(0) // preference untouched
  })

  it('shrinking across the breakpoint auto-collapses; re-widening restores the drag width', () => {
    const { frame, instance } = mountFrame()
    act(() => { instance.actions.setSidebar(400) })
    frameWidth = 980
    act(() => { fireResize?.(); vi.advanceTimersByTime(20) })
    expect(tracks(frame)).toEqual([SIDEBAR_COLLAPSED])
    frameWidth = 1920
    act(() => { fireResize?.(); vi.advanceTimersByTime(20) })
    expect(tracks(frame)).toEqual([400])
  })
})

describe('AppFrame — guard branches', () => {
  it('pointer moves without capture are ignored (no width write)', () => {
    const { frame, instance } = mountFrame()
    const handle = frame.querySelectorAll('[class*="handle"]')[0]!
    const before = instance.getSnapshot().sidebar
    // Move + up without a preceding pointerdown: hasPointerCapture is false.
    act(() => {
      handle.dispatchEvent(new PointerEvent('pointermove', { pointerId: 9, clientX: 500, bubbles: true }))
      vi.advanceTimersByTime(20)
      handle.dispatchEvent(new PointerEvent('pointerup', { pointerId: 9, clientX: 500, bubbles: true }))
    })
    expect(instance.getSnapshot().sidebar).toBe(before)
  })

  it('two moves inside one frame coalesce through the pending rAF', () => {
    const { frame, instance } = mountFrame()
    const handle = frame.querySelectorAll('[class*="handle"]')[0]!
    act(() => { handle.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: SIDEBAR_DEFAULT, bubbles: true })) })
    act(() => {
      // Two moves before the frame flushes: the second must ride the pending
      // rAF (frame.current ??= guard), and the flush sees the latest x.
      handle.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 320, bubbles: true }))
      handle.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 340, bubbles: true }))
      vi.advanceTimersByTime(20)
    })
    act(() => { handle.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 340, bubbles: true })) })
    expect(instance.getSnapshot().sidebar).toBe(340)
  })

  it('pointerup with a pending rAF cancels it and commits the final position', () => {
    const { frame, instance } = mountFrame()
    const handle = frame.querySelectorAll('[class*="handle"]')[0]!
    act(() => { handle.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: SIDEBAR_DEFAULT, bubbles: true })) })
    act(() => {
      handle.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 360, bubbles: true }))
      // No timer advance: the rAF is still pending when pointerup arrives.
      handle.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 360, bubbles: true }))
    })
    expect(instance.getSnapshot().sidebar).toBe(360)
  })

  it('zero-width resize reports are ignored (display:none window)', () => {
    const { frame } = mountFrame()
    frameWidth = 0
    act(() => { fireResize?.(); vi.advanceTimersByTime(20) })
    // Track template still reflects the last non-zero viewport.
    expect(tracks(frame)).toEqual([SIDEBAR_DEFAULT])
  })
})

describe('AppFrame — unmount with an in-flight resize frame', () => {
  it('cancels the pending rAF on unmount (no post-unmount setState)', () => {
    const { unmount } = mountFrame()
    frameWidth = 800
    act(() => { fireResize?.() }) // rAF scheduled, NOT flushed
    unmount()
    // Flushing after unmount must be a no-op (the frame was cancelled).
    expect(() => { vi.advanceTimersByTime(20) }).not.toThrow()
  })

  it('double resize inside one frame rides the pending rAF (??= guard)', () => {
    const { frame } = mountFrame()
    frameWidth = 980
    act(() => { fireResize?.(); fireResize?.(); vi.advanceTimersByTime(20) })
    expect(tracks(frame)).toEqual([SIDEBAR_COLLAPSED])
  })
})
