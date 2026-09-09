// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { bindSnapshotSelector } from '@deepseek-ai/dsh-client-test-runtime'
import type {
  SessionId, SessionListState, SessionSummary, WorkspaceId, WorkspaceListState, WorkspaceView,
} from '@deepseek-ai/dsh-client-runtime/client'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { zh as commonZh } from '@deepseek-ai/dsh-client-locale/src/locales/zh.ts'
import type { WorkspaceBrowserProps } from '../src/client/contract/slots.ts'
import { createWorkspaceViewStore, FLAT_SESSION_ORDER_KEY } from '../src/client/stores.ts'
import { WorkspaceBrowser } from '../src/client/WorkspaceBrowser.tsx'
import { zh } from '../src/client/locales.ts'

afterEach(cleanup)
beforeEach(() => { localStorage.clear(); createWorkspaceViewStore().create().actions.setOrderBy('manual') })

// The seat's key domain is workspace ∪ common; the stub mirrors the real
// lookup chain (namespace, then common vocabulary, then the key).
const t: WorkspaceBrowserProps['t'] = makeTranslate(zh, commonZh)

const sid = (id: string) => id as SessionId
const wid = (id: string) => id as WorkspaceId
const summary = (id: string, updatedAt: number, overrides: Partial<SessionSummary> = {}): SessionSummary => ({
  id: sid(id), displayTitle: id, running: false, blank: false, updatedAt, ...overrides,
})
const sessionState = (items: readonly SessionSummary[], overrides: Partial<SessionListState> = {}): SessionListState => ({
  ids: items.map(item => item.id),
  byId: Object.fromEntries(items.map(item => [item.id, item])),
  current: undefined,
  phase: 'ready',
  subagentsByParent: {}, jobsBySession: {},
  currentAddress: undefined,
  ...overrides,
})
const workspace = (id: string, sessionIds: string[], title = id): WorkspaceView => ({
  workspaceId: wid(id), path: `/projects/${id}`, title,
  sessionIds: sessionIds.map(sid), createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
})
const workspaceState = (items: readonly WorkspaceView[], archivedSessionIds: readonly SessionId[] = []): WorkspaceListState => ({
  items, archivedSessionIds, state: 'idle', phase: 'ready', error: null, baselinesReady: true,
  recentWorkspaceId: items[0]?.workspaceId,
})
function hook<T>(snapshot: T) {
  return function select<S>(selector: (state: T) => S): S { return selector(snapshot) }
}

/** jsdom lacks DragEvent — the fireEvent fallback drops clientY, so pin it on the built event. */
function fireDrag(row: HTMLElement, kind: 'dragOver' | 'drop', clientY: number): void {
  const event = kind === 'dragOver' ? createEvent.dragOver(row) : createEvent.drop(row)
  Object.defineProperty(event, 'clientY', { value: clientY })
  Object.defineProperty(event, 'dataTransfer', { value: { effectAllowed: '', dropEffect: '' } })
  fireEvent(row, event)
}

function dragData(): Pick<DataTransfer, 'effectAllowed' | 'dropEffect' | 'setData'> {
  return { effectAllowed: 'uninitialized', dropEffect: 'none', setData: vi.fn() }
}

function mount(overrides: Partial<WorkspaceBrowserProps> = {}) {
  const store = createWorkspaceViewStore().create()
  const props: WorkspaceBrowserProps = {
    wide: true,
    expandSidebar: vi.fn(),
    useSessions: hook(sessionState([])),
    useWorkspaces: hook(workspaceState([])),
    useStore: bindSnapshotSelector(store),
    actions: store.actions,
    startSession: vi.fn(),
    open: vi.fn(),
    searchSessions: vi.fn(async () => ({ items: [], hasMore: false })),
    searchResultLimit: 20,
    renameSession: vi.fn(async () => {}),
    forkSession: vi.fn(),
    renameWorkspace: vi.fn(async () => {}),
    deleteWorkspace: vi.fn(async () => {}),
    archiveSession: vi.fn(async () => {}),
    insertWorkspaceBefore: vi.fn(async () => {}),
    insertSessionBefore: vi.fn(async () => {}),
    createWorkspace: vi.fn(async () => workspace('created', [])),
    useDirectoryFlow: bindSnapshotSelector({ getSnapshot: () => true, subscribe: () => () => {} }),
    useHostDescription: selector => selector(undefined),
    renderSlot: ((_name: string, owner: { open: boolean }) => (owner.open ? <div data-testid="directory-flow" /> : null)) as never,
    t,
    ...overrides,
  }
  const view = render(<WorkspaceBrowser {...props} />)
  return { view, props, store }
}

/** Re-render with (possibly) changed props — WorkspaceBrowser has no side channel. */
function rerender(b: ReturnType<typeof mount>, overrides: Partial<WorkspaceBrowserProps>) {
  Object.assign(b.props, overrides)
  b.view.rerender(<WorkspaceBrowser {...b.props} />)
}

/** Pin a row's box so the pointer-position half resolves to the bottom half. */
function pinBottomHalf(row: HTMLElement): void {
  row.getBoundingClientRect = () => ({
    top: 150, bottom: 184, left: 0, right: 200, width: 200, height: 34, x: 0, y: 150, toJSON: () => ({}),
  })
}

describe('WorkspaceBrowser projects section', () => {
  it('lists workspaces as project rows and starts a session on click', () => {
    const startSession = vi.fn()
    mount({
      useWorkspaces: hook(workspaceState([workspace('alpha', []), workspace('beta', [])])),
      startSession,
    })
    expect(screen.getByText('项目')).toBeTruthy()
    fireEvent.click(screen.getByText('alpha'))
    expect(startSession).toHaveBeenCalledWith(wid('alpha'))
    fireEvent.click(screen.getByText('beta'))
    expect(startSession).toHaveBeenCalledWith(wid('beta'))
  })

  it('shows the pin hint when no workspace is listed', () => {
    mount()
    expect(screen.getByText('固定项目以显示在这里')).toBeTruthy()
  })

  it('raises the directory flow straight from the section ＋ (add is the only entry)', () => {
    mount({ useWorkspaces: hook(workspaceState([workspace('alpha', [])])) })
    fireEvent.click(screen.getByRole('button', { name: '添加工作区' }))
    // addOnly flow: no disambiguating menu — the gesture IS the add action.
    expect(screen.queryByRole('menuitem')).toBeNull()
    expect(screen.getByTestId('directory-flow')).toBeTruthy()
  })

  it('hides the add button when no directory-flow occupant is composed', () => {
    mount({
      useDirectoryFlow: bindSnapshotSelector({ getSnapshot: () => false, subscribe: () => () => {} }),
    })
    expect(screen.queryByRole('button', { name: '添加工作区' })).toBeNull()
  })
})

describe('WorkspaceBrowser conversations section', () => {
  it('renders sessions newest-first and seeds the flat order account in Manual mode', () => {
    const b = mount({
      useSessions: hook(sessionState([summary('one', 3), summary('two', 2), summary('three', 1)])),
    })
    expect(screen.getByText('会话与任务')).toBeTruthy()
    expect(screen.getAllByRole('treeitem').map(row => row.textContent)).toEqual([
      expect.stringContaining('one'),
      expect.stringContaining('two'),
      expect.stringContaining('three'),
    ])
    expect(b.store.getSnapshot().sessionOrderByAccount[FLAT_SESSION_ORDER_KEY]).toEqual(['one', 'two', 'three'])
  })

  it('toggles order between Manual and Last updated from the section sort button', () => {
    const b = mount({
      useSessions: hook(sessionState([summary('one', 3), summary('two', 2)])),
    })
    expect(b.store.getSnapshot().orderBy).toBe('manual')
    fireEvent.click(screen.getByRole('button', { name: '视图选项' }))
    expect(b.store.getSnapshot().orderBy).toBe('updated')
    fireEvent.click(screen.getByRole('button', { name: '视图选项' }))
    expect(b.store.getSnapshot().orderBy).toBe('manual')
  })

  it('persists flat drag order locally and re-sorts once on switching to Last updated', async () => {
    const sessions = sessionState([summary('one', 3), summary('two', 2), summary('three', 1)])
    const b = mount({
      useSessions: hook(sessions),
      useWorkspaces: hook(workspaceState([workspace('alpha', ['one'])])),
    })

    const one = screen.getByText('one').closest('[role="treeitem"]') as HTMLElement
    const three = screen.getByText('three').closest('[role="treeitem"]') as HTMLElement
    pinBottomHalf(three)
    fireEvent.dragStart(one, { dataTransfer: dragData() })
    fireDrag(three, 'drop', 180)
    expect(b.store.getSnapshot().sessionOrderByAccount[FLAT_SESSION_ORDER_KEY])
      .toEqual(['two', 'three', 'one'])

    // Entering Last updated performs one complete recency sort of the account.
    fireEvent.click(screen.getByRole('button', { name: '视图选项' }))
    await waitFor(() => {
      expect(b.store.getSnapshot().sessionOrderByAccount[FLAT_SESSION_ORDER_KEY])
        .toEqual(['one', 'two', 'three'])
    })

    // Back to Manual, drag again, remount: the stored order survives.
    fireEvent.click(screen.getByRole('button', { name: '视图选项' }))
    fireEvent.dragStart(one, { dataTransfer: dragData() })
    fireDrag(three, 'drop', 180)
    b.view.unmount()

    const restored = mount({ useSessions: hook(sessions), useWorkspaces: hook(workspaceState([workspace('alpha', ['one'])])) })
    expect(restored.store.getSnapshot().orderBy).toBe('manual')
    expect(screen.getAllByRole('treeitem').map(row => row.textContent)).toEqual([
      expect.stringContaining('two'),
      expect.stringContaining('three'),
      expect.stringContaining('one'),
    ])
  })

  it('promotes sessions once per activity while Last updated stays active', async () => {
    const b = mount({
      useSessions: hook(sessionState([summary('one', 3), summary('two', 2)])),
    })
    // Manual mode: a newer timestamp refreshes the baseline without reordering.
    rerender(b, { useSessions: hook(sessionState([summary('one', 4), summary('two', 2)])) })
    await waitFor(() => {
      expect(b.store.getSnapshot().sessionUpdatedAtByAccount[FLAT_SESSION_ORDER_KEY]).toEqual({ one: 4, two: 2 })
    })
    expect(b.store.getSnapshot().sessionOrderByAccount[FLAT_SESSION_ORDER_KEY]).toEqual(['one', 'two'])

    // Entering Last updated sorts by recency once.
    fireEvent.click(screen.getByRole('button', { name: '视图选项' }))
    await waitFor(() => {
      expect(screen.getAllByRole('treeitem')[0]?.textContent).toContain('one')
    })

    // A later activity promotes that session exactly once while the mode stays.
    rerender(b, { useSessions: hook(sessionState([summary('one', 4), summary('two', 5)])) })
    await waitFor(() => {
      expect(b.store.getSnapshot().sessionOrderByAccount[FLAT_SESSION_ORDER_KEY]).toEqual(['two', 'one'])
      expect(screen.getAllByRole('treeitem')[0]?.textContent).toContain('two')
    })
  })

  it('drag end without a drop clears markers; bottom-half drop appends past the last row', () => {
    const b = mount({ useSessions: hook(sessionState([summary('one', 2), summary('two', 1)])) })
    const [one, two] = screen.getAllByRole('treeitem') as [HTMLElement, HTMLElement]
    pinBottomHalf(two)

    fireEvent.dragStart(one, { dataTransfer: dragData() })
    fireEvent.dragEnd(one)
    fireDrag(two, 'drop', 180)
    expect(b.store.getSnapshot().sessionOrderByAccount[FLAT_SESSION_ORDER_KEY]).toEqual(['one', 'two'])

    fireEvent.dragStart(one, { dataTransfer: dragData() })
    fireDrag(two, 'dragOver', 180)
    fireDrag(two, 'drop', 180)
    expect(b.store.getSnapshot().sessionOrderByAccount[FLAT_SESSION_ORDER_KEY]).toEqual(['two', 'one'])
  })

  it('accepts a document-level drop and commits the last Session marker on drag end', () => {
    const b = mount({ useSessions: hook(sessionState([summary('one', 2), summary('two', 1)])) })
    const [one, two] = screen.getAllByRole('treeitem') as [HTMLElement, HTMLElement]
    pinBottomHalf(two)
    fireEvent.dragStart(one, { dataTransfer: dragData() })
    fireDrag(two, 'dragOver', 180)
    const outsideDrop = createEvent.drop(document.body)
    Object.defineProperty(outsideDrop, 'dataTransfer', { value: dragData() })
    fireEvent(document.body, outsideDrop)
    expect(outsideDrop.defaultPrevented).toBe(true)
    fireEvent.dragEnd(one)
    expect(b.store.getSnapshot().sessionOrderByAccount[FLAT_SESSION_ORDER_KEY]).toEqual(['two', 'one'])
  })
})

describe('WorkspaceBrowser session rows', () => {
  it('archives a session from the row menu and hides it on the archive echo', async () => {
    const archiveSession = vi.fn(async () => {})
    const b = mount({
      useSessions: hook(sessionState([summary('kept-s', 2), summary('gone-s', 1)])),
      useWorkspaces: hook(workspaceState([workspace('alpha', ['kept-s', 'gone-s'])])),
      archiveSession,
    })
    fireEvent.click(screen.getByRole('button', { name: '会话“gone-s”的操作' }))
    fireEvent.click(screen.getByRole('menuitem', { name: '归档会话' }))
    expect(archiveSession).toHaveBeenCalledWith(sid('gone-s'))

    rerender(b, { useWorkspaces: hook(workspaceState([workspace('alpha', ['kept-s', 'gone-s'])], [sid('gone-s')])) })
    expect(screen.queryByText('gone-s')).toBeNull()
    expect(screen.getByText('kept-s')).toBeTruthy()
  })

  it('logs and keeps the row when the archive call rejects', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const archiveSession = vi.fn(async () => { throw new Error('archive exploded') })
      mount({
        useSessions: hook(sessionState([summary('gone-s', 1)])),
        archiveSession,
      })
      fireEvent.click(screen.getByRole('button', { name: '会话“gone-s”的操作' }))
      fireEvent.click(screen.getByRole('menuitem', { name: '归档会话' }))
      await waitFor(() => {
        expect(warn).toHaveBeenCalledWith('session archive rejected:', expect.any(Error))
      })
      expect(screen.getByText('gone-s')).toBeTruthy()
    } finally {
      warn.mockRestore()
    }
  })

  it('renames a session through the row menu dialog and confirms with the pinned title', async () => {
    const renameSession = vi.fn(async () => {})
    mount({
      useSessions: hook(sessionState([summary('alpha-s', 2)])),
      renameSession,
    })
    fireEvent.click(screen.getByRole('button', { name: '会话“alpha-s”的操作' }))
    fireEvent.click(screen.getByRole('menuitem', { name: '重命名' }))
    const input = screen.getByLabelText<HTMLInputElement>('会话名称')
    expect(input.value).toBe('alpha-s')
    fireEvent.change(input, { target: { value: 'Renamed' } })
    fireEvent.click(screen.getByRole('button', { name: '重命名' }))
    expect(renameSession).toHaveBeenCalledWith(sid('alpha-s'), 'Renamed')
  })

  it('forks a session from the row menu', () => {
    const forkSession = vi.fn()
    mount({
      useSessions: hook(sessionState([summary('alpha-s', 2)])),
      forkSession,
    })
    fireEvent.click(screen.getByRole('button', { name: '会话“alpha-s”的操作' }))
    fireEvent.click(screen.getByRole('menuitem', { name: '分叉会话' }))
    expect(forkSession).toHaveBeenCalledWith(sid('alpha-s'))
  })

  it('shows only the current blank session as the localized New Session, excluded from search', () => {
    const currentBlank = summary('alpha-blank', 9, { blank: true })
    const staleBlank = summary('beta-blank', 8, { blank: true })
    const sessions = sessionState(
      [currentBlank, staleBlank],
      { current: currentBlank.id },
    )
    const b = mount({
      useSessions: hook(sessions),
      useWorkspaces: hook(workspaceState([
        workspace('alpha', ['alpha-blank']), workspace('beta', ['beta-blank']),
      ])),
    })
    expect(screen.getByText('新会话')).toBeTruthy()
    expect(screen.queryByText('alpha-blank')).toBeNull()
    expect(screen.queryByText('beta-blank')).toBeNull()

    rerender(b, { useSessions: hook({ ...sessions, current: staleBlank.id }) })
    expect(screen.getAllByText('新会话')).toHaveLength(1)
    // Search excludes blank rows entirely — neither the canonical stored
    // title nor the localized display label participates in matching.
    fireEvent.click(screen.getByRole('button', { name: '搜索会话' }))
    fireEvent.change(screen.getByPlaceholderText('搜索会话…'), { target: { value: 'new session' } })
    expect(screen.queryByText('新会话')).toBeNull()
    fireEvent.change(screen.getByPlaceholderText('搜索会话…'), { target: { value: '新会话' } })
    expect(screen.queryByText('新会话')).toBeNull()
  })

  it('promotes the current blank session in its workspace account and the flat account', async () => {
    const items = [
      summary('old', 100),
      summary('blank', 150, { blank: true }),
      summary('mid', 200),
    ]
    const b = mount({
      useSessions: hook(sessionState(items, { current: sid('blank') })),
      useWorkspaces: hook(workspaceState([workspace('alpha', ['old', 'blank', 'mid'])])),
    })
    await waitFor(() => {
      expect(b.store.getSnapshot().sessionOrderByAccount.alpha).toEqual(['blank'])
      expect(b.store.getSnapshot().sessionOrderByAccount[FLAT_SESSION_ORDER_KEY]).toEqual(['blank', 'mid', 'old'])
    })
  })

  it('does not repeat blank promotion after a manual drag', async () => {
    const b = mount({
      useSessions: hook(sessionState([
        summary('old', 100),
        summary('blank', 150, { blank: true }),
        summary('mid', 200),
      ], { current: sid('blank') })),
      useWorkspaces: hook(workspaceState([workspace('alpha', ['old', 'blank', 'mid'])])),
    })
    await waitFor(() => {
      expect(b.store.getSnapshot().sessionOrderByAccount[FLAT_SESSION_ORDER_KEY]).toEqual(['blank', 'mid', 'old'])
    })
    const blank = screen.getByText('新会话').closest('[role="treeitem"]') as HTMLElement
    const mid = screen.getByText('mid').closest('[role="treeitem"]') as HTMLElement
    pinBottomHalf(mid)
    fireEvent.dragStart(blank, { dataTransfer: dragData() })
    fireDrag(mid, 'drop', 180)
    expect(b.store.getSnapshot().sessionOrderByAccount[FLAT_SESSION_ORDER_KEY]).toEqual(['mid', 'blank', 'old'])

    // The same blank staying current must not jump back to the top.
    rerender(b, {
      useSessions: hook(sessionState([
        summary('old', 100),
        summary('blank', 150, { blank: true }),
        summary('mid', 200),
      ], { current: sid('blank') })),
    })
    await waitFor(() => {
      expect(screen.getAllByRole('treeitem').map(row => row.textContent)).toEqual([
        expect.stringContaining('mid'),
        expect.stringContaining('新会话'),
        expect.stringContaining('old'),
      ])
    })
  })
})

describe('WorkspaceBrowser search', () => {
  it('shows local metadata matches immediately, then clears back to the flat list', async () => {
    vi.useFakeTimers()
    try {
      const sessions = sessionState([
        summary('needle-row', 2, { displayTitle: 'Needle row' }),
        summary('other-row', 1, { displayTitle: 'Other row' }),
      ])
      mount({
        useSessions: hook(sessions),
        useWorkspaces: hook(workspaceState([workspace('alpha', ['needle-row', 'other-row'])])),
      })
      fireEvent.click(screen.getByRole('button', { name: '搜索会话' }))
      const input = screen.getByPlaceholderText<HTMLInputElement>('搜索会话…')
      fireEvent.change(input, { target: { value: 'needle' } })
      const resultTree = screen.getByRole('tree', { name: '搜索结果' })
      expect(screen.getByText('Needle row')).toBeTruthy()
      expect(screen.queryByText('Other row')).toBeNull()
      const status = screen.getByRole('status')
      expect(status.textContent).toBe('正在搜索会话历史…')
      expect(resultTree.contains(status)).toBe(false)

      fireEvent.change(input, { target: { value: 'zzz' } })
      await act(async () => { await vi.advanceTimersByTimeAsync(250) })
      expect(screen.getByText('无匹配会话')).toBeTruthy()
      fireEvent.click(screen.getByRole('button', { name: '清除搜索' }))
      expect(input.value).toBe('')
      expect(screen.getByRole('tree', { name: '会话' })).toBeTruthy()
      // Clicking the field row focuses the input (wide mode).
      fireEvent.click(input.parentElement as HTMLElement)
      expect(document.activeElement).toBe(input)
    } finally {
      vi.useRealTimers()
    }
  })

  it('collapses an empty search on outside click but keeps a non-empty query expanded', () => {
    mount()
    const search = screen.getByRole('button', { name: '搜索会话' })
    fireEvent.click(search)
    expect(search.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(document.body)
    expect(search.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(search)
    const input = screen.getByPlaceholderText<HTMLInputElement>('搜索会话…')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.click(document.body)
    expect(search.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(search)
    fireEvent.change(input, { target: { value: 'kept' } })
    fireEvent.click(document.body)
    expect(search.getAttribute('aria-expanded')).toBe('true')
    expect(input.value).toBe('kept')
  })

  it('adds Host content hits with context, shows the result bound, and opens without clearing the query', async () => {
    vi.useFakeTimers()
    try {
      const open = vi.fn()
      const searchSessions = vi.fn(async () => ({
        items: [{ sessionId: sid('body-hit'), snippet: '…the waterfall token appears here…' }],
        hasMore: true,
      }))
      mount({
        useSessions: hook(sessionState([
          summary('body-hit', 1, { displayTitle: 'Research notes' }),
        ])),
        useWorkspaces: hook(workspaceState([
          workspace('research', ['body-hit'], 'Research Workspace'),
        ])),
        open,
        searchSessions,
      })
      fireEvent.click(screen.getByRole('button', { name: '搜索会话' }))
      const input = screen.getByPlaceholderText<HTMLInputElement>('搜索会话…')
      fireEvent.change(input, { target: { value: 'waterfall token' } })
      expect(screen.getByText('正在搜索会话历史…')).toBeTruthy()
      expect(screen.queryByText('Research notes')).toBeNull()

      await act(async () => { await vi.advanceTimersByTimeAsync(250) })

      expect(searchSessions).toHaveBeenCalledWith('waterfall token', expect.any(AbortSignal))
      expect(screen.getByText('Research notes')).toBeTruthy()
      // The workspace name shows twice: the always-visible project row and
      // the result row's context line.
      expect(screen.getAllByText('Research Workspace')).toHaveLength(2)
      expect(screen.getByText('…the waterfall token appears here…')).toBeTruthy()
      expect(screen.getByText('仅显示前 20 条结果，请缩小搜索范围。')).toBeTruthy()
      fireEvent.click(screen.getByRole('treeitem'))
      expect(open).toHaveBeenCalledWith(sid('body-hit'))
      expect(input.value).toBe('waterfall token')
    } finally {
      vi.useRealTimers()
    }
  })

  it('bounds programmatic search input to a schema-valid request without splitting an astral character', async () => {
    vi.useFakeTimers()
    try {
      const searchSessions = vi.fn(async () => ({ items: [], hasMore: false }))
      mount({ searchSessions })
      fireEvent.click(screen.getByRole('button', { name: '搜索会话' }))
      const input = screen.getByPlaceholderText<HTMLInputElement>('搜索会话…')
      expect(input.maxLength).toBe(500)
      fireEvent.change(input, { target: { value: 'y'.repeat(501) } })
      expect(input.value).toBe('y'.repeat(500))
      const expected = `prefix${'x'.repeat(493)}`
      fireEvent.change(input, {
        target: { value: `prefix\0${'x'.repeat(493)}😀tail` },
      })

      expect(input.value).toBe(expected)
      expect(input.value.length).toBe(499)
      expect(input.value).not.toContain('\0')
      await act(async () => { await vi.advanceTimersByTimeAsync(250) })
      expect(searchSessions).toHaveBeenCalledOnce()
      expect(searchSessions).toHaveBeenCalledWith(expected, expect.any(AbortSignal))
    } finally {
      vi.useRealTimers()
    }
  })

  it('keeps local matches and shows a lightweight warning when Host search fails', async () => {
    vi.useFakeTimers()
    try {
      const searchSessions = vi.fn(async () => { throw new Error('search down') })
      mount({
        useSessions: hook(sessionState([summary('local-hit', 2)])),
        searchSessions,
      })
      fireEvent.click(screen.getByRole('button', { name: '搜索会话' }))
      fireEvent.change(screen.getByPlaceholderText('搜索会话…'), { target: { value: 'local' } })
      await act(async () => { await vi.advanceTimersByTimeAsync(250) })
      expect(screen.getByText('local-hit')).toBeTruthy()
      expect(screen.getByText('内容搜索暂不可用，仅显示名称匹配。')).toBeTruthy()
    } finally {
      vi.useRealTimers()
    }
  })

  it('aborts a superseded request and ignores its stale result', async () => {
    vi.useFakeTimers()
    try {
      const searchSessions = vi.fn(async (query: string) => {
        await new Promise(resolve => { setTimeout(resolve, 10) })
        return { items: [], hasMore: false }
      })
      mount({ searchSessions })
      fireEvent.click(screen.getByRole('button', { name: '搜索会话' }))
      const input = screen.getByPlaceholderText<HTMLInputElement>('搜索会话…')
      fireEvent.change(input, { target: { value: 'first' } })
      await act(async () => { await vi.advanceTimersByTimeAsync(250) })
      fireEvent.change(input, { target: { value: 'second' } })
      await act(async () => { await vi.advanceTimersByTimeAsync(250) })
      fireEvent.change(input, { target: { value: 'third' } })
      await act(async () => { await vi.advanceTimersByTimeAsync(400) })
      // One request per settled debounce window; the superseded in-flight
      // request ('second') was aborted and its late answer ignored.
      expect(searchSessions).toHaveBeenCalledTimes(3)
      const [secondQuery, secondSignal] = searchSessions.mock.calls[1] as [string, AbortSignal]
      expect(secondQuery).toBe('second')
      expect(secondSignal.aborted).toBe(true)
      expect(screen.getByRole('tree', { name: '搜索结果' })).toBeTruthy()
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows the no-sessions empty state and resolves an empty search', async () => {
    vi.useFakeTimers()
    try {
      const b = mount()
      expect(screen.getByText('暂无会话')).toBeTruthy()
      fireEvent.click(screen.getByRole('button', { name: '搜索会话' }))
      fireEvent.change(screen.getByPlaceholderText('搜索会话…'), { target: { value: 'x' } })
      expect(screen.getByText('正在搜索会话历史…')).toBeTruthy()
      await act(async () => { await vi.advanceTimersByTimeAsync(250) })
      expect(screen.getByText('无匹配会话')).toBeTruthy()
    } finally {
      vi.useRealTimers()
    }
  })

  it('search hides drag affordances (rows are not draggable during search)', () => {
    const sessions = sessionState([summary('one', 2), summary('two', 1)])
    mount({
      useSessions: hook(sessions),
      useWorkspaces: hook(workspaceState([workspace('alpha', ['one', 'two'])])),
    })
    expect(screen.getByText('one').closest('[role="treeitem"]')).toHaveProperty('draggable', true)
    fireEvent.click(screen.getByRole('button', { name: '搜索会话' }))
    fireEvent.change(screen.getByPlaceholderText('搜索会话…'), { target: { value: 'one' } })
    const hit = screen.getByText('one').closest('[role="treeitem"]') as HTMLElement
    expect(hit.getAttribute('draggable')).toBeNull()
  })
})

describe('WorkspaceBrowser store hygiene', () => {
  it('prunes deleted Workspace view state only after the Workspace baseline is ready', async () => {
    const pending = {
      ...workspaceState([]),
      phase: 'pending' as const,
      state: 'loading' as const,
      baselinesReady: false,
    }
    const b = mount({ useWorkspaces: hook(pending) })
    act(() => {
      b.store.actions.setGroupExpanded('deleted', true)
      b.store.actions.syncSessionOrderAccount('deleted', ['session'], { session: 1 })
    })
    expect(b.store.getSnapshot().groupExpansion).toEqual({ deleted: true })

    rerender(b, { useWorkspaces: hook(workspaceState([])) })
    await waitFor(() => {
      const snapshot = b.store.getSnapshot()
      expect(snapshot.groupExpansion).toEqual({})
      expect(Object.keys(snapshot.sessionOrderByAccount)).toEqual([FLAT_SESSION_ORDER_KEY])
      expect(Object.keys(snapshot.sessionUpdatedAtByAccount)).toEqual([FLAT_SESSION_ORDER_KEY])
    })
  })
})
