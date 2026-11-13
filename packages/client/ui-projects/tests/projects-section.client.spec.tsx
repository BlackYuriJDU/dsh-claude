// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import type { WorkspaceId, WorkspaceSnapshot } from '@deepseek-ai/dsh-api-workspace-controller/client'
import { stubConfigForm } from '@deepseek-ai/dsh-client-test-runtime'
import { ProjectsSection, type ProjectsSectionComponentProps } from '../src/client/ProjectsSection.tsx'
import { ProjectsPage } from '../src/client/ProjectsPage.tsx'
import { en } from '../src/client/locales.ts'
import type { ProjectsFormValue } from '../src/projects.ts'

afterEach(() => { cleanup() })

const t: ProjectsSectionComponentProps['t'] = key => (en as Record<string, string>)[key] ?? key
const empty: WorkspaceSnapshot = { items: [], archivedSessionIds: [], pinnedSessionIds: [], state: 'idle', phase: 'ready', error: null }
const one: WorkspaceSnapshot = {
  ...empty,
  items: [{ workspaceId: 'ws-1' as WorkspaceId, path: '/work/site', title: 'site', sessionIds: [], createdAt: '', updatedAt: '' }],
}

function mount(workspaces: WorkspaceSnapshot, value?: ProjectsFormValue) {
  const form = stubConfigForm<ProjectsFormValue>()
  if (value !== undefined) form.publish({ status: 'ready', value })
  const view = render(<ProjectsSection projects={form.scope} useWorkspaces={select => select(workspaces)} t={t} />)
  return { form, ...view }
}

describe('ProjectsSection', () => {
  it('shows the empty state without workspaces', () => {
    expect(mount(empty).getByText(en['empty'])).toBeTruthy()
  })

  it('shows one card per workspace with its title, folder, and stored files', () => {
    const view = mount(one, { projects: { 'ws-1': { instructions: 'Be brief.', files: [{ id: 'f1', path: 'docs/a.md' }] } } })
    expect(view.getByText('site')).toBeTruthy()
    expect(view.getByText('/work/site')).toBeTruthy()
    expect(view.getByText('docs/a.md')).toBeTruthy()
    expect((view.getByLabelText(en['instructions']) as HTMLTextAreaElement).value).toBe('Be brief.')
  })

  it('saves trimmed instructions on blur, and only when they changed', () => {
    const { form, getByLabelText, queryByText } = mount(one)
    const field = getByLabelText(en['instructions'])
    fireEvent.blur(field)
    expect(form.set).not.toHaveBeenCalled()
    fireEvent.change(field, { target: { value: '  Use metric.  ' } })
    fireEvent.blur(field)
    expect(form.set).toHaveBeenCalledWith('projects', { 'ws-1': { instructions: 'Use metric.' } })
    expect(queryByText(en['saved'])).toBeTruthy()
    fireEvent.change(field, { target: { value: 'Use metric!' } })
    expect(queryByText(en['saved'])).toBeNull()
  })

  it('shows instructions stored after mount and does not write them back on a plain blur', () => {
    const { form, getByLabelText } = mount(one)
    act(() => { form.publish({ status: 'ready', value: { projects: { 'ws-1': { instructions: 'Stored later.' } } } }) })
    const field = getByLabelText(en['instructions']) as HTMLTextAreaElement
    expect(field.value).toBe('Stored later.')
    fireEvent.blur(field)
    fireEvent.change(field, { target: { value: ' Stored later. ' } })
    fireEvent.blur(field)
    expect(form.set).not.toHaveBeenCalled()
  })

  it('adds a trimmed file path and removes a file, keeping other projects', () => {
    const other = { instructions: 'Other.' }
    const { form, getByLabelText, getByText } = mount(one, { projects: { 'ws-0': other, 'ws-1': { files: [{ id: 'f1', path: 'old.md' }] } } })
    const add = getByText(en['knowledge.add']) as HTMLButtonElement
    expect(add.disabled).toBe(true)
    fireEvent.change(getByLabelText(en['knowledge']), { target: { value: '  notes/new.md ' } })
    fireEvent.click(add)
    const [, added] = form.set.mock.calls[0] as [string, ProjectsFormValue['projects']]
    expect(added['ws-0']).toEqual(other)
    expect(added['ws-1']!.files!.map(file => file.path)).toEqual(['old.md', 'notes/new.md'])
    expect((getByLabelText(en['knowledge']) as HTMLInputElement).value).toBe('')
    fireEvent.click(getByText(en['knowledge.remove']))
    expect(form.set).toHaveBeenLastCalledWith('projects', { 'ws-0': other, 'ws-1': { files: [] } })
  })
})

describe('ProjectsPage', () => {
  it('heads the page once and keeps the project editor', () => {
    const form = stubConfigForm<ProjectsFormValue>()
    const view = render(<ProjectsPage projects={form.scope} useWorkspaces={select => select(one)} t={t} />)
    expect(view.getByRole('heading', { level: 1, name: en['title'] }).textContent).toBe(en['title'])
    expect(view.getAllByText(en['title'])).toHaveLength(1)
    expect(view.getByText('site')).toBeTruthy()
  })
})
