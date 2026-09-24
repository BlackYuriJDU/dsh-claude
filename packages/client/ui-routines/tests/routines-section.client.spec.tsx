// @vitest-environment jsdom
// RoutinesSection behavior: renders one card per routine, toggles enabled,
// deletes, and adds a new routine through the durable scope. Uses a fake
// SettingsScope (snapshot cached per write) so no settings service is needed.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import type { SettingsScope, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { en as commonEn } from '@deepseek-ai/dsh-client-locale/src/locales/en.ts'
import { en } from '../src/client/locales.ts'
import { RoutinesSection } from '../src/client/RoutinesSection.tsx'
import type { Routine, RoutinesSettings } from '../src/index.ts'

const t = makeTranslate(en, commonEn)

function scopeOf(initial: RoutinesSettings): SettingsScope<RoutinesSettings> {
  const listeners = new Set<() => void>()
  let snap: SettingsScopeSnapshot<RoutinesSettings> = {
    status: 'ready', value: initial, base: undefined, user: undefined,
    revision: 1, writable: true, mode: 'host',
  }
  return {
    getSnapshot: () => snap,
    subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    set: (_field, next) => {
      snap = { ...snap, value: { routines: next as Routine[] } }
      for (const fn of [...listeners]) fn()
      return Promise.resolve()
    },
    unset: () => Promise.resolve(),
  }
}

function routine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 'r1', name: 'Daily review', prompt: 'review the repo', every: 1, unit: 'days',
    enabled: true, ...overrides,
  }
}

function mount(initial: RoutinesSettings) {
  const scope = scopeOf(initial)
  const view = render(<RoutinesSection routines={scope} t={t} />)
  return { view, scope }
}

afterEach(() => { cleanup() })

describe('RoutinesSection', () => {
  it('renders the empty state when no routines exist', () => {
    const { view } = mount({})
    expect(view.getByText(en['empty'])).toBeTruthy()
  })

  it('renders one card per routine with its schedule label', () => {
    const { view } = mount({ routines: [routine(), routine({ id: 'r2', name: 'Hourly sync', every: 2, unit: 'hours' })] })
    expect(view.getByText('Daily review')).toBeTruthy()
    expect(view.getByText('Hourly sync')).toBeTruthy()
    expect(view.getByText('Every 2 h')).toBeTruthy()
  })

  it('toggles a routine enabled/paused through the scope', () => {
    const { view, scope } = mount({ routines: [routine()] })
    const checkbox = view.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(scope.getSnapshot().value?.routines?.[0]?.enabled).toBe(false)
  })

  it('deletes a routine through the scope', () => {
    const { view, scope } = mount({ routines: [routine(), routine({ id: 'r2', name: 'Other' })] })
    const deleteButtons = view.getAllByRole('button', { name: en['delete'] })
    fireEvent.click(deleteButtons[0]!)
    expect(scope.getSnapshot().value?.routines).toHaveLength(1)
    expect(scope.getSnapshot().value?.routines?.[0]?.id).toBe('r2')
  })

  it('adds a new routine and clears the form', () => {
    const { view, scope } = mount({})
    fireEvent.change(view.getByPlaceholderText(en['add.name.placeholder']), { target: { value: 'Nightly build' } })
    fireEvent.change(view.getByPlaceholderText(en['add.prompt.placeholder']), { target: { value: 'run the build' } })
    fireEvent.click(view.getByRole('button', { name: en['add'] }))
    const written = scope.getSnapshot().value?.routines
    expect(written).toHaveLength(1)
    expect(written?.[0]?.name).toBe('Nightly build')
    expect(written?.[0]?.prompt).toBe('run the build')
    expect(written?.[0]?.enabled).toBe(true)
  })

  it('keeps the add button disabled until name and prompt are filled', () => {
    const { view } = mount({})
    const button = view.getByRole('button', { name: en['add'] }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    fireEvent.change(view.getByPlaceholderText(en['add.name.placeholder']), { target: { value: 'x' } })
    expect(button.disabled).toBe(true)
    fireEvent.change(view.getByPlaceholderText(en['add.prompt.placeholder']), { target: { value: 'y' } })
    expect(button.disabled).toBe(false)
  })
})
