// @vitest-environment jsdom
/** The SearXNG page as the Plugins page renders it: its one-liner, its four fields, and what an edit does. */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindSnapshotSelector } from '@deepseek-ai/dsh-client-test-runtime'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { SettingsFieldState, SettingsFormShell } from '@deepseek-ai/dsh-client-ui-primitives'
import { SearxngCard, type SearxngCardProps } from '../src/client/SearxngCard.tsx'
import type { SearxngCardState } from '../src/client/searxng-card-controller.ts'
import { en } from '../src/client/locales.ts'

afterEach(cleanup)

const t = (key: keyof typeof en) => en[key]

const settled: SettingsFormShell = { available: true, writable: true, dirty: false, invalid: false, saving: false, failed: false }

function field(text: string, rest: Partial<SettingsFieldState> = {}): SettingsFieldState {
  return { text, overridden: false, invalid: false, ...rest }
}

function renderCard(state: Partial<SearxngCardState> = {}, view: 'summary' | 'page' = 'page') {
  const store = createSnapshotStore<SearxngCardState>({
    ...settled, baseURL: field(''), language: field(''), categories: field(''), safeSearch: field(''), ...state,
  })
  const actions = { edit: vi.fn(), resetField: vi.fn(), save: vi.fn(), discard: vi.fn() }
  const props = { ...actions, view, t, useSearxngCard: bindSnapshotSelector(store) } as SearxngCardProps
  render(<SearxngCard {...props} />)
  return actions
}

describe('SearxngCard', () => {
  it('renders its one-liner alone in the summary view', () => {
    renderCard({}, 'summary')
    expect(document.body.textContent).toBe(en.description)
    expect(screen.queryByLabelText(en.baseURL)).toBeNull()
  })

  it('shows all four fields on its page', () => {
    renderCard()
    for (const label of [en.baseURL, en.language, en.categories, en.safeSearch]) expect(screen.getByLabelText(label)).toBeTruthy()
  })

  it('stages edits and resets per field instead of writing them', () => {
    const actions = renderCard({ language: field('pt-BR', { overridden: true }), safeSearch: field('1', { overridden: true }) })
    fireEvent.change(screen.getByLabelText(en.baseURL), { target: { value: 'http://searx.local' } })
    fireEvent.change(screen.getByLabelText(en.safeSearch), { target: { value: '2' } })
    for (const reset of screen.getAllByRole('button', { name: en.reset })) fireEvent.click(reset)
    expect(actions.edit.mock.calls).toEqual([['baseURL', 'http://searx.local'], ['safeSearch', '2']])
    expect(actions.resetField.mock.calls).toEqual([['language'], ['safeSearch']])
    expect(actions.save).not.toHaveBeenCalled()
  })

  it('disables its fields when the deployment stores settings read-only', () => {
    renderCard({ writable: false })
    expect(screen.getByLabelText(en.baseURL)).toHaveProperty('disabled', true)
  })
})
