// @vitest-environment jsdom
/**
 * MemorySection component spec: the durable-scope editing behavior (add,
 * edit, delete, blank-guard) against a fake SettingsScope. Validates both the
 * TSX compilation and the user-facing memory-list interactions; the scope
 * fake records writes the way the real durable scope would.
 */
import { describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import type {
  SettingsScope, SettingsScopeSnapshot,
} from '@deepseek-ai/dsh-client-runtime/client'
import { MemorySection } from '@deepseek-ai/dsh-client-ui-memory/src/client/MemorySection.tsx'
import type { MemoryScopeSection } from '@deepseek-ai/dsh-client-ui-memory/src/client/MemorySection.tsx'
import { en } from '@deepseek-ai/dsh-client-ui-memory/src/client/locales.ts'
// Type-only: pulls the package's LocaleNamespaceMap merge so the `t` seat types.
import type {} from '@deepseek-ai/dsh-client-ui-memory/src/client/index.ts'

type MemoryItems = NonNullable<MemoryScopeSection['memories']>

/** Minimal SettingsScope fake over a mutable section (snapshot cached per write). */
function scopeOf(initial: MemoryScopeSection): SettingsScope<MemoryScopeSection> & { writes: unknown[] } {
  const listeners = new Set<() => void>()
  const writes: unknown[] = []
  let snap: SettingsScopeSnapshot<MemoryScopeSection> = {
    status: 'ready', value: initial, base: undefined, user: undefined, revision: 1, writable: true, mode: 'host',
  }
  return {
    writes,
    getSnapshot: () => snap,
    subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    set: (_field, next) => {
      writes.push(next)
      snap = { ...snap, value: { memories: next as MemoryItems } }
      for (const fn of [...listeners]) fn()
      return Promise.resolve()
    },
    unset: () => Promise.resolve(),
  }
}

function mountSection(initial: MemoryScopeSection) {
  const memory = scopeOf(initial)
  const t = ((key: keyof typeof en) => en[key]) as never
  const utils = render(<MemorySection memory={memory} t={t} close={() => {}}
    useSessions={(() => { throw new Error('unused') })} useWorkspaces={(() => { throw new Error('unused') })} />)
  return { memory, ...utils }
}

describe('MemorySection', () => {
  it('renders the empty state when no memories are stored', () => {
    const { getByText } = mountSection({})
    expect(getByText(en['empty'])).toBeTruthy()
    cleanup()
  })

  it('adds a trimmed memory and clears the draft', () => {
    const { memory, getByPlaceholderText, getByText } = mountSection({})
    const field = getByPlaceholderText(en['add.placeholder'])
    fireEvent.change(field, { target: { value: '  Prefere respostas em pt-BR  ' } })
    fireEvent.click(getByText(en['add']))
    expect(memory.writes).toHaveLength(1)
    const written = memory.writes[0] as { id: string; text: string }[]
    expect(written[0]!.text).toBe('Prefere respostas em pt-BR')
    expect(written[0]!.id).toBeTruthy()
    expect(getByText('Prefere respostas em pt-BR')).toBeTruthy()
    cleanup()
  })

  it('keeps the add button disabled on a blank draft', () => {
    const { memory, getByText } = mountSection({})
    const button = getByText(en['add']) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    fireEvent.click(button)
    expect(memory.writes).toHaveLength(0)
    cleanup()
  })

  it('deletes a memory', () => {
    const { memory, getByLabelText, queryByText } = mountSection({
      memories: [{ id: 'm1', text: 'Usa pnpm, nunca npm' }],
    })
    fireEvent.click(getByLabelText(en['delete']))
    expect(memory.writes).toEqual([[]])
    expect(queryByText('Usa pnpm, nunca npm')).toBeNull()
    cleanup()
  })

  it('commits an edit through the save control', () => {
    const { memory, getByText, getByDisplayValue } = mountSection({
      memories: [{ id: 'm1', text: 'texto antigo' }],
    })
    fireEvent.click(getByText(en['edit']))
    const field = getByDisplayValue('texto antigo')
    fireEvent.change(field, { target: { value: 'texto novo' } })
    fireEvent.click(getByText(en['edit.save']))
    expect(memory.writes).toEqual([[{ id: 'm1', text: 'texto novo' }]])
    cleanup()
  })

  it('a blank edit removes the memory', () => {
    const { memory, getByText, getByDisplayValue } = mountSection({
      memories: [{ id: 'm1', text: 'vai sumir' }],
    })
    fireEvent.click(getByText(en['edit']))
    fireEvent.change(getByDisplayValue('vai sumir'), { target: { value: '   ' } })
    fireEvent.click(getByText(en['edit.save']))
    expect(memory.writes).toEqual([[]])
    cleanup()
  })

  it('edits one memory among several and leaves the others untouched', () => {
    const { memory, getAllByText, getByDisplayValue } = mountSection({
      memories: [{ id: 'm1', text: 'primeira' }, { id: 'm2', text: 'segunda' }],
    })
    fireEvent.click(getAllByText(en['edit'])[1]!)
    fireEvent.change(getByDisplayValue('segunda'), { target: { value: 'segunda editada' } })
    fireEvent.click(getAllByText(en['edit.save'])[0]!)
    expect(memory.writes).toEqual([[{ id: 'm1', text: 'primeira' }, { id: 'm2', text: 'segunda editada' }]])
    cleanup()
  })

  it('opens the editor on double click and cancels without writing', () => {
    const { memory, getByText, queryByDisplayValue } = mountSection({
      memories: [{ id: 'm1', text: 'duplo clique' }],
    })
    fireEvent.doubleClick(getByText('duplo clique'))
    expect(queryByDisplayValue('duplo clique')).toBeTruthy()
    fireEvent.click(getByText(en['edit.cancel']))
    expect(queryByDisplayValue('duplo clique')).toBeNull()
    expect(getByText('duplo clique')).toBeTruthy()
    expect(memory.writes).toEqual([])
    cleanup()
  })
})
