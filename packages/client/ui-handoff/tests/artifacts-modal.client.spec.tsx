// @vitest-environment jsdom
// ArtifactsModal: the Hand off surface — aggregates the current session's
// deliverables by turn (newest first), opens files through the Host opener,
// and renders the empty state when nothing was produced.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ISessions } from '@deepseek-ai/dsh-client-runtime/client'
import { ArtifactsModal } from '../src/client/ArtifactsModal.tsx'
import { en } from '../src/client/locales.ts'

const t = (key: string, vars?: Record<string, string>): string => {
  let text = (en as Record<string, string>)[key] ?? key
  for (const [name, value] of Object.entries(vars ?? {})) text = text.replace(`{${name}}`, value)
  return text
}

/** A TurnLocation stub carrying deliverables turn data. */
function turn(produced: readonly string[]) {
  return {
    data: {
      get: (key: string) => (key === 'deliverables'
        ? { produced: produced.map((path, index) => ({ seq: index, path })) }
        : undefined),
    },
  }
}

/** A sessions-service stub resolving one current session's conversation snapshot. */
function sessionsOf(turns: ReadonlyMap<number, unknown>, cwd = '/ws'): ISessions {
  const snapshot = {
    sessionId: 's1',
    chat: { timeline: { turns } },
  }
  const session = {
    getSnapshot: () => snapshot,
    subscribe: () => () => {},
  }
  const list = {
    getSnapshot: () => ({ current: 's1', byId: { s1: { cwd } } }),
    subscribe: () => () => {},
  }
  return {
    list,
    binding: (id: string) => (id === 's1' ? { session } : undefined),
  } as unknown as ISessions
}

afterEach(cleanup)

describe('ArtifactsModal', () => {
  it('renders the empty state when nothing was produced', () => {
    render(<ArtifactsModal sessions={sessionsOf(new Map())} openPath={vi.fn()} t={t as never} />)
    expect(screen.getByText(en['artifacts.empty'])).toBeTruthy()
  })

  it('groups produced files by turn, newest first, deduped', () => {
    const turns = new Map<number, unknown>([
      [1, turn(['/ws/a.ts', '/ws/a.ts', '/ws/b.ts'])],
      [3, turn(['/ws/c.ts'])],
    ])
    render(<ArtifactsModal sessions={sessionsOf(turns)} openPath={vi.fn()} t={t as never} />)
    const titles = screen.getAllByText(/Turn /).map(node => node.textContent)
    expect(titles).toEqual(['Turn 3', 'Turn 1'])
    // Turn 1 produced a.ts (deduped) and b.ts.
    expect(screen.getByText('a.ts')).toBeTruthy()
    expect(screen.getByText('b.ts')).toBeTruthy()
    expect(screen.getByText('c.ts')).toBeTruthy()
  })

  it('opens a produced file through the Host opener resolved against the cwd', () => {
    const openPath = vi.fn()
    const turns = new Map<number, unknown>([[1, turn(['src/a.ts'])]])
    render(<ArtifactsModal sessions={sessionsOf(turns, '/ws')} openPath={openPath} t={t as never} />)
    fireEvent.click(screen.getByText('a.ts'))
    expect(openPath).toHaveBeenCalledWith('/ws/src/a.ts')
  })

  it('renders nothing produced from turns without deliverables data', () => {
    const turns = new Map<number, unknown>([[1, turn([])]])
    render(<ArtifactsModal sessions={sessionsOf(turns)} openPath={vi.fn()} t={t as never} />)
    expect(screen.getByText(en['artifacts.empty'])).toBeTruthy()
  })
})
