// @vitest-environment jsdom
/**
 * ProjectsSection behavior: renders one card per workspace, edits instructions
 * and attaches/removes knowledge files through the durable projects scope.
 * The SettingsScope is a minimal fake over a mutable section (snapshot cached
 * per write, the contract useSyncExternalStore requires).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import type {
  SettingsScope, SettingsScopeSnapshot, WorkspaceId, WorkspaceListState, WorkspaceView,
} from '@deepseek-ai/dsh-client-runtime/client'
import { ProjectsSection } from '../src/client/ProjectsSection.tsx'
import type { ProjectsScopeSection } from '../src/client/ProjectsSection.tsx'
import { en } from '../src/client/locales.ts'

const t = (key: string): string => (en as Record<string, string>)[key] ?? key

/** Minimal SettingsScope fake over a mutable section (snapshot cached per write). */
function scopeOf(initial: ProjectsScopeSection): SettingsScope<ProjectsScopeSection> & { writes: unknown[] } {
  const listeners = new Set<() => void>()
  const writes: unknown[] = []
  let snap: SettingsScopeSnapshot<ProjectsScopeSection> = {
    status: 'ready', value: initial, base: undefined, user: undefined, revision: 1, writable: true, mode: 'host',
  }
  return {
    writes,
    getSnapshot: () => snap,
    subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    set: (_field, next) => {
      writes.push(next)
      snap = { ...snap, value: { projects: next as ProjectsScopeSection['projects'] } }
      for (const fn of [...listeners]) fn()
      return Promise.resolve()
    },
    unset: () => Promise.resolve(),
  }
}

function workspace(id: string, title: string, path: string): WorkspaceView {
  return {
    workspaceId: id as WorkspaceId, title, path, sessionIds: [],
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

function mount(initial: ProjectsScopeSection, items: readonly WorkspaceView[], pickFile?: () => Promise<string | null>) {
  const projects = scopeOf(initial)
  const useWorkspaces = ((sel: (s: WorkspaceListState) => unknown) => sel({
    items, archivedSessionIds: [], state: 'idle', phase: 'ready', error: null,
    baselinesReady: true, recentWorkspaceId: undefined,
  })) as never
  const view = render(
    <ProjectsSection
      projects={projects}
      pickFile={pickFile ?? (() => Promise.resolve(null))}
      useWorkspaces={useWorkspaces}
      t={t as never}
    />,
  )
  return { projects, view }
}

afterEach(() => { cleanup() })

describe('ProjectsSection', () => {
  it('renders the empty state when there are no workspaces', () => {
    const { view } = mount({}, [])
    expect(view.getByText(en['empty'])).toBeTruthy()
  })

  it('renders one card per workspace with its stored instructions', () => {
    const { view } = mount(
      { projects: { 'ws-a': { instructions: 'Alpha rules' } } },
      [workspace('ws-a', 'Alpha', '/p/a'), workspace('ws-b', 'Beta', '/p/b')],
    )
    expect(view.getByText('Alpha')).toBeTruthy()
    expect(view.getByText('Beta')).toBeTruthy()
    expect(view.getByDisplayValue('Alpha rules')).toBeTruthy()
  })

  it('saves edited instructions on blur into the projects map', () => {
    const { projects, view } = mount({}, [workspace('ws-a', 'Alpha', '/p/a')])
    const textarea = view.getByPlaceholderText(en['instructions.hint'])
    fireEvent.change(textarea, { target: { value: '  New instructions  ' } })
    fireEvent.blur(textarea)
    expect(projects.writes).toHaveLength(1)
    expect(projects.writes[0]).toEqual({ 'ws-a': { instructions: 'New instructions' } })
  })

  it('attaches a knowledge file picked through the file picker', async () => {
    const pickFile = vi.fn(() => Promise.resolve('/docs/guide.md'))
    const { projects, view } = mount({}, [workspace('ws-a', 'Alpha', '/p/a')], pickFile)
    fireEvent.click(view.getByText(en['knowledge.add']))
    await vi.waitFor(() => {
      expect(projects.writes).toHaveLength(1)
    })
    const written = projects.writes[0] as Record<string, { files: { name: string; path: string }[] }>
    expect(written['ws-a']?.files[0]?.name).toBe('guide.md')
    expect(written['ws-a']?.files[0]?.path).toBe('/docs/guide.md')
  })

  it('removes a knowledge file', () => {
    const { projects, view } = mount(
      { projects: { 'ws-a': { files: [{ id: 'f1', name: 'guide.md', path: '/docs/guide.md' }] } } },
      [workspace('ws-a', 'Alpha', '/p/a')],
    )
    fireEvent.click(view.getByText(en['knowledge.remove']))
    expect(projects.writes).toHaveLength(1)
    expect(projects.writes[0]).toEqual({ 'ws-a': { files: [] } })
  })
})
