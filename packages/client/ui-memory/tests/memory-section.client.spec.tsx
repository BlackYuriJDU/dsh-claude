// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import type { ConfigForm, ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import { MemorySection, type MemorySectionComponentProps } from '../src/client/MemorySection.tsx'
import { en } from '../src/client/locales.ts'
import type { MemoryFormValue } from '../src/memory.ts'

afterEach(() => { cleanup() })

/** A config form over one mutable value that records every write. */
function formOf(initial: MemoryFormValue | undefined): ConfigForm<MemoryFormValue> & { writes: unknown[] } {
  const listeners = new Set<() => void>()
  const writes: unknown[] = []
  let snapshot: ConfigFormSnapshot<MemoryFormValue> = { status: 'ready', value: initial, base: undefined, user: undefined, revision: 1, writable: true }
  const form = {
    writes,
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    set: (_field: string, next: unknown) => {
      writes.push(next)
      snapshot = { ...snapshot, value: { memories: next as MemoryFormValue['memories'] } }
      for (const listener of [...listeners]) listener()
      return Promise.resolve(true)
    },
    unset: () => Promise.resolve(true),
    mutate: () => Promise.resolve(true),
  }
  return form
}

function mount(initial: MemoryFormValue | undefined) {
  const memory = formOf(initial)
  const t: MemorySectionComponentProps['t'] = key => (en as Record<string, string>)[key] ?? key
  return { memory, ...render(<MemorySection memory={memory} t={t} />) }
}

describe('MemorySection', () => {
  it('shows the empty state before any memory exists', () => {
    expect(mount(undefined).getByText(en['empty'])).toBeTruthy()
  })

  it('adds a trimmed memory through the config form', () => {
    const { memory, getByPlaceholderText, getByText } = mount({ memories: [] })
    fireEvent.change(getByPlaceholderText(en['add.placeholder']), { target: { value: '  Prefers pt-BR  ' } })
    fireEvent.click(getByText(en['add']))
    const written = memory.writes[0] as { id: string; text: string }[]
    expect(written[0]!.text).toBe('Prefers pt-BR')
    expect(written[0]!.id.length).toBeGreaterThan(0)
    expect(getByText('Prefers pt-BR')).toBeTruthy()
  })

  it('keeps the add button disabled on a blank draft', () => {
    const { memory, getByText } = mount({ memories: [] })
    const button = getByText(en['add']) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    fireEvent.click(button)
    expect(memory.writes).toHaveLength(0)
  })

  it('edits, cancels, and deletes a memory; an emptied edit deletes it', () => {
    const { memory, getByText, getByDisplayValue, queryByText, getAllByText } = mount({ memories: [{ id: 'a', text: 'Old' }, { id: 'b', text: 'Keep' }] })
    fireEvent.click(getAllByText(en['edit'])[0]!)
    fireEvent.click(getByText(en['edit.cancel']))
    expect(memory.writes).toHaveLength(0)
    fireEvent.doubleClick(getByText('Old'))
    fireEvent.change(getByDisplayValue('Old'), { target: { value: ' New ' } })
    fireEvent.click(getByText(en['edit.save']))
    expect(memory.writes.at(-1)).toEqual([{ id: 'a', text: 'New' }, { id: 'b', text: 'Keep' }])
    fireEvent.click(getAllByText(en['edit'])[0]!)
    fireEvent.change(getByDisplayValue('New'), { target: { value: '   ' } })
    fireEvent.click(getByText(en['edit.save']))
    expect(memory.writes.at(-1)).toEqual([{ id: 'b', text: 'Keep' }])
    fireEvent.click(getAllByText(en['delete'])[0]!)
    expect(memory.writes.at(-1)).toEqual([])
    expect(queryByText('Keep')).toBeNull()
  })
})
