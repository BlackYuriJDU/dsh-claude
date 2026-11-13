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

  it('saves trimmed instructions on blur, and only when they changed', async () => {
    const { form, getByLabelText, queryByText, findByText } = mount(one)
    const field = getByLabelText(en['instructions'])
    fireEvent.blur(field)
    expect(form.set).not.toHaveBeenCalled()
    fireEvent.change(field, { target: { value: '  Use metric.  ' } })
    fireEvent.blur(field)
    expect(form.set).toHaveBeenCalledWith('projects', { 'ws-1': { instructions: 'Use metric.' } })
    expect(await findByText(en['saved'])).toBeTruthy()
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

  it.each([
    ['refuses', () => Promise.resolve(false)],
    ['fails to reach the Host', () => Promise.reject(new Error('offline'))],
  ] as const)('keeps the instructions draft and reports the failure when the Host %s', async (_case, answer) => {
    const { form, getByLabelText, findByRole, queryByText } = mount(one)
    form.set.mockImplementationOnce(answer)
    const field = getByLabelText(en['instructions']) as HTMLTextAreaElement
    fireEvent.change(field, { target: { value: 'Use metric.' } })
    fireEvent.blur(field)
    expect((await findByRole('alert')).textContent).toBe(en['save.failed'])
    expect(queryByText(en['saved'])).toBeNull()
    expect(field.value).toBe('Use metric.')
  })

  it('keeps typing that arrives while an instructions save is in flight', async () => {
    const { form, getByLabelText, findByText } = mount(one)
    let accept!: (accepted: boolean) => void
    form.set.mockImplementationOnce(() => new Promise<boolean>((resolve) => { accept = resolve }))
    const field = getByLabelText(en['instructions']) as HTMLTextAreaElement
    fireEvent.change(field, { target: { value: 'Use metric.' } })
    fireEvent.blur(field)
    fireEvent.change(field, { target: { value: 'Use metric units.' } })
    act(() => { accept(true) })
    expect(await findByText(en['saved'])).toBeTruthy()
    expect(field.value).toBe('Use metric units.')
  })

  it('applies a second file removal to the first one while the Host has not answered', async () => {
    const files = [{ id: 'f1', path: 'a.md' }, { id: 'f2', path: 'b.md' }, { id: 'f3', path: 'c.md' }]
    const { form, getAllByText } = mount(one, { projects: { 'ws-1': { files } } })
    const answers: ((accepted: boolean) => void)[] = []
    form.set.mockImplementation(() => new Promise<boolean>((resolve) => { answers.push(resolve) }))
    fireEvent.click(getAllByText(en['knowledge.remove'])[0]!)
    fireEvent.click(getAllByText(en['knowledge.remove'])[1]!)
    expect(form.set).toHaveBeenLastCalledWith('projects', { 'ws-1': { files: [files[2]] } })
    await act(async () => { for (const answer of answers) answer(true) })
    // With nothing in flight, the next edit starts from the Host's map again.
    fireEvent.click(getAllByText(en['knowledge.remove'])[2]!)
    expect(form.set).toHaveBeenLastCalledWith('projects', { 'ws-1': { files: [files[0], files[1]] } })
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
    // The add has not been answered yet, so the removal keeps it.
    expect(form.set).toHaveBeenLastCalledWith('projects', { 'ws-0': other, 'ws-1': { files: [{ id: expect.any(String), path: 'notes/new.md' }] } })
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
