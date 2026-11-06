// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { stubConfigForm } from '@deepseek-ai/dsh-client-test-runtime'
import { ProfileSection, type ProfileSectionComponentProps } from '../src/client/ProfileSection.tsx'
import { en } from '../src/client/locales.ts'
import type { MemoryFormValue } from '../src/memory.ts'

afterEach(() => { cleanup() })

const t: ProfileSectionComponentProps['t'] = key => ((en as Record<string, string>)[key] ?? key).replaceAll('{product}', 'DSHC')

function mount(value?: MemoryFormValue) {
  const form = stubConfigForm<MemoryFormValue>()
  if (value !== undefined) form.publish({ status: 'ready', value })
  return { form, ...render(<ProfileSection memory={form.scope} t={t} />) }
}

describe('ProfileSection', () => {
  it('titles the section with the product name and shows the stored fields', () => {
    const view = mount({ memories: [], profileName: 'Ana', instructions: 'Be brief.' })
    expect(view.getByText('Your DSHC')).toBeTruthy()
    expect((view.getByLabelText('What should DSHC call you?') as HTMLInputElement).value).toBe('Ana')
    expect((view.getByLabelText(en['profile.instructions']) as HTMLTextAreaElement).value).toBe('Be brief.')
  })

  it('saves a trimmed field on blur only when it changed, and confirms the save', () => {
    const { form, getByLabelText, queryByRole } = mount({ memories: [], profileName: 'Ana' })
    const name = getByLabelText('What should DSHC call you?')
    fireEvent.blur(name)
    expect(form.set).not.toHaveBeenCalled()
    fireEvent.change(name, { target: { value: '  Ana Paula  ' } })
    expect((name as HTMLInputElement).value).toBe('  Ana Paula  ')
    fireEvent.blur(name)
    expect(form.set).toHaveBeenCalledWith('profileName', 'Ana Paula')
    expect(queryByRole('status')?.textContent).toBe(en['profile.saved'])
    fireEvent.change(getByLabelText(en['profile.instructions']), { target: { value: 'Use metric.' } })
    expect(queryByRole('status')).toBeNull()
    fireEvent.blur(getByLabelText(en['profile.instructions']))
    expect(form.set).toHaveBeenCalledWith('instructions', 'Use metric.')
  })

  it('treats a missing Config value as empty fields', () => {
    const view = mount()
    expect((view.getByLabelText('What should DSHC call you?') as HTMLInputElement).value).toBe('')
  })
})
