// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import type {
  SidebarFooterActionOwnerProps, SidebarRootComponentProps, SidebarSectionOwnerProps,
  SidebarSettingsOwnerProps,
} from '../src/client/contract/slots.ts'
import { SidebarRoot, SIDEBAR_SEARCH_EVENT } from '../src/client/SidebarRoot.tsx'
import { en } from '../src/client/locales.ts'

// English-dictionary translate stub: the shell renders the same copy the
// assertions below query by accessible name.
const t: SidebarRootComponentProps['t'] = key => (en as Record<string, string>)[key] ?? key

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

// The shell never reads the global hooks itself, but they ride the standard
// props share; stub them as never-called functions.
const neverHook = (() => { throw new Error('shell must not read global hooks') }) as never

/** One workspace row as the list snapshot would carry it. */
const project = {
  workspaceId: 'ws-1' as never,
  path: '/home/arthur/projeto',
  title: 'projeto',
  sessionIds: [],
  createdAt: '',
  updatedAt: '',
}

/** Static list snapshot for the Projetos modal's selector hook. */
function listHook(items: readonly unknown[] = []) {
  return (selector: (state: { items: readonly unknown[] }) => unknown) =>
    selector({ items, archivedSessionIds: [] })
}

function mountShell({ collapsed = false, width = 300, items = [] as readonly unknown[] }: {
  collapsed?: boolean
  width?: number
  items?: readonly unknown[]
} = {}) {
  const startSession = vi.fn()
  const toggleSidebar = vi.fn()
  const connect = vi.fn(() => Promise.resolve('s-1' as never))
  const create = vi.fn(() => Promise.resolve(project as never))
  const pickDirectory = vi.fn(() => Promise.resolve('/home/arthur/novo'))
  const openPath = vi.fn(() => Promise.resolve())
  let regionOwner: SidebarSectionOwnerProps | undefined
  let settingsOwner: SidebarSettingsOwnerProps | undefined
  let footerActionOwner: SidebarFooterActionOwnerProps | undefined
  const brandMark = <span data-testid="custom-brand-mark">M</span>
  const brandName = <span data-testid="custom-brand-name">Custom Brand</span>
  let current = { collapsed, width }
  const root = () => (
    <SidebarRoot
      collapsed={current.collapsed} width={current.width}
      useSessions={neverHook} useWorkspaces={listHook(items) as never}
      startSession={startSession} toggleSidebar={toggleSidebar} t={t}
      workspaces={{ connect, create, pickDirectory, openPath }}
      renderSlot={((
        key: string,
        owner: SidebarFooterActionOwnerProps | SidebarSectionOwnerProps | SidebarSettingsOwnerProps,
      ) => {
        if (key === 'sidebar.brand.mark') return brandMark
        if (key === 'sidebar.brand.name') return brandName
        if (key === 'sidebar.settings') {
          settingsOwner = owner
          return <div data-testid="settings-seat" data-wide={owner.wide} />
        }
        if (key === 'sidebar.footer.action') {
          footerActionOwner = owner
          return <div data-testid="footer-action-seat" data-wide={owner.wide} />
        }
        regionOwner = owner as SidebarSectionOwnerProps
        return <div data-testid="region" data-wide={owner.wide} />
      }) as SidebarRootComponentProps['renderSlot']}
    />
  )
  const view = render(root())
  return {
    startSession,
    toggleSidebar,
    connect,
    create,
    pickDirectory,
    openPath,
    regionOwner: () => {
      if (regionOwner === undefined) throw new Error('region owner not rendered')
      return regionOwner
    },
    settingsOwner: () => {
      if (settingsOwner === undefined) throw new Error('settings owner not rendered')
      return settingsOwner
    },
    footerActionOwner: () => {
      if (footerActionOwner === undefined) throw new Error('footer action owner not rendered')
      return footerActionOwner
    },
    rerender(next: Partial<typeof current>) {
      current = { ...current, ...next }
      view.rerender(root())
    },
  }
}

describe('SidebarRoot shell', () => {
  it('routes New Session (pill + wordmark behavior) and the foot collapse control', () => {
    const b = mountShell()
    // The committed shell renders the wordmark slot only (no mark in the row).
    expect(screen.getByTestId('custom-brand-name')).toBeTruthy()
    // Expanded, the Novo pill starts a session.
    fireEvent.click(screen.getByRole('button', { name: en['session.new.label'] }))
    expect(b.startSession).toHaveBeenCalledOnce()
    // The fold control lives in the foot cluster (one wide-shell toggle).
    const collapses = screen.getAllByRole('button', { name: en['toggle.collapse'] })
    expect(collapses).toHaveLength(1)
    fireEvent.click(collapses[0]!)
    expect(b.toggleSidebar).toHaveBeenCalledOnce()
  })

  it('renders the serif brand fallback when no package fills the slot', () => {
    const { container } = render(<SidebarRoot
      collapsed={false} width={300}
      useSessions={neverHook} useWorkspaces={listHook() as never}
      startSession={vi.fn()} toggleSidebar={vi.fn()} t={t}
      workspaces={{ connect: vi.fn(), create: vi.fn(), pickDirectory: vi.fn(), openPath: vi.fn() }}
      renderSlot={((_key: string, _owner: unknown, options?: { fallback?: ReactNode }) =>
        options?.fallback ?? null) as SidebarRootComponentProps['renderSlot']}
    />)
    expect(screen.getByText('Claude')).toBeTruthy()
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('opens Projetos and Artefatos modals and leaves Código/Personalizar disabled', () => {
    const b = mountShell({ items: [project] })
    const rows = screen.getAllByRole('button', { name: new RegExp(`${en['nav.projects']}|${en['nav.artifacts']}|${en['nav.code']}|${en['nav.customize']}`) })
    expect(rows).toHaveLength(4)
    expect(rows[2]!).toHaveProperty('disabled', true)
    expect(rows[3]!).toHaveProperty('disabled', true)

    fireEvent.click(screen.getByRole('button', { name: en['nav.projects'] }))
    expect(screen.getByRole('dialog', { name: en['projects.modal.title'] })).toBeTruthy()
    // Connect-on-click: the project row connects and closes the modal.
    fireEvent.click(screen.getByText('projeto'))
    expect(b.connect).toHaveBeenCalledWith('ws-1')
    expect(screen.queryByRole('dialog', { name: en['projects.modal.title'] })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: en['nav.artifacts'] }))
    expect(screen.getByRole('dialog', { name: en['artifacts.modal.title'] })).toBeTruthy()
    expect(screen.getByText(en['artifacts.empty'])).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: en.close }))
    expect(screen.queryByRole('dialog', { name: en['artifacts.modal.title'] })).toBeNull()
  })

  it('creates a project from the directory picker and connects it', async () => {
    const b = mountShell()
    fireEvent.click(screen.getByRole('button', { name: en['nav.projects'] }))
    expect(screen.getByText(en['projects.empty'])).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: en['projects.new'] }))
    await vi.waitFor(() => {
      expect(b.pickDirectory).toHaveBeenCalledOnce()
      expect(b.create).toHaveBeenCalledWith({ path: '/home/arthur/novo' })
      expect(b.connect).toHaveBeenCalledWith('ws-1')
    })
    expect(screen.queryByRole('dialog', { name: en['projects.modal.title'] })).toBeNull()
  })

  it('opens a project folder through the Host OS', () => {
    const b = mountShell({ items: [project] })
    fireEvent.click(screen.getByRole('button', { name: en['nav.projects'] }))
    fireEvent.click(screen.getByRole('button', { name: en['projects.openFolder'] }))
    expect(b.openPath).toHaveBeenCalledWith('/home/arthur/projeto')
  })

  it('shows the stored email as the popover heading and arms the settings gear', () => {
    window.localStorage.setItem('dshc:user-email', 'arthur@example.com')
    mountShell()
    fireEvent.click(screen.getByRole('button', { name: 'Arthur' }))
    expect(screen.getByText('arthur@example.com')).toBeTruthy()
    // Configurações carries the gear icon; selecting it clicks the hidden
    // settings trigger through.
    const settingsRow = screen.getByRole('menuitem', { name: en['profile.settings'] })
    expect(settingsRow.querySelector('svg')).not.toBeNull()
  })

  it('the foot search control asks the browsing region for its search box', () => {
    const b = mountShell()
    const listener = vi.fn()
    window.addEventListener(SIDEBAR_SEARCH_EVENT, listener)
    fireEvent.click(screen.getByRole('button', { name: en['profile.search'] }))
    expect(listener).toHaveBeenCalledOnce()
    expect(b.toggleSidebar).not.toHaveBeenCalled()
    window.removeEventListener(SIDEBAR_SEARCH_EVENT, listener)
  })

  it('hands the region its wide flag and clamps expandSidebar to the collapsed state', () => {
    const b = mountShell()
    expect(b.regionOwner().wide).toBe(true)
    // The settings seat rides the same wide flag (ui-settings renders the row).
    expect(b.settingsOwner().wide).toBe(true)
    expect(b.footerActionOwner().wide).toBe(true)
    // Expanded: the request is a no-op (no accidental collapse).
    b.regionOwner().expandSidebar()
    expect(b.toggleSidebar).not.toHaveBeenCalled()
  })

  it('keeps the region mounted through collapse and expands on its request', () => {
    vi.useFakeTimers()
    const b = mountShell()
    b.rerender({ collapsed: true })
    // Wide content survives the crossfade window, then settles into the rail.
    expect(b.regionOwner().wide).toBe(true)
    vi.advanceTimersByTime(200)
    b.rerender({})
    // Settled rail: the region and the foot unmount — the toggle alone rides.
    expect(screen.queryByTestId('region')).toBeNull()
    b.regionOwner().expandSidebar()
    expect(b.toggleSidebar).toHaveBeenCalledOnce()
  })

  it('renders statically collapsed on a cold start (no crossfade classes)', () => {
    const b = mountShell({ collapsed: true })
    // The rail carries the reopen toggle alone; wide chrome never mounts.
    expect(screen.queryByTestId('region')).toBeNull()
    expect(screen.queryByRole('button', { name: en['session.new.label'] })).toBeNull()
    expect(screen.getByRole('button', { name: en['toggle.open'] })).toBeTruthy()
  })
})
