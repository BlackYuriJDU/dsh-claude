// @vitest-environment jsdom
/** ChatFontRow behavior: the selector names the persisted font, the menu lists
 * every shipped stack, and a pick drives setChatFont and closes the menu. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createSnapshotStore, type SessionListState, type WorkspaceListState } from '@deepseek-ai/dsh-client-runtime/client'
import { bindSnapshotSelector } from '@deepseek-ai/dsh-client-test-runtime'
import { ChatFontRow } from '../src/client/ChatFontRow.tsx'
import type { ChatFontRowComponentProps } from '../src/client/ChatFontRow.tsx'
import { createChatFontRowStore } from '../src/client/chat-font-store.ts'
import type { ChatFont } from '../src/theme-settings.ts'

afterEach(cleanup)

const COPY: Record<string, string> = {
  'chatFont.label': 'Chat font',
  'chatFont.inter': 'Inter',
  'chatFont.system': 'System',
  'chatFont.serif': 'Serif',
  'chatFont.mono': 'Monospace',
}

function emptySessions() {
  const store = createSnapshotStore<SessionListState>(
    { ids: [], byId: {}, current: undefined, phase: 'ready', subagentsByParent: {}, jobsBySession: {}, currentAddress: undefined })
  return bindSnapshotSelector(store)
}
function emptyWorkspaces() {
  const store = createSnapshotStore<WorkspaceListState>({
    items: [], archivedSessionIds: [], state: 'idle', phase: 'ready', error: null,
    baselinesReady: true, recentWorkspaceId: undefined,
  })
  return bindSnapshotSelector(store)
}

function mount(chatFont: ChatFont = 'inter') {
  const store = createChatFontRowStore().create()
  store.actions.sync(chatFont, 0)
  const setChatFont = vi.fn()
  const props: ChatFontRowComponentProps = {
    useSessions: emptySessions(),
    useWorkspaces: emptyWorkspaces(),
    useStore: bindSnapshotSelector(store),
    actions: store.actions,
    t: (key: string) => COPY[key] ?? key,
    setChatFont,
  }
  render(<ChatFontRow {...props} />)
  return { store, setChatFont }
}

const selector = () => screen.getByRole('button', { name: /Inter|System|Serif|Monospace/ })

describe('ChatFontRow', () => {
  it('names the persisted font and follows the store mirror', () => {
    const b = mount('serif')
    expect(screen.getByText('Chat font')).toBeDefined()
    expect(selector().textContent).toBe('Serif')
    act(() => { b.store.actions.sync('mono', 1) })
    expect(selector().textContent).toBe('Monospace')
  })

  it('opens the menu, routes a pick to setChatFont, and closes', () => {
    const b = mount('inter')
    expect(selector().getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(selector())
    expect(selector().getAttribute('aria-expanded')).toBe('true')
    expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual(['Inter', 'System', 'Serif', 'Monospace'])

    fireEvent.click(screen.getByRole('menuitem', { name: 'Monospace' }))

    expect(b.setChatFont).toHaveBeenCalledWith('mono')
    expect(selector().getAttribute('aria-expanded')).toBe('false')
  })

  it('closes on dismissal without writing', () => {
    const b = mount('inter')
    fireEvent.click(selector())
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(selector().getAttribute('aria-expanded')).toBe('false')
    expect(b.setChatFont).not.toHaveBeenCalled()
  })
})
